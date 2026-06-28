require('dotenv').config();
const nodemailer = require('nodemailer');
const createSESTransport = require('./models/email_ses');

// Choose transport based on EMAIL_PROVIDER
envProvider = process.env.EMAIL_PROVIDER;
let transporter;
if (envProvider === 'SES') {
  console.log('Using Amazon SES for test email');
  transporter = createSESTransport();
} else {
  console.log('Using SMTP for test email');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    debug: true
  });
}

const mailOptions = {
  from: `"Expertise Station" <${process.env.SMTP_FROM || process.env.FROM_EMAIL}>`,
  to: 'yadavabhinav95@gmail.com', // <-- CHANGE THIS to your test recipient
  subject: 'Test Email from Expertise Station Backend',
  html: '<h2>This is a test email!</h2><p>If you received this, your email setup works.</p>'
};

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('Test email sent! Message ID:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to send test email:', err);
    process.exit(1);
  });
