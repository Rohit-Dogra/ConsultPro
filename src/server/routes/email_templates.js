const express = require('express');
const router = express.Router();
const connection = require('../models/db');


router.get('/get-email-templates', (req, res) => {
    const query=`
        SELECT email_templates.id, template_types.name as templateName
        FROM email_templates
                 LEFT JOIN template_types ON email_templates.template_type = template_types.id`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching email templates from MySQL:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            res.json(results);
        }
    });
});

router.post('/save-email-template', (req, res) => {
    const {body, subject, templateType} = req.body;
    connection.query('SELECT * FROM email_templates WHERE email_templates.template_type = ?', [templateType], async (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking template name:', checkErr);
            res.status(500).json({error: 'Internal Server Error'});
        } else if (checkResults.length > 0) {
            res.status(400).json({error: 'Template already in use'});

        } else {
                 const query = 'INSERT INTO email_templates( body, subject, template_type ) VALUES ( ?, ?, ?)';
                connection.query(query, [body, subject, templateType], (err, result) => {
                 if (err) {
                    console.error('Error inserting email template into MySQL:', err);
                      res.status(500).json({error: 'Internal Server Error'});
                  } else {
                     res.json({message: 'Email template added successfully.'});
                 }
                 });
        }
    });
});

router.post('/update-email-template/:templateId', (req, res) => {
    const templateId = req.params.templateId;
    const {body, subject, templateType} = req.body;
    const query = 'UPDATE email_templates SET body = ?, subject = ?, template_type = ? WHERE id = ?';
    connection.query(query, [body, subject, templateType, templateId], (err, result) => {
        if (err) {
            console.error('Error updating email templateId in MySQL:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            res.json({message: 'Email template updated successfully.'});
        }
    });
});

router.post('/delete-email-template/:templateId', (req, res) => {
    const templateId = req.params.templateId;

    const query = 'DELETE FROM email_templates WHERE id=?';
    connection.query(query, [templateId], (err, result) => {
        if (err) {
            console.error('Error deleting email template from MySQL:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            res.json({message: 'Email template deleted successfully.'});
        }
    });
});

router.get('/get-email-template/:templateId', (req, res) => {
    const templateId = req.params.templateId;

    const query = `
        SELECT *
        FROM email_templates

        WHERE email_templates.id = ?
    `;

    connection.query(query, [templateId], (err, results) => {
        if (err) {
            console.error('Error fetching email template from MySQL:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            // Check if the user with the given ID exists
            if (results.length === 0) {
                res.status(404).json({error: 'Template not found'});
            } else {
                res.json(results[0]); // Return the first (and only) result
            }
        }
    });
});

router.get('/get-template-type', (req, res) => {
    connection.query(`SELECT template_types.id,template_types.name FROM template_types`, (err, results) => {
        if (err) {
            console.error('Error fetching template types from MySQL:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router;