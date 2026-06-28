// SES transport helper for nodemailer
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

function createSESTransport() {
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });
    return nodemailer.createTransport({
        SES: new AWS.SES({ apiVersion: '2010-12-01' })
    });
}

module.exports = createSESTransport;
