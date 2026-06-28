const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

function generateProfileId() {
    // Generates a random 5-digit number as a string
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Add turnover validation constants
const TURNOVER_LIMITS = {
    Thousands: 999999,  // $999,999 thousand
    Millions: 10000     // $10,000 million ($10 billion)
};

// Update the validateTurnover function
const validateTurnover = (amount, unit) => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    return !isNaN(numAmount) && 
           numAmount >= 0 && 
           numAmount <= TURNOVER_LIMITS[unit];
};

// Update the validation function to match new requirements
const validateProfileData = async (body, connection) => {
    const requiredFields = [
        'user_id',
        'name', 
        'email',
        'experience',
        'location',
        'bio',
        // Remove 'interests' from required fields
        'industry_id',
        'product_category_id'
    ];

    // Optional fields that don't need validation
    const optionalFields = [
        'company',
        'position'
    ];

    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    
    // Validate experience format (2 digits, 0-99)
    if (body.experience) {
        const expNum = parseInt(body.experience, 10);
        if (isNaN(expNum) || expNum < 0 || expNum > 99 || !(/^\d{1,2}$/.test(body.experience))) {
            missingFields.push('Experience must be between 0 and 99');
        }
    }

    // URL validations - only if provided
    if (body.linkedin_url && !body.linkedin_url.match(/^https?:\/\/([a-zA-Z0-9-]+\.)?linkedin\.com\/.*$/)) {
        missingFields.push('Invalid LinkedIn URL format');
    }
    if (body.website_url && !body.website_url.match(/^https?:\/\/.+/)) {
        missingFields.push('Invalid website URL format');
    }

    // Add industry and product category validation
    if (body.industry_id && body.product_category_id) {
        const [industryExists] = await connection.execute(
            'SELECT id FROM industries WHERE id = ?',
            [body.industry_id]
        );

        if (!industryExists.length) {
            missingFields.push('Invalid industry selected');
        }

        const [categoryExists] = await connection.execute(
            'SELECT id FROM product_categories WHERE id = ? AND industry_id = ?',
            [body.product_category_id, body.industry_id]
        );

        if (!categoryExists.length) {
            missingFields.push('Invalid product category for selected industry');
        }
    }

    // Validate turnover format if provided
    if (body.turnover) {
        const turnoverValue = body.turnover.trim();
        // Updated regex for USD format: "50 Thousands", "1.5 Millions", etc.
        const turnoverRegex = /^[\d,]+(\.\d{1,2})?\s+(Thousands|Millions)$/;
        
        if (!turnoverRegex.test(turnoverValue)) {
            missingFields.push('Invalid turnover format. Example: "50 Thousands", "1.5 Millions"');
        } else {
            const [amount, unit] = turnoverValue.split(' ');
            if (!validateTurnover(amount, unit)) {
                missingFields.push(
                    `Turnover amount must be between 0 and ${TURNOVER_LIMITS[unit].toLocaleString()} ${unit}`
                );
            }
        }
    }

    return missingFields;
};

// Create seeker profile
router.post('/seeker', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        const user_id = req.user?.id || req.body.user_id;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: user_id'
            });
        }

        const missingFields = await validateProfileData(req.body, connection);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed: Missing or invalid required fields',
                errors: missingFields
            });
        }

        const {
            name,
            email,
            experience,
            location,
            bio,
            company = '',
            position = '',
            linkedin_url = null,
            website_url = null,
            industry_id,
            product_category_id,
            turnover = null,
            seed_segment_code = null,
            company_size = null,
            date_of_birth = null
        } = req.body;

        // Format turnover before saving
        let formattedTurnover = null;
        if (turnover) {
            const [amount, unit] = turnover.trim().split(' ');
            // Format amount with 2 decimal places max and remove trailing zeros
            const formattedAmount = parseFloat(amount.replace(/,/g, ''))
                .toFixed(2)
                .replace(/\.?0+$/, '');
            formattedTurnover = `${formattedAmount} ${unit}`;
        }

        // Start transaction
        await connection.beginTransaction();

        try {
            const profileId = generateProfileId();

            const [result] = await connection.execute(
                `INSERT INTO seeker_profiles (
                    id,
                    user_id,
                    name,
                    email,
                    experience,
                    location,
                    bio,
                    company,
                    position,
                    linkedin_url,
                    website_url,
                    industry_id,
                    product_category_id,
                    turnover,
                    seed_segment_code,
                    company_size,
                    date_of_birth,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    profileId,
                    user_id,
                    name.trim(),
                    email.toLowerCase(),
                    experience.trim(),
                    location.trim(),
                    bio.trim(),
                    company.trim(),
                    position.trim(),
                    linkedin_url?.trim() || null,
                    website_url?.trim() || null,
                    industry_id,
                    product_category_id,
                    formattedTurnover,
                    seed_segment_code,
                    company_size?.trim() || null,
                    date_of_birth
                ]
            );

            await connection.execute(
                `UPDATE users 
                 SET profile_completed = 1
                 WHERE id = ?`,
                [user_id]
            );

            await connection.commit();

            // Get industry and category names for response
            const [[industryData]] = await connection.execute(
                'SELECT name FROM industries WHERE id = ?',
                [industry_id]
            );

            const [[categoryData]] = await connection.execute(
                'SELECT name FROM product_categories WHERE id = ?',
                [product_category_id]
            );

            // Include turnover in response
            res.status(201).json({
                success: true,
                message: 'Profile created successfully',
                data: {
                    id: profileId,
                    user_id,
                    industry: industryData?.name,
                    productCategory: categoryData?.name,
                    turnover: formattedTurnover
                }
            });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        }

    } catch (error) {
        console.error('Profile creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create profile',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update the get profile route
router.get('/seeker/:userId', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        const [profiles] = await connection.execute(`
            SELECT 
                sp.*,
                i.name as industry_name,
                pc.name as product_category_name,
                ss.name as seed_segment_name
            FROM seeker_profiles sp
            LEFT JOIN industries i ON sp.industry_id = i.id
            LEFT JOIN product_categories pc ON sp.product_category_id = pc.id
            LEFT JOIN seed_segments ss ON sp.seed_segment_code COLLATE utf8mb4_unicode_ci = ss.code COLLATE utf8mb4_unicode_ci
            WHERE sp.user_id = ?
        `, [req.params.userId]);

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            data: profiles[0]
        });

    } catch (error) {
        console.error('Error fetching seeker profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update basic seeker profile (industry and product category)
router.put('/seeker/update-basic', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        const { user_id, industry_id, product_category_id } = req.body;
        
        if (!user_id || !industry_id || !product_category_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user_id, industry_id, product_category_id'
            });
        }

        // Validate industry exists
        const [industryExists] = await connection.execute(
            'SELECT id FROM industries WHERE id = ?',
            [industry_id]
        );

        if (!industryExists.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid industry selected'
            });
        }

        // Validate product category exists and belongs to industry
        const [categoryExists] = await connection.execute(
            'SELECT id FROM product_categories WHERE id = ? AND industry_id = ?',
            [product_category_id, industry_id]
        );

        if (!categoryExists.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product category for selected industry'
            });
        }

        // Update or insert seeker profile
        const [existingProfile] = await connection.execute(
            'SELECT id FROM seeker_profiles WHERE user_id = ?',
            [user_id]
        );

        if (existingProfile.length > 0) {
            // Update existing profile
            await connection.execute(
                'UPDATE seeker_profiles SET industry_id = ?, product_category_id = ?, updated_at = NOW() WHERE user_id = ?',
                [industry_id, product_category_id, user_id]
            );
        } else {
            // Create basic profile with minimal required fields
            const profileId = generateProfileId();
            await connection.execute(
                `INSERT INTO seeker_profiles (
                    id, user_id, name, email, company, position, experience, location, bio,
                    industry_id, product_category_id, created_at, updated_at
                ) VALUES (?, ?, '', '', '', '', '0', '', '', ?, ?, NOW(), NOW())`,
                [profileId, user_id, industry_id, product_category_id]
            );
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Error updating seeker profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update existing seeker profile
router.put('/seeker/:userId', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        const userId = req.params.userId;
        const user_id = req.user?.id || req.body.user_id;
        
        // Verify user can only update their own profile
        if (user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own profile'
            });
        }

        const missingFields = await validateProfileData(req.body, connection);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed: Missing or invalid required fields',
                errors: missingFields
            });
        }

        const {
            name,
            email,
            experience,
            location,
            bio,
            company = '',
            position = '',
            linkedin_url = null,
            website_url = null,
            industry_id,
            product_category_id,
            turnover = null,
            seed_segment_code = null,
            company_size = null,
            date_of_birth = null
        } = req.body;

        // Format turnover before saving
        let formattedTurnover = null;
        if (turnover) {
            const [amount, unit] = turnover.trim().split(' ');
            const formattedAmount = parseFloat(amount.replace(/,/g, ''))
                .toFixed(2)
                .replace(/\.?0+$/, '');
            formattedTurnover = `${formattedAmount} ${unit}`;
        }

        // Update existing profile
        const [result] = await connection.execute(
            `UPDATE seeker_profiles SET 
                name = ?,
                email = ?,
                experience = ?,
                location = ?,
                bio = ?,
                company = ?,
                position = ?,
                linkedin_url = ?,
                website_url = ?,
                industry_id = ?,
                product_category_id = ?,
                turnover = ?,
                seed_segment_code = ?,
                company_size = ?,
                date_of_birth = ?,
                updated_at = NOW()
             WHERE user_id = ?`,
            [
                name.trim(),
                email.toLowerCase(),
                experience.trim(),
                location.trim(),
                bio.trim(),
                company.trim(),
                position.trim(),
                linkedin_url?.trim() || null,
                website_url?.trim() || null,
                industry_id,
                product_category_id,
                formattedTurnover,
                seed_segment_code,
                company_size?.trim() || null,
                date_of_birth,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Update user profile_completed status
        await connection.execute(
            'UPDATE users SET profile_completed = 1 WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;