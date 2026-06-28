const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Get all active jobs
router.get('/jobs', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, title, department, location, job_type, experience_level,
        description, requirements, responsibilities, salary_range, benefits,
        created_at, updated_at
      FROM jobs 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `;
    
    const [jobs] = await pool.execute(query);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// Get job by ID with questions
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get job details
    const jobQuery = `
      SELECT * FROM jobs WHERE id = ? AND status = 'active'
    `;
    const [jobResult] = await pool.execute(jobQuery, [id]);
    
    if (jobResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Get job questions
    const questionsQuery = `
      SELECT id, question, question_type, options, is_required, order_index
      FROM job_questions 
      WHERE job_id = ? 
      ORDER BY order_index ASC
    `;
    const [questions] = await pool.execute(questionsQuery, [id]);
    
    const job = {
      ...jobResult[0],
      questions: questions.map(q => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null
      }))
    };
    
    res.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job details' });
  }
});

// Submit job application
router.post('/jobs/:id/apply', upload.single('resume'), async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { name, email, phone, coverLetter, answers } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume is required' });
    }
    
    // Verify job exists
    const jobQuery = 'SELECT id FROM jobs WHERE id = ? AND status = "active"';
    const [jobResult] = await pool.execute(jobQuery, [jobId]);
    
    if (jobResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const applicationId = uuidv4();
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    
    // Insert application
    const applicationQuery = `
      INSERT INTO job_applications (id, job_id, name, email, phone, resume_url, cover_letter)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(applicationQuery, [
      applicationId, jobId, name, email, phone, resumeUrl, coverLetter || null
    ]);
    
    // Insert answers if provided
    if (answers && typeof answers === 'string') {
      const parsedAnswers = JSON.parse(answers);
      
      for (const [questionId, answer] of Object.entries(parsedAnswers)) {
        if (answer && answer.trim()) {
          const answerQuery = `
            INSERT INTO job_application_answers (id, application_id, question_id, answer)
            VALUES (?, ?, ?, ?)
          `;
          await pool.execute(answerQuery, [uuidv4(), applicationId, questionId, answer]);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicationId 
    });
    
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
});

// Get applications for a job (admin endpoint)
router.get('/jobs/:id/applications', async (req, res) => {
  try {
    const { id: jobId } = req.params;
    
    const query = `
      SELECT 
        ja.id, ja.name, ja.email, ja.phone, ja.resume_url, 
        ja.cover_letter, ja.status, ja.applied_at,
        j.title as job_title
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `;
    
    const [applications] = await pool.execute(query, [jobId]);
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

// Get application details with answers
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get application details
    const appQuery = `
      SELECT 
        ja.*, j.title as job_title, j.department
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ?
    `;
    const [appResult] = await pool.execute(appQuery, [id]);
    
    if (appResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Get answers
    const answersQuery = `
      SELECT 
        jaa.answer, jq.question, jq.question_type
      FROM job_application_answers jaa
      JOIN job_questions jq ON jaa.question_id = jq.id
      WHERE jaa.application_id = ?
      ORDER BY jq.order_index ASC
    `;
    const [answers] = await pool.execute(answersQuery, [id]);
    
    const application = {
      ...appResult[0],
      answers
    };
    
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application details' });
  }
});

// Update application status
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const query = 'UPDATE job_applications SET status = ? WHERE id = ?';
    await pool.execute(query, [status, id]);
    
    res.json({ success: true, message: 'Application status updated' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
});

module.exports = router;