const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const auth = require('../middleware/auth');

// Plan ID generation function
function generatePlanId() {
    // Generates a random 5-digit number as a string
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Create a business plan
router.post('/', auth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { 
            business_name,
            product_description,
            functionality,
            is_custom_functionality,
            target_audience,
            objectives
        } = req.body;

        // Validation
        if (!business_name || !product_description || !functionality || !target_audience || !objectives) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Additional validation for custom functionality
        if (is_custom_functionality && !functionality) {
            return res.status(400).json({
                success: false,
                message: 'Custom functionality description is required when is_custom_functionality is true'
            });
        }

        const planId = generatePlanId();

        // Insert into database with is_custom_functionality column
        await connection.execute(
            `INSERT INTO business_plans (
                id,
                user_id,
                business_name,
                product_description,
                functionality,
                is_custom_functionality,
                target_audience,
                objectives,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                planId,
                req.user.user_id,
                business_name,
                product_description,
                functionality,
                is_custom_functionality ? 1 : 0, // Convert boolean to tinyint
                target_audience,
                objectives // Already stringified from frontend
            ]
        );

        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Business plan created successfully',
            data: { planId }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Create business plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating business plan'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add this new route
router.get('/user-plans', auth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [plans] = await connection.execute(
            `SELECT 
                bp.*,
                efo.display_name as functionality_name,
                CASE 
                    WHEN bp.is_custom_functionality = 1 THEN bp.functionality
                    ELSE efo.display_name 
                END as display_functionality
             FROM business_plans bp
             LEFT JOIN expert_functionality_options efo ON bp.functionality = efo.option_value AND bp.is_custom_functionality = 0
             WHERE bp.user_id = ?
             ORDER BY bp.created_at DESC`,
            [req.user.user_id]
        );
        
        // Parse objectives JSON for each plan and format data
        const formattedPlans = plans.map(plan => ({
            ...plan,
            objectives: JSON.parse(plan.objectives),
            is_custom_functionality: plan.is_custom_functionality === 1 // Convert tinyint to boolean
        }));
        
        res.json({
            success: true,
            data: formattedPlans
        });
        
    } catch (error) {
        console.error('Error fetching business plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching business plans'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update the seeker profile fetch route
router.get('/seeker-profile', auth, async (req, res) => {
    let connection;
    
    // Debug logs
    console.log('Seeker profile request received:', {
        userId: req.user?.user_id,
        headers: req.headers
    });
    
    try {
        // Validate user ID
        if (!req.user || !req.user.user_id) {
            console.warn('No user ID in auth token');
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        connection = await pool.getConnection();
        
        // Fetch basic profile info - only use the user_id parameter that we know exists
        const [profileRows] = await connection.execute(
            `SELECT 
                sp.company,
                sp.bio,
                sp.industry_id,
                sp.product_category_id
             FROM seeker_profiles sp
             WHERE sp.user_id = ?`,
            [req.user.user_id]  // Only use parameters we know exist
        );
        
        // Fetch functionalities - no parameters needed
        const [functionalities] = await connection.execute(
            `SELECT id, option_value, display_name 
             FROM expert_functionality_options 
             WHERE is_active = TRUE`
        );
        
        // Fetch objectives - no parameters needed
        const [objectives] = await connection.execute(
            `SELECT 
                id,
                name,
                description,
                function_id
             FROM business_objectives 
             WHERE is_active = TRUE 
             ORDER BY function_id, name`
        );
        
        console.log('Successfully fetched seeker profile data', {
            userId: req.user.user_id,
            profileCount: profileRows.length,
            functionalitiesCount: functionalities.length,
            objectivesCount: objectives.length
        });
        
        res.json({
            success: true,
            data: {
                profile: profileRows.length > 0 ? profileRows[0] : null,
                functionalities,
                objectives
            }
        });

    } catch (error) {
        console.error('Error fetching seeker data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add a new route to fetch objectives by function ID
router.get('/objectives/:functionId', auth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [objectives] = await connection.execute(
            `SELECT 
                id,
                name,
                description,
                function_id
             FROM business_objectives
             WHERE function_id = ? AND is_active = true
             ORDER BY name`,
            [req.params.functionId]
        );

        res.json({
            success: true,
            data: objectives
        });

    } catch (error) {
        console.error('Error fetching objectives:', {
            functionId: req.params.functionId,
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Error fetching objectives'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;