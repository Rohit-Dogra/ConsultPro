const express = require('express');
const router = express.Router();



router.post('/update-smtp-configuration', async (req, res) => {

    const {host, user, password} = req.body;

    const [config_id] = await connection.promise().query('SELECT smtp_configuration.id FROM smtp_configuration');
    const insertId = config_id.map(insert => insert.id);

    if (insertId[0]) {

        const query = 'UPDATE smtp_configuration SET  host = ?, user = ?, password = ? WHERE id = ?';
        connection.query(query, [host, user, password, insertId[0]], (err, result) => {
            if (err) {
                console.error('Error updating smtp configuration in MySQL:', err);
                res.status(500).json({error: 'Internal Server Error'});
            } else {
                res.json({message: 'Smtp configuration updated successfully.'});
            }
        });
    } else {

        const query = 'INSERT INTO smtp_configuration ( host, user, password ) VALUES ( ?, ?, ?)';
        connection.query(query, [host, user, password], (err, result) => {
            if (err) {
                console.error('Error inserting smtp configuration in MySQL:', err);
                res.status(500).json({error: 'Internal Server Error'});
            } else {
                res.json({message: 'Smtp configuration saved successfully..'});

            }
        });

    }
});


router.get('/get-smtp-configuration', (req, res) => {
    const query = `
        SELECT smtp_configuration.*
        FROM smtp_configuration
        WHERE smtp_configuration.id = ?
    `;

    connection.query(query, 1, (err, results) => {
        if (err) {
            console.error('Error fetching smtp configuration from MySQL:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            // Check if the user with the given ID exists
            if (results.length === 0) {
                res.status(404).json({error: 'Email Configuration not found'});
            } else {
                res.json(results[0]); // Return the first (and only) result
            }
        }
    });
});


module.exports = router;