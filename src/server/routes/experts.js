const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authenticateToken = require('../middleware/auth');
const { cacheSearchResults } = require('../middleware/cache');

// Connection pool optimization
const getConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1');
      return connection;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
};
// const { validateCallAccess } = require('../middleware/callTracker');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Move helper functions to the top of the file, outside any routes
function generateProfileId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Add this helper function at the top of the file
const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
};

// Helper function to safely process values
const safeValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value.trim();
  return value;
};




// Create expert profile
router.post('/profile', authenticateToken, async (req, res) => {
  let connection;
  try {
    console.log('Received profile data:', req.body);
    console.log('Auth user:', req.user);

    // Check for user ID in both places
    const userId = req.user?.id || req.user?.user_id || req.body.user_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Validate required fields
      const requiredFields = [
        'first_name', 'last_name', 'designation', 'functionality',
        'phone_number', 'work_experience', 'current_organization',
        'location', 'expertise', 'areas_of_help'  // Remove audio_pricing from here
      ];
      
      const missingFields = requiredFields.filter(field => 
        !req.body[field] && req.body[field] !== 0
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Check if user exists
      const [userCheck] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }

      // Check for existing profile
      const [existingProfile] = await connection.execute(
        'SELECT id FROM expert_profiles WHERE user_id = ?',
        [userId]
      );
      
      if (existingProfile.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Expert profile already exists for this user'
        });
      }

      // Insert main profile
      const profileId = generateProfileId();
      await connection.execute(`
        INSERT INTO expert_profiles (
          id, user_id, first_name, last_name, designation,
          functionality, is_custom_functionality, date_of_birth,
          phone_number, work_experience, current_organization,
          location, expertise, areas_of_help, audio_pricing,
          linkedin_url, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
      `, [
        profileId,
        userId,
        safeValue(req.body.first_name),
        safeValue(req.body.last_name),
        safeValue(req.body.designation),
        safeValue(req.body.functionality),
        Boolean(req.body.is_custom_functionality),
        formatDate(req.body.date_of_birth),
        safeValue(req.body.phone_number),
        parseInt(req.body.work_experience) || 0,
        safeValue(req.body.current_organization),
        safeValue(req.body.location),
        safeValue(req.body.expertise),
        safeValue(req.body.areas_of_help),
        parseFloat(req.body.audio_pricing) || 0,
        safeValue(req.body.linkedin_url) || ''
      ]);

      // Add functionality mapping if not custom
      if (!req.body.is_custom_functionality && req.body.functionality_id) {
        const functionalityId = parseInt(req.body.functionality_id);
        if (!isNaN(functionalityId)) {
          await connection.execute(`
            INSERT INTO expert_functionality_mapping 
              (id, expert_id, functionality_id) 
            VALUES 
              (UUID(), ?, ?)
            ON DUPLICATE KEY UPDATE
              created_at = CURRENT_TIMESTAMP
          `, [
            userId,
            functionalityId
          ]);

          console.log('Added functionality mapping:', { userId, functionalityId });
        } else {
          console.warn('Invalid functionality ID:', req.body.functionality_id);
        }
      }

      // Process education entries
      if (Array.isArray(req.body.education) && req.body.education.length > 0) {
        // First remove any existing education entries for this user
        await connection.execute(
          'DELETE FROM expert_education WHERE expert_id = ?',
          [userId]
        );
        
        // Insert new education entries
        for (const edu of req.body.education) {
          await connection.execute(`
            INSERT INTO expert_education (
              expert_id, school, degree, field_of_study,
              start_date, end_date, grade, activities, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userId,
            safeValue(edu.school),
            safeValue(edu.degree),
            safeValue(edu.field_of_study),
            formatDate(edu.start_date),
            formatDate(edu.end_date),
            safeValue(edu.grade),
            safeValue(edu.activities),
            safeValue(edu.description)
          ]);
        }
        
        console.log(`Added ${req.body.education.length} education entries`);
      }

      // Process experience entries
      if (Array.isArray(req.body.experience) && req.body.experience.length > 0) {
        // First remove any existing experience entries for this user
        await connection.execute(
          'DELETE FROM expert_experience WHERE expert_id = ?',
          [userId]
        );
        
        // Insert new experience entries
        for (const exp of req.body.experience) {
          await connection.execute(`
            INSERT INTO expert_experience (
              expert_id, title, employment_type, company,
              location, start_date, end_date, is_current,
              industry, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userId,
            safeValue(exp.title),
            safeValue(exp.employment_type),
            safeValue(exp.company),
            safeValue(exp.location),
            formatDate(exp.start_date),
            formatDate(exp.end_date),
            Boolean(exp.is_current),
            safeValue(exp.industry),
            safeValue(exp.description)
          ]);
        }
        
        console.log(`Added ${req.body.experience.length} experience entries`);
      }

      // Process awards entries (optional)
      if (Array.isArray(req.body.awards) && req.body.awards.length > 0) {
        // First remove any existing awards entries for this user
        await connection.execute(
          'DELETE FROM expert_awards WHERE expert_id = ?',
          [userId]
        );
        
        // Insert new awards entries
        for (const award of req.body.awards) {
          await connection.execute(`
            INSERT INTO expert_awards (
              expert_id, title, issuer, issue_date, description
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            userId,
            safeValue(award.title),
            safeValue(award.issuer),
            formatDate(award.issue_date),
            safeValue(award.description)
          ]);
        }
        
        console.log(`Added ${req.body.awards.length} award entries`);
      }

      // Update user's profile completion status
      await connection.execute(
        'UPDATE users SET profile_completed = 1 WHERE id = ?',
        [userId]
      );

      await connection.commit();
      console.log('Profile created successfully with ID:', profileId); 
      
      res.status(201).json({
        success: true,
        message: 'Expert profile created successfully',
        data: { 
          id: profileId, 
          user_id: userId,
          functionality_id: !req.body.is_custom_functionality ? 
            parseInt(req.body.functionality_id) : null
        }
      });

    } catch (error) {
      console.error('Error in database operations:', error);
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create profile'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get expert profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [profiles] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE user_id = ?',
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        res.json({
            success: true,
            data: profiles[0]
        });
    } catch (error) {
        console.error('Error fetching expert profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    }
});

// Get expert details by user_id from consultation request
router.get('/consultation-expert/:user_id', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;

    // First get the expert_id from user_consultation_requests
    const [consultationRequest] = await connection.execute(
      'SELECT expert_id FROM user_consultation_requests WHERE user_id = ? AND expert_id IS NOT NULL ORDER BY created_at DESC LIMIT 1',
      [user_id]
    );

    if (!consultationRequest.length || !consultationRequest[0].expert_id) {
      return res.json({
        success: true,
        data: null,
        message: 'No expert selected for consultation'
      });
    }

    const expertId = consultationRequest[0].expert_id;

    // Get expert details from expert_profiles table
    const [expertProfile] = await connection.execute(
      `SELECT 
        ep.id,
        ep.user_id,
        ep.first_name,
        ep.last_name,
        ep.designation,
        ep.current_organization,
        ep.location,
        ep.expertise,
        ep.areas_of_help,
        ep.work_experience,
        ep.audio_pricing,
        ep.profile_image,
        ep.linkedin_url
      FROM expert_profiles ep
      WHERE ep.user_id = ? AND ep.status = 'Approved'`,
      [expertId]
    );

    if (!expertProfile.length) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found or not approved'
      });
    }

    const expert = expertProfile[0];
    
    // Format the response
    const formattedExpert = {
      id: expert.id,
      user_id: expert.user_id,
      name: `${expert.first_name} ${expert.last_name}`,
      firstName: expert.first_name,
      lastName: expert.last_name,
      designation: expert.designation,
      currentOrganization: expert.current_organization,
      location: expert.location,
      expertise: expert.expertise,
      areasOfHelp: expert.areas_of_help,
      workExperience: expert.work_experience,
      audioPricing: expert.audio_pricing,
      profileImage: expert.profile_image,
      linkedinUrl: expert.linkedin_url
    };

    res.json({
      success: true,
      data: formattedExpert
    });

  } catch (error) {
    console.error('Error fetching consultation expert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert details',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Public endpoint for experts (no authentication required)
router.get('/profiles/public', async (req, res) => {
    const { functionality_id, functionality_ids, status = 'approved', require_complete = 'true' } = req.query;
    let connection;
    
    try {
        connection = await pool.getConnection();
        
        // Normalize status to match database format
        const dbStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        
        let query, params = [];
        
        if (functionality_ids) {
            // Handle multiple functionality IDs (comma-separated)
            const ids = functionality_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid functionality IDs' });
            }
            
            const placeholders = ids.map(() => '?').join(',');
            query = `
                SELECT DISTINCT 
                    ep.id, ep.user_id, ep.first_name, ep.last_name, ep.designation,
                    ep.work_experience, ep.current_organization, ep.location,
                    ep.expertise, ep.areas_of_help, ep.audio_pricing, ep.status,
                    ep.profile_image, ep.created_at, efm.functionality_id, efo.display_name as functionality_name
                FROM expert_profiles ep
                INNER JOIN expert_functionality_mapping efm ON ep.user_id = efm.expert_id
                INNER JOIN expert_functionality_options efo ON efm.functionality_id = efo.id
                WHERE ep.status = ? AND efm.functionality_id IN (${placeholders})
            `;
            params = [dbStatus, ...ids];
        } else if (functionality_id) {
            // Single functionality ID
            query = `
                SELECT DISTINCT 
                    ep.id, ep.user_id, ep.first_name, ep.last_name, ep.designation,
                    ep.work_experience, ep.current_organization, ep.location,
                    ep.expertise, ep.areas_of_help, ep.audio_pricing, ep.status,
                    ep.profile_image, ep.created_at, efm.functionality_id, efo.display_name as functionality_name
                FROM expert_profiles ep
                INNER JOIN expert_functionality_mapping efm ON ep.user_id = efm.expert_id
                INNER JOIN expert_functionality_options efo ON efm.functionality_id = efo.id
                WHERE ep.status = ? AND efm.functionality_id = ?
            `;
            params.push(dbStatus, parseInt(functionality_id));
        } else {
            // Get all approved experts
            query = `
                SELECT DISTINCT 
                    ep.id, ep.user_id, ep.first_name, ep.last_name, ep.designation,
                    ep.work_experience, ep.current_organization, ep.location,
                    ep.expertise, ep.areas_of_help, ep.audio_pricing, ep.status,
                    ep.profile_image, ep.created_at, NULL as functionality_id, NULL as functionality_name
                FROM expert_profiles ep
                WHERE ep.status = ?
            `;
            params.push(dbStatus);
        }
        
        if (require_complete === 'true') {
            query += ` AND ep.first_name IS NOT NULL AND ep.first_name != ''
                      AND ep.last_name IS NOT NULL AND ep.last_name != ''
                      AND ep.designation IS NOT NULL AND ep.designation != ''
                      AND ep.expertise IS NOT NULL AND ep.expertise != ''`;
        }
        
        query += ` ORDER BY ep.created_at DESC`;

        const [experts] = await connection.execute(query, params);

        // Process expertise field and map field names to match frontend expectations
        const processedExperts = experts.map(expert => ({
            ...expert,
            firstName: expert.first_name,
            lastName: expert.last_name,
            workExperience: expert.work_experience,
            currentOrganization: expert.current_organization,
            expertise: typeof expert.expertise === 'string' 
                ? expert.expertise.split(',').map(s => s.trim()).filter(s => s)
                : expert.expertise || [],
            rating: 0,
            reviews: 0,
            imageUrl: expert.profile_image ? `${process.env.API_URL}/uploads/${expert.profile_image}` : null
        }));

        res.json({
            success: true,
            data: processedExperts,
            metadata: {
                total: processedExperts.length,
                filtered_by: functionality_ids ? { functionality_ids } : (functionality_id ? { functionality_id } : null)
            }
        });

    } catch (error) {
        console.error('Error fetching public expert profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profiles',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add this route before your existing /profiles route
router.get('/profiles', async (req, res) => {
    const { functionality_id } = req.query;
    let connection;
    
    try {
        connection = await getConnection();
        await connection.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ committed');
        
        // Simplified query to avoid DISTINCT issues with deterministic ordering
        let query, params = [];
        
        if (functionality_id) {
            query = `
                SELECT 
                    ep.id,
                    ep.user_id,
                    ep.first_name,
                    ep.last_name,
                    ep.designation,
                    ep.work_experience,
                    ep.current_organization,
                    ep.location,
                    ep.expertise,
                    ep.areas_of_help,
                    ep.audio_pricing,
                    ep.profile_image,
                    ep.status,
                    ep.created_at,
                    ? as functionality_id,
                    efo.display_name as functionality_name
                FROM expert_profiles ep
                CROSS JOIN expert_functionality_options efo
                WHERE ep.status = 'Approved'
                AND ep.first_name IS NOT NULL AND ep.first_name != ''
                AND ep.last_name IS NOT NULL AND ep.last_name != ''
                AND ep.designation IS NOT NULL AND ep.designation != ''
                AND ep.expertise IS NOT NULL AND ep.expertise != ''
                AND EXISTS (
                    SELECT 1 FROM expert_functionality_mapping efm 
                    WHERE efm.expert_id = ep.user_id AND efm.functionality_id = ?
                )
                AND efo.id = ?
                ORDER BY ep.user_id, ep.created_at DESC
            `;
            params = [functionality_id, functionality_id, functionality_id];
        } else {
            query = `
                SELECT 
                    ep.id,
                    ep.user_id,
                    ep.first_name,
                    ep.last_name,
                    ep.designation,
                    ep.work_experience,
                    ep.current_organization,
                    ep.location,
                    ep.expertise,
                    ep.areas_of_help,
                    ep.audio_pricing,
                    ep.profile_image,
                    ep.status,
                    ep.created_at,
                    NULL as functionality_id,
                    NULL as functionality_name
                FROM expert_profiles ep
                WHERE ep.status = 'Approved'
                AND ep.first_name IS NOT NULL AND ep.first_name != ''
                AND ep.last_name IS NOT NULL AND ep.last_name != ''
                AND ep.designation IS NOT NULL AND ep.designation != ''
                AND ep.expertise IS NOT NULL AND ep.expertise != ''
                ORDER BY ep.user_id, ep.created_at DESC
            `;
        }

        const [experts] = await connection.execute(query, params);

        res.json({
            success: true,
            data: experts,
            metadata: {
                total: experts.length,
                filtered_by: functionality_id ? { functionality_id } : null
            }
        });

    } catch (error) {
        console.error('Error fetching expert profiles:', error);
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable',
                retry: true
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error fetching expert profiles'
            });
        }
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
});


// Update expert profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // Remove twitter and instagram from destructuring
        const {
            first_name,
            last_name,
            designation,
            work_experience,
            current_organization,
            location,
            expertise,
            areas_of_help,
            phone_number,
            audio_pricing,
            linkedin
        } = req.body;

        // Validate numeric fields
        if (audio_pricing && isNaN(parseFloat(audio_pricing))) {
            return res.status(400).json({
                success: false,
                message: 'Audio pricing must be a valid number'
            });
        }

        const [result] = await pool.execute(
            `UPDATE expert_profiles 
             SET first_name = ?,
                 last_name = ?,
                 designation = ?,
                 work_experience = ?,
                 current_organization = ?,
                 location = ?,
                 expertise = ?,
                 areas_of_help = ?,
                 phone_number = ?,
                 audio_pricing = ?,
                 linkedin_url = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [
                first_name,
                last_name,
                designation,
                work_experience,
                current_organization,
                location,
                expertise,
                areas_of_help,
                phone_number,
                audio_pricing,
                linkedin || null,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        const [updatedProfile] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE user_id = ?',
            [req.user.id]
        );

        if (updatedProfile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Updated profile not found'
            });
        }

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                first_name: updatedProfile[0].first_name,
                last_name: updatedProfile[0].last_name,
                designation: updatedProfile[0].designation,
                work_experience: updatedProfile[0].work_experience,
                current_organization: updatedProfile[0].current_organization,
                location: updatedProfile[0].location,
                expertise: updatedProfile[0].expertise,
                areas_of_help: updatedProfile[0].areas_of_help,
                phone_number: updatedProfile[0].phone_number,
                audio_pricing: updatedProfile[0].audio_pricing,
                linkedin: updatedProfile[0].linkedin_url
            }
        });
    } catch (error) {
        console.error('Error updating expert profile:', error);
        
        // Handle specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user reference'
            });
        }

        // Handle authentication errors
        if (error.name && error.name.startsWith('JsonWebToken')) {
            return handleAuthError(error, res);
        }

        res.status(500).json({
            success: false,
            message: 'Error updating expert profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
});

// Get expert profile by ID or user_id (moved after /profiles/public to avoid conflicts)
router.get('/profiles/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find by profile id first, then by user_id
        let profiles;
        const [profilesById] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE id = ?',
            [id]
        );

        if (profilesById.length > 0) {
            profiles = profilesById;
        } else {
            // If not found by id, try by user_id
            const [profilesByUserId] = await pool.execute(
                'SELECT * FROM expert_profiles WHERE user_id = ?',
                [id]
            );
            profiles = profilesByUserId;
        }

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        const profile = profiles[0];
        const formattedProfile = {
            id: profile.id,
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            firstName: profile.first_name,
            lastName: profile.last_name,
            designation: profile.designation,
            dateOfBirth: profile.date_of_birth,
            phoneNumber: profile.phone_number,
            workExperience: profile.work_experience,
            currentOrganization: profile.current_organization,
            location: profile.location,
            expertise: profile.expertise,
            areasOfHelp: profile.areas_of_help,
            areas_of_help: profile.areas_of_help,
            audioPricing: profile.audio_pricing,
            audio_pricing: profile.audio_pricing,
            linkedinUrl: profile.linkedin_url,
            status: profile.status
        };

        res.json({
            success: true,
            data: formattedProfile
        });
    } catch (error) {
        console.error('Error fetching expert profile by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    }
});

// Update expert profile sections
router.put('/profile/:user_id', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.params.user_id;
    const { section, data } = req.body;

    // Validate that the user is updating their own profile
    const userFromToken = req.user.user_id || req.user.id;
    if (userFromToken !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Helper to ensure no undefined is sent to SQL
    const safe = v => v === undefined ? null : v;

    // You can expand this switch if you have more sections
    let updateQuery = '';
    let params = [];

    if (section === 'personal') {
      updateQuery = `
        UPDATE expert_profiles
        SET
          designation = ?,
          expertise = ?,
          areas_of_help = ?
        WHERE user_id = ?
      `;
      params = [
        safe(data.designation),
        safe(data.expertise),
        safe(data.areas_of_help),
        userId
      ];
    } else if (section === 'contact') {
      // Remove email from contact updates - email should not be changeable
      updateQuery = `
        UPDATE expert_profiles
        SET
          phone_number = ?,
          current_organization = ?,
          location = ?,
          work_experience = ?
        WHERE user_id = ?
      `;
      params = [
        safe(data.phone_number),
        safe(data.current_organization),
        safe(data.location),
        safe(data.work_experience),
        userId
      ];
    } else if (section === 'pricing') {
      updateQuery = `
        UPDATE expert_profiles
        SET
          audio_pricing = ?
        WHERE user_id = ?
      `;
      params = [
        safe(data.audio_pricing),
        userId
      ];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid section' });
    }

    // Execute the update
    const [result] = await connection.execute(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Fetch and return the updated profile
    const [updatedProfile] = await connection.execute(
      'SELECT * FROM expert_profiles WHERE user_id = ?',
      [userId]
    );

    if (!updatedProfile.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({
      success: true,
      data: updatedProfile[0]
    });
  } catch (error) {
    console.error('Error updating expert profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Debug route to check JWT token content
router.get('/debug-token', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Token decoded successfully',
    data: req.user
  });
});

// Fast PUT API for contact information updates (email excluded)
router.put('/contact/:user_id', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.params.user_id;
    const { phone_number, current_organization, location, work_experience } = req.body;

    // Validate that the user is updating their own profile
    const userFromToken = req.user.user_id || req.user.id;
    console.log('Contact API Auth check:', { userFromToken, userId, reqUser: req.user });
    // Temporarily comment out auth check for debugging
    // if (userFromToken !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only update your own profile'
    //   });
    // }

    // Update only contact fields (excluding email)
    const [result] = await connection.execute(`
      UPDATE expert_profiles
      SET
        phone_number = ?,
        current_organization = ?,
        location = ?,
        work_experience = ?,
        updated_at = NOW()
      WHERE user_id = ?
    `, [
      phone_number || null,
      current_organization || null,
      location || null,
      work_experience || null,
      userId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Fetch updated profile
    const [updatedProfile] = await connection.execute(`
      SELECT ep.*, u.email 
      FROM expert_profiles ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.user_id = ?
    `, [userId]);

    res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: updatedProfile[0]
    });

  } catch (error) {
    console.error('Error updating contact information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add this new route for fetching profile by user_id
router.get('/profile/:user_id', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.params;

        const [profiles] = await connection.execute(
            `SELECT ep.*, u.email, fo.display_name as functionality_name, ep.status,
                    ep.profile_image
             FROM expert_profiles ep
             JOIN users u ON ep.user_id = u.id
             LEFT JOIN expert_functionality_options fo 
                ON ep.functionality = fo.option_value
             WHERE ep.user_id = ?`,
            [user_id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        res.json({
            success: true,
            data: profiles[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add this route for fetching functionalities
router.get('/functionalities', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [functionalities] = await connection.execute(
            'SELECT id, option_value, display_name FROM expert_functionality_options WHERE is_active = 1'
        );
        
        res.json({
            success: true,
            data: functionalities
        });
    } catch (error) {
        console.error('Error fetching functionalities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch functionalities'
        });
    } finally {
        if (connection) connection.release();
    }
});


// Update the verify-user endpoint with better logging and checks
router.post('/verify-user', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.body;

        console.log('Verifying user ID:', user_id);

        // Check if user exists in users table
        const [users] = await connection.execute(
            `SELECT id, email, role 
             FROM users 
             WHERE id = ? AND role = 'expert'`,
            [user_id]
        );

        console.log('User query result:', users);

        if (!users || users.length === 0) {
            console.log('No user found with ID:', user_id);
            return res.status(404).json({
                success: false,
                message: 'User not found in the system or is not an expert'
            });
        }

        // Check if profile already exists
        const [existingProfile] = await connection.execute(
            'SELECT id FROM expert_profiles WHERE user_id = ?',
            [user_id]
        );

        console.log('Existing profile check:', existingProfile);

        if (existingProfile && existingProfile.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Expert profile already exists'
            });
        }

        res.json({
            success: true,
            message: 'User verified successfully',
            data: users[0]
        });

    } catch (error) {
        console.error('Error in verify-user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify user'
        });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/education', authenticateToken, async (req, res) => {
  try {
    const { 
      school, 
      degree, 
      field_of_study, 
      start_date, 
      end_date = null,
      grade = null,
      activities = null,
      description = null
    } = req.body;

    // Get user ID from auth token
    const userId = req.user?.id || req.user?.user_id; // Try both formats
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('Processing education entry for user:', userId);

    // Validate required fields
    if (!school?.trim() || !degree?.trim() || !field_of_study?.trim() || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: school, degree, field_of_study, and start_date are required'
      });
    }

    // Check if user exists in users table
    const [userExists] = await req.app.locals.db.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (!userExists.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Insert education entry
    const [result] = await req.app.locals.db.execute(
      `INSERT INTO expert_education 
       (expert_id, school, degree, field_of_study, start_date, end_date, grade, activities, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        school.trim(),
        degree.trim(),
        field_of_study.trim(),
        start_date,
        end_date,
        grade?.trim() || null,
        activities?.trim() || null,
        description?.trim() || null
      ]
    );

    res.json({
      success: true,
      data: {
        id: result.insertId,
        expert_id: userId,
        school: school.trim(),
        degree: degree.trim(),
        field_of_study: field_of_study.trim(),
        start_date: start_date,
        end_date: end_date,
        grade: grade?.trim() || null,
        activities: activities?.trim() || null,
        description: description?.trim() || null,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to save education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save education',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/experience', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      employment_type,
      company, 
      location, 
      start_date,
      end_date,
      is_current,
      industry, 
      description 
    } = req.body;

    // Get user ID from auth token
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('Processing experience for user:', userId);

    // Validate required fields
    if (!title?.trim() || !company?.trim() || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: title, company, and start_date are required'
      });
    }

    // Format dates and boolean
    const formattedStartDate = new Date(start_date).toISOString().split('T')[0];
    const formattedEndDate = is_current ? null : (end_date ? new Date(end_date).toISOString().split('T')[0] : null);
    const isCurrent = Boolean(is_current);

    // Insert experience entry
    const [result] = await req.app.locals.db.execute(
      `INSERT INTO expert_experience 
       (expert_id, title, employment_type, company, location, start_date, end_date, 
        is_current, industry, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        employment_type?.trim() || null,
        company.trim(),
        location?.trim() || null,
        formattedStartDate,
        formattedEndDate,
        isCurrent,
        industry?.trim() || null,
        description?.trim() || null
      ]
    );

    res.json({
      success: true,
      data: {
        id: result.insertId,
        expert_id: userId,
        title: title.trim(),
        employment_type: employment_type?.trim() || null,
        company: company.trim(),
        location: location?.trim() || null,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        is_current: isCurrent,
        industry: industry?.trim() || null,
        description: description?.trim() || null,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to save experience:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save experience',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post('/awards', authenticateToken, async (req, res) => {
  try {
    const { title, issuer, issue_date, description } = req.body;

    // Get user ID from auth token
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('Processing award for user:', userId);

    // Validate required fields
    if (!title?.trim() || !issue_date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: title and issue_date are required'
      });
    }

    // Format date
    const formattedIssueDate = new Date(issue_date).toISOString().split('T')[0];

    // Insert award entry
    const [result] = await req.app.locals.db.execute(
      `INSERT INTO expert_awards 
       (expert_id, title, issuer, issue_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        issuer?.trim() || null,
        formattedIssueDate,
        description?.trim() || null
      ]
    );

    res.json({
      success: true,
      data: {
        id: result.insertId,
        expert_id: userId,
        title: title.trim(),
        issuer: issuer?.trim() || null,
        issue_date: formattedIssueDate,
        description: description?.trim() || null,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to save award:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save award',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add GET routes to fetch entries
router.get('/education/:expertId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT * FROM expert_education WHERE expert_id = ? ORDER BY start_date DESC',
      [req.params.expertId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Failed to fetch education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education'
    });
  }
});

router.get('/experience/:expertId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT * FROM expert_experience WHERE expert_id = ? ORDER BY start_date DESC',
      [req.params.expertId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Failed to fetch experience:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experience'
    });
  }
});

router.get('/awards/:expertId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT * FROM expert_awards WHERE expert_id = ? ORDER BY issue_date DESC',
      [req.params.expertId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Failed to fetch awards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch awards'
    });
  }
});

// Get education details for expert profile
router.get('/education-details/:expertId', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { expertId } = req.params;

    // Query to get education details with proper formatting
    const [rows] = await connection.execute(`
      SELECT 
        id,
        school,
        degree,
        field_of_study,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        grade,
        activities,
        description,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM expert_education 
      WHERE expert_id = ?
      ORDER BY start_date DESC, end_date DESC
    `, [expertId]);

    if (!rows.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No education details found'
      });
    }

    // Format the response data
    const formattedData = rows.map(edu => ({
      id: edu.id,
      school: edu.school,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      start_date: edu.start_date,
      end_date: edu.end_date,
      grade: edu.grade,
      activities: edu.activities,
      description: edu.description,
      created_at: edu.created_at,
      duration: calculateDuration(edu.start_date, edu.end_date),
      is_current: !edu.end_date
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching education details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Helper function to calculate duration
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  
  let duration = '';
  if (years > 0) {
    duration += `${years} year${years > 1 ? 's' : ''} `;
  }
  if (months > 0 || years === 0) {
    duration += `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return duration.trim();
}

// Get experience details for expert profile
router.get('/experience-details/:expertId', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { expertId } = req.params;

    // Query to get experience details with proper date formatting
    const [rows] = await connection.execute(`
      SELECT 
        id,
        title,
        employment_type,
        company,
        location,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        is_current,
        industry,
        description,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM expert_experience 
      WHERE expert_id = ?
      ORDER BY start_date DESC, end_date DESC
    `, [expertId]);

    if (!rows.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No experience details found'
      });
    }

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching experience details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experience details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get awards details for expert profile
router.get('/awards-details/:expertId', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { expertId } = req.params;

    // Query to get awards details with proper date formatting
    const [rows] = await connection.execute(`
      SELECT 
        id,
        title,
        issuer,
        DATE_FORMAT(issue_date, '%Y-%m-%d') as issue_date,
        description,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM expert_awards 
      WHERE expert_id = ?
      ORDER BY issue_date DESC
    `, [expertId]);

    if (!rows.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No awards details found'
      });
    }

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching awards details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch awards details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add a new route to update profile status (for admins only)
router.put('/profile/status/:profileId', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { profileId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['Pending', 'Approved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either Pending or Approved'
      });
    }

    // Update profile status
    const [result] = await connection.execute(
      'UPDATE expert_profiles SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, profileId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Get updated profile
    const [updatedProfile] = await connection.execute(
      'SELECT * FROM expert_profiles WHERE id = ?',
      [profileId]
    );

    res.json({
      success: true,
      message: `Profile status updated to ${status}`,
      data: updatedProfile[0]
    });

  } catch (error) {
    console.error('Error updating profile status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Batch update all education entries for an expert
router.put('/education-details/:expertId', authenticateToken, async (req, res) => {
  try {
    const { education } = req.body;
    const expertId = req.params.expertId;

    // Remove old entries
    await req.app.locals.db.execute('DELETE FROM expert_education WHERE expert_id = ?', [expertId]);

    // Insert new entries
    if (Array.isArray(education)) {
      for (const edu of education) {
        await req.app.locals.db.execute(
          `INSERT INTO expert_education 
            (expert_id, school, degree, field_of_study, start_date, end_date, grade, activities, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expertId,
            edu.school?.trim() || '',
            edu.degree?.trim() || '',
            edu.field_of_study?.trim() || '',
            edu.start_date,
            edu.end_date,
            edu.grade?.trim() || null,
            edu.activities?.trim() || null,
            edu.description?.trim() || null
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Batch update all experience entries for an expert
router.put('/experience-details/:expertId', authenticateToken, async (req, res) => {
  try {
    const { experience } = req.body;
    const expertId = req.params.expertId;

    await req.app.locals.db.execute('DELETE FROM expert_experience WHERE expert_id = ?', [expertId]);

    if (Array.isArray(experience)) {
      for (const exp of experience) {
        await req.app.locals.db.execute(
          `INSERT INTO expert_experience 
            (expert_id, title, employment_type, company, location, start_date, end_date, is_current, industry, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expertId,
            exp.title?.trim() || '',
            exp.employment_type?.trim() || null,
            exp.company?.trim() || '',
            exp.location?.trim() || null,
            exp.start_date,
            exp.end_date,
            Boolean(exp.is_current),
            exp.industry?.trim() || null,
            exp.description?.trim() || null
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Batch update all awards entries for an expert
router.put('/awards-details/:expertId', authenticateToken, async (req, res) => {
  try {
    const { awards } = req.body;
    const expertId = req.params.expertId;

    await req.app.locals.db.execute('DELETE FROM expert_awards WHERE expert_id = ?', [expertId]);

    if (Array.isArray(awards)) {
      for (const award of awards) {
        await req.app.locals.db.execute(
          `INSERT INTO expert_awards 
            (expert_id, title, issuer, issue_date, description)
            VALUES (?, ?, ?, ?, ?)`,
          [
            expertId,
            award.title?.trim() || '',
            award.issuer?.trim() || null,
            award.issue_date,
            award.description?.trim() || null
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public LinkedIn search endpoint (no authentication required)
router.post('/linkedin-search/public', cacheSearchResults, async (req, res) => {
  try {
    const { 
      name, 
      company, 
      title, 
      location, 
      functionality, 
      subcategory,
      experienceYears = 15,
      limit = 9
    } = req.body;
    
    // Validate inputs
    if (!name && !company && !title && !location && !functionality && !subcategory) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }
    
    // Get SERP API key from environment variables
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      // Return mock data if no API key
      const mockProfiles = [
        {
          name: `${functionality || 'Business'} Expert 1`,
          headline: `Senior ${functionality || 'Business'} Consultant`,
          location: 'New York, NY',
          profileUrl: 'https://linkedin.com/in/expert1',
          currentPosition: `${functionality || 'Business'} Director`,
          company: 'Global Consulting Inc',
          profileImageUrl: null,
          yearsOfExperience: experienceYears,
          functionality: functionality || null,
          subcategory: subcategory || null
        },
        {
          name: `${functionality || 'Business'} Expert 2`,
          headline: `${functionality || 'Business'} Strategy Lead`,
          location: 'San Francisco, CA',
          profileUrl: 'https://linkedin.com/in/expert2',
          currentPosition: `Senior ${functionality || 'Business'} Manager`,
          company: 'Tech Solutions LLC',
          profileImageUrl: null,
          yearsOfExperience: experienceYears + 2,
          functionality: functionality || null,
          subcategory: subcategory || null
        }
      ];
      
      return res.json({
        success: true,
        data: mockProfiles.slice(0, limit)
      });
    }
    
    // Build the search query
    let query = "site:linkedin.com/in/";
    
    // Add experience keywords
    query += ` "${experienceYears}+ years experience"`;
    
    // Add other search parameters
    if (name) query += ` ${name}`;
    if (company) query += ` ${company}`;
    if (title) query += ` ${title}`;
    if (location) query += ` ${location}`;
    if (functionality) query += ` ${functionality}`;
    if (subcategory) query += ` ${subcategory}`;
    
    console.log(`Searching LinkedIn profiles with query: "${query}"`);
    
    // Call SERP API
    const response = await fetch(`https://serpapi.com/search?api_key=${apiKey}&engine=google&q=${encodeURIComponent(query)}&num=${limit}&gl=us`);
    
    if (!response.ok) {
      console.error(`SERP API error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and transform the results
    const profiles = (data.organic_results || []).map(result => {
      const profileUrl = result.link;
      const name = result.title.split(' - ')[0] || '';
      const headline = result.title.split(' - ')[1] || null;
      const snippet = result.snippet || '';
      
      // Extract additional data from snippet
      const locationMatch = snippet.match(/(?:Location|Based in):\s*([^•]+)/i);
      const positionMatch = snippet.match(/(?:Current|Present):\s*([^•]+)/i);
      const companyMatch = snippet.match(/at\s+([^•]+)/i);
      
      // Try to extract years of experience
      const experienceMatch = snippet.match(/(\d+)\+?\s*(?:years|yrs)(?:\s*of)?\s*experience/i);
      const yearsOfExperience = experienceMatch ? parseInt(experienceMatch[1], 10) : experienceYears;
      
      return {
        name: name.trim(),
        headline: headline?.trim() || null,
        location: locationMatch ? locationMatch[1].trim() : null,
        profileUrl,
        currentPosition: positionMatch ? positionMatch[1].trim() : null,
        company: companyMatch ? companyMatch[1].trim() : null,
        profileImageUrl: result.thumbnail || null,
        yearsOfExperience,
        functionality: functionality || null,
        subcategory: subcategory || null
      };
    });
    
    console.log(`Found ${profiles.length} LinkedIn profiles`);
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('LinkedIn search API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search LinkedIn profiles',
      error: error.message
    });
  }
});

// LinkedIn profile search endpoint
router.post('/linkedin-search', authenticateToken, cacheSearchResults, async (req, res) => {
  let connection;
  try {
    const { 
      name, 
      company, 
      title, 
      location, 
      functionality, 
      subcategory,
      experienceYears = 15,
      limit = 5,
      requestId  // Add this parameter
    } = req.body;
    
    // First check if the session request already has experts found
    if (requestId) {
      connection = await pool.getConnection();
      
      const [requestData] = await connection.execute(
        'SELECT expert_filter_result FROM session_requests WHERE id = ?',
        [requestId]
      );
      
      if (requestData.length > 0 && requestData[0].expert_filter_result === 'found') {
        if (connection) connection.release();
        return res.json({
          success: false,
          message: 'Experts already found for this session request',
          data: {
            expertsExist: true
          }
        });
      }
      
      if (connection) {
        connection.release();
        connection = null;
      }
    }
    
    // Validate inputs
    if (!name && !company && !title && !location && !functionality && !subcategory) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }
    
    // Get SERP API key from environment variables
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Search API configuration is missing'
      });
    }
    
    // Build the search query
    let query = "site:linkedin.com/in/";
    
    // Add experience keywords
    query += ` "experience ${experienceYears}+ years"}`;
    
    // Add other search parameters
    if (name) query += ` ${name}`;
    if (company) query += ` ${company}`;
    if (title) query += ` ${title}`;
    if (location) query += ` ${location}`;
    if (functionality) query += ` ${functionality}`;
    if (subcategory) query += ` ${subcategory}`;
    
    console.log(`Searching LinkedIn profiles with query: "${query}"`);
    
    // Call SERP API
    const response = await fetch(`https://serpapi.com/search?api_key=${apiKey}&engine=google&q=${encodeURIComponent(query)}&num=${limit}&gl=us`);
    
    if (!response.ok) {
      console.error(`SERP API error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and transform the results
    const profiles = (data.organic_results || []).map(result => {
      const profileUrl = result.link;
      const name = result.title.split(' - ')[0] || '';
      const headline = result.title.split(' - ')[1] || null;
      const snippet = result.snippet || '';
      
      // Extract additional data from snippet with improved regex patterns
      const locationMatch = snippet.match(/(?:Location|Based in):\s*([^•]+)/i);
      const positionMatch = snippet.match(/(?:Current|Present):\s*([^•]+)/i);
      const companyMatch = snippet.match(/at\s+([^•]+)/i);
      
      // Try to extract years of experience
      const experienceMatch = snippet.match(/(\d+)\+?\s*(?:years|yrs)(?:\s*of)?\s*experience/i);
      const yearsOfExperience = experienceMatch ? parseInt(experienceMatch[1], 10) : experienceYears;
      
      return {
        name: name.trim(),
        headline: headline?.trim() || null,
        location: locationMatch ? locationMatch[1].trim() : null,
        profileUrl,
        currentPosition: positionMatch ? positionMatch[1].trim() : null,
        company: companyMatch ? companyMatch[1].trim() : null,
        profileImageUrl: result.thumbnail || null,
        yearsOfExperience,
        functionality: functionality || null,
        subcategory: subcategory || null,
        searchDate: new Date().toISOString(),
        requestId: requestId || null
      };
    });
    
    // Store profiles in database
    if (profiles.length > 0) {
      await storeLinkedInProfiles(profiles, req.user.id, requestId);
    }
    
    console.log(`Found ${profiles.length} LinkedIn profiles`);
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('LinkedIn search API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search LinkedIn profiles',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add a function to store LinkedIn profiles with request ID
async function storeLinkedInProfiles(profiles, userId, requestId = null) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Begin transaction
    await connection.beginTransaction();
    
    // Insert profiles
    for (const profile of profiles) {
      // Check if profile already exists
      const [existing] = await connection.execute(
        'SELECT id FROM linkedin_profiles WHERE profile_url = ?',
        [profile.profileUrl]
      );
      
      if (existing.length > 0) {
        // Update existing record
        await connection.execute(`
          UPDATE linkedin_profiles 
          SET 
            name = ?,
            headline = ?,
            location = ?,
            current_position = ?,
            company = ?,
            profile_image_url = ?,
            years_of_experience = ?,
            functionality = ?,
            subcategory = ?,
            last_updated = NOW(),
            search_count = search_count + 1
          WHERE profile_url = ?
        `, [
          profile.name,
          profile.headline,
          profile.location,
          profile.currentPosition,
          profile.company,
          profile.profileImageUrl,
          profile.yearsOfExperience,
          profile.functionality,
          profile.subcategory,
          profile.profileUrl
        ]);
        
        // Record search history with request ID
        await connection.execute(`
          INSERT INTO linkedin_search_history (
            profile_id, user_id, search_date, search_terms, request_id
          ) VALUES (
            (SELECT id FROM linkedin_profiles WHERE profile_url = ?),
            ?,
            NOW(),
            ?,
            ?
          )
        `, [
          profile.profileUrl,
          userId,
          JSON.stringify({
            functionality: profile.functionality,
            subcategory: profile.subcategory
          }),
          requestId
        ]);
        
      } else {
        // Insert new record
        const [result] = await connection.execute(`
          INSERT INTO linkedin_profiles (
            name,
            headline,
            location,
            profile_url,
            current_position,
            company,
            profile_image_url,
            years_of_experience,
            functionality,
            subcategory,
            created_at,
            last_updated,
            search_count,
            request_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, ?)
        `, [
          profile.name,
          profile.headline,
          profile.location,
          profile.profileUrl,
          profile.currentPosition,
          profile.company,
          profile.profileImageUrl,
          profile.yearsOfExperience,
          profile.functionality,
          profile.subcategory,
          requestId
        ]);
        
        // Record search history with request ID
        if (result.insertId) {
          await connection.execute(`
            INSERT INTO linkedin_search_history (
              profile_id, user_id, search_date, search_terms, request_id
            ) VALUES (?, ?, NOW(), ?, ?)
          `, [
            result.insertId,
            userId,
            JSON.stringify({
              functionality: profile.functionality,
              subcategory: profile.subcategory
            }),
            requestId
          ]);
        }
      }
    }
    
    // If we have a requestId, update the session request with found status
    if (requestId && profiles.length > 0) {
      await connection.execute(`
        UPDATE session_requests
        SET 
          expert_filter_result = 'found',
          expert_filter_date = NOW()
        WHERE id = ?
      `, [requestId]);
    }
    
    // Commit transaction
    await connection.commit();
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error storing LinkedIn profiles:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Seed endpoint to create sample expert profiles
router.post('/debug/seed', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        // Check if we already have data
        const [existingCount] = await connection.execute('SELECT COUNT(*) as count FROM expert_profiles');
        if (existingCount[0].count > 0) {
            return res.json({
                success: false,
                message: 'Database already has expert profiles. Skipping seed.'
            });
        }
        
        // Create sample users first
        const sampleUsers = [
            { id: 'user1', email: 'expert1@example.com', role: 'expert' },
            { id: 'user2', email: 'expert2@example.com', role: 'expert' },
            { id: 'user3', email: 'expert3@example.com', role: 'expert' }
        ];
        
        for (const user of sampleUsers) {
            await connection.execute(`
                INSERT IGNORE INTO users (id, email, role, profile_completed) 
                VALUES (?, ?, ?, 1)
            `, [user.id, user.email, user.role]);
        }
        
        // Create sample expert profiles
        const sampleProfiles = [
            {
                id: '10001',
                user_id: 'user1',
                first_name: 'John',
                last_name: 'Smith',
                designation: 'Senior Business Strategy Consultant',
                functionality: 'business_strategy',
                phone_number: '+1-555-0101',
                work_experience: 15,
                current_organization: 'Strategic Solutions Inc',
                location: 'New York, NY',
                expertise: 'Business Strategy, Market Analysis, Growth Planning',
                areas_of_help: 'Strategic planning, market entry strategies, business model optimization',
                audio_pricing: 150,
                status: 'Approved'
            },
            {
                id: '10002',
                user_id: 'user2',
                first_name: 'Sarah',
                last_name: 'Johnson',
                designation: 'HR Transformation Expert',
                functionality: 'hr_solutions',
                phone_number: '+1-555-0102',
                work_experience: 12,
                current_organization: 'People First Consulting',
                location: 'San Francisco, CA',
                expertise: 'HR Strategy, Talent Management, Organizational Development',
                areas_of_help: 'HR transformation, talent acquisition, performance management',
                audio_pricing: 120,
                status: 'Approved'
            },
            {
                id: '10003',
                user_id: 'user3',
                first_name: 'Michael',
                last_name: 'Chen',
                designation: 'Digital Transformation Lead',
                functionality: 'digital_transformation',
                phone_number: '+1-555-0103',
                work_experience: 18,
                current_organization: 'Tech Innovation Partners',
                location: 'Seattle, WA',
                expertise: 'Digital Strategy, Cloud Migration, Process Automation',
                areas_of_help: 'Digital transformation roadmaps, technology adoption, change management',
                audio_pricing: 180,
                status: 'Approved'
            }
        ];
        
        for (const profile of sampleProfiles) {
            await connection.execute(`
                INSERT INTO expert_profiles (
                    id, user_id, first_name, last_name, designation, functionality,
                    phone_number, work_experience, current_organization, location,
                    expertise, areas_of_help, audio_pricing, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                profile.id, profile.user_id, profile.first_name, profile.last_name,
                profile.designation, profile.functionality, profile.phone_number,
                profile.work_experience, profile.current_organization, profile.location,
                profile.expertise, profile.areas_of_help, profile.audio_pricing, profile.status
            ]);
        }
        
        // Create functionality options (let database assign random IDs)
        const functionalityOptions = [
            { option_value: 'business_strategy', display_name: 'Business Strategy & Growth', is_active: 1 },
            { option_value: 'hr_solutions', display_name: 'HR & Workforce Solutions', is_active: 1 },
            { option_value: 'operations_manufacturing', display_name: 'Operations & Manufacturing', is_active: 1 },
            { option_value: 'digital_transformation', display_name: 'Digital Transformation & IT', is_active: 1 },
            { option_value: 'financial_advisory', display_name: 'Financial & Risk Advisory', is_active: 1 },
            { option_value: 'marketing_brand', display_name: 'Marketing & Brand Positioning', is_active: 1 }
        ];
        
        for (const option of functionalityOptions) {
            await connection.execute(`
                INSERT IGNORE INTO expert_functionality_options 
                (option_value, display_name, is_active) 
                VALUES (?, ?, ?)
            `, [option.option_value, option.display_name, option.is_active]);
        }
        
        // Fetch the actual functionality_ids from database
        const [fetchedFunctionalities] = await connection.execute(`
            SELECT id, option_value FROM expert_functionality_options 
            WHERE option_value IN ('business_strategy', 'hr_solutions', 'operations_manufacturing', 'digital_transformation', 'financial_advisory', 'marketing_brand')
        `);
        
        const functionalityMap = {};
        fetchedFunctionalities.forEach(f => {
            functionalityMap[f.option_value] = f.id;
        });
        
        // Add more sample experts for other functionalities
        const additionalUsers = [
            { id: 'user4', email: 'expert4@example.com', role: 'expert' },
            { id: 'user5', email: 'expert5@example.com', role: 'expert' },
            { id: 'user6', email: 'expert6@example.com', role: 'expert' }
        ];
        
        for (const user of additionalUsers) {
            await connection.execute(`
                INSERT IGNORE INTO users (id, email, role, profile_completed) 
                VALUES (?, ?, ?, 1)
            `, [user.id, user.email, user.role]);
        }
        
        const additionalProfiles = [
            {
                id: '10004', user_id: 'user4', first_name: 'Lisa', last_name: 'Wang',
                designation: 'Operations Excellence Manager', functionality: 'operations_manufacturing',
                phone_number: '+1-555-0104', work_experience: 10, current_organization: 'Manufacturing Pro',
                location: 'Chicago, IL', expertise: 'Lean Manufacturing, Process Optimization',
                areas_of_help: 'Operations improvement, supply chain optimization', audio_pricing: 130, status: 'Approved'
            },
            {
                id: '10005', user_id: 'user5', first_name: 'David', last_name: 'Brown',
                designation: 'Financial Risk Advisor', functionality: 'financial_advisory', 
                phone_number: '+1-555-0105', work_experience: 14, current_organization: 'Finance Solutions',
                location: 'Boston, MA', expertise: 'Risk Management, Financial Planning',
                areas_of_help: 'Financial strategy, risk assessment', audio_pricing: 160, status: 'Approved'
            },
            {
                id: '10006', user_id: 'user6', first_name: 'Emma', last_name: 'Davis',
                designation: 'Brand Marketing Director', functionality: 'marketing_brand',
                phone_number: '+1-555-0106', work_experience: 11, current_organization: 'Brand Builders',
                location: 'Los Angeles, CA', expertise: 'Brand Strategy, Digital Marketing',
                areas_of_help: 'Brand positioning, marketing campaigns', audio_pricing: 140, status: 'Approved'
            }
        ];
        
        for (const profile of additionalProfiles) {
            await connection.execute(`
                INSERT INTO expert_profiles (
                    id, user_id, first_name, last_name, designation, functionality,
                    phone_number, work_experience, current_organization, location,
                    expertise, areas_of_help, audio_pricing, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                profile.id, profile.user_id, profile.first_name, profile.last_name,
                profile.designation, profile.functionality, profile.phone_number,
                profile.work_experience, profile.current_organization, profile.location,
                profile.expertise, profile.areas_of_help, profile.audio_pricing, profile.status
            ]);
        }
        
        // Create mappings using actual functionality_ids from database
        const mappings = [
            { expert_id: 'user1', option_value: 'business_strategy' },
            { expert_id: 'user2', option_value: 'hr_solutions' },
            { expert_id: 'user4', option_value: 'operations_manufacturing' },
            { expert_id: 'user3', option_value: 'digital_transformation' },
            { expert_id: 'user5', option_value: 'financial_advisory' },
            { expert_id: 'user6', option_value: 'marketing_brand' }
        ];
        
        for (const mapping of mappings) {
            const functionalityId = functionalityMap[mapping.option_value];
            if (functionalityId) {
                await connection.execute(`
                    INSERT INTO expert_functionality_mapping (id, expert_id, functionality_id)
                    VALUES (UUID(), ?, ?)
                `, [mapping.expert_id, functionalityId]);
            }
        }
        
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Sample expert profiles created successfully',
            data: {
                profilesCreated: sampleProfiles.length + additionalProfiles.length,
                mappingsCreated: mappings.length,
                functionalityMap
            }
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Seed endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed database',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Simple test endpoint to check if any experts exist
router.get('/test/all', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Get all experts without any filtering
        const [allExperts] = await connection.execute('SELECT id, first_name, last_name, status FROM expert_profiles LIMIT 10');
        
        res.json({
            success: true,
            data: allExperts,
            count: allExperts.length
        });
        
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Test query failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Get expert education data
router.get('/:user_id/education', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;

    const [education] = await connection.execute(
      `SELECT degree, field_of_study, school, start_date, end_date 
       FROM expert_education 
       WHERE expert_id = ? 
       ORDER BY end_date DESC, start_date DESC 
       LIMIT 1`,
      [user_id]
    );

    res.json({
      success: true,
      data: education
    });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education data'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Debug endpoint to check database content
router.get('/debug/count', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Count total expert profiles
        const [profileCount] = await connection.execute('SELECT COUNT(*) as count FROM expert_profiles');
        
        // Count approved profiles
        const [approvedCount] = await connection.execute('SELECT COUNT(*) as count FROM expert_profiles WHERE status = "Approved"');
        
        // Count functionality mappings
        const [mappingCount] = await connection.execute('SELECT COUNT(*) as count FROM expert_functionality_mapping');
        
        // Get functionality options
        const [functionalityOptions] = await connection.execute('SELECT * FROM expert_functionality_options');
        
        // Get sample profiles with mappings
        const [sampleProfiles] = await connection.execute(`
            SELECT ep.id, ep.first_name, ep.last_name, ep.status, efm.functionality_id, efo.display_name
            FROM expert_profiles ep
            LEFT JOIN expert_functionality_mapping efm ON ep.user_id = efm.expert_id
            LEFT JOIN expert_functionality_options efo ON efm.functionality_id = efo.id
            LIMIT 10
        `);
        
        // Get all mappings
        const [allMappings] = await connection.execute(`
            SELECT efm.*, ep.first_name, ep.last_name, efo.display_name
            FROM expert_functionality_mapping efm
            JOIN expert_profiles ep ON efm.expert_id = ep.user_id
            JOIN expert_functionality_options efo ON efm.functionality_id = efo.id
        `);
        
        res.json({
            success: true,
            data: {
                totalProfiles: profileCount[0].count,
                approvedProfiles: approvedCount[0].count,
                functionalityMappings: mappingCount[0].count,
                functionalityOptions,
                sampleProfiles,
                allMappings
            }
        });
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug query failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Handle preflight OPTIONS request for image upload
router.options('/upload-image/:user_id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://expertisestation.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Upload profile image
router.post('/upload-image/:user_id', authenticateToken, upload.single('profileImage'), async (req, res) => {
  // Set CORS headers explicitly for this route
  res.setHeader('Access-Control-Allow-Origin', 'https://expertisestation.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  let connection;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    connection = await pool.getConnection();
    const userId = req.params.user_id;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update expert profile with image URL
    const [result] = await connection.execute(
      'UPDATE expert_profiles SET profile_image = ? WHERE user_id = ?',
      [imageUrl, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});



// Get expert details by user_id from consultation request
router.get('/consultation-expert/:user_id', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;

    // First get the expert_id from user_consultation_requests
    const [consultationRequest] = await connection.execute(
      'SELECT expert_id FROM user_consultation_requests WHERE user_id = ? AND expert_id IS NOT NULL ORDER BY created_at DESC LIMIT 1',
      [user_id]
    );

    if (!consultationRequest.length || !consultationRequest[0].expert_id) {
      return res.json({
        success: true,
        data: null,
        message: 'No expert selected for consultation'
      });
    }

    const expertId = consultationRequest[0].expert_id;

    // Get expert details from expert_profiles table
    const [expertProfile] = await connection.execute(
      `SELECT 
        ep.id,
        ep.user_id,
        ep.first_name,
        ep.last_name,
        ep.designation,
        ep.current_organization,
        ep.location,
        ep.expertise,
        ep.areas_of_help,
        ep.work_experience,
        ep.audio_pricing,
        ep.profile_image,
        ep.linkedin_url
      FROM expert_profiles ep
      WHERE ep.user_id = ? AND ep.status = 'Approved'`,
      [expertId]
    );

    if (!expertProfile.length) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found or not approved'
      });
    }

    const expert = expertProfile[0];
    
    // Format the response
    const formattedExpert = {
      id: expert.id,
      user_id: expert.user_id,
      name: `${expert.first_name} ${expert.last_name}`,
      firstName: expert.first_name,
      lastName: expert.last_name,
      designation: expert.designation,
      currentOrganization: expert.current_organization,
      location: expert.location,
      expertise: expert.expertise,
      areasOfHelp: expert.areas_of_help,
      workExperience: expert.work_experience,
      audioPricing: expert.audio_pricing,
      profileImage: expert.profile_image,
      linkedinUrl: expert.linkedin_url
    };

    res.json({
      success: true,
      data: formattedExpert
    });

  } catch (error) {
    console.error('Error fetching consultation expert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert details',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

