/**
 * @fileoverview This file contains the server code for the Notification Service.
 *
 * The Notification Service is responsible for sending alerts and notifications
 * to users. It exposes a single API endpoint `/send-alert` that accepts an
 * email address, subject, and body, and sends an email using Nodemailer.
 *
 * For demonstration purposes, it is configured to use an Ethereal.email test
 * account. In a production environment, this should be replaced with a robust
 * email provider like AWS SES, SendGrid, or Mailgun.
 */

const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const PORT = process.env.PORT || 8004;

/**
 * The Nodemailer transporter object.
 *
 * This object is configured to send emails through a test SMTP server provided
 * by Ethereal.email. This is useful for development and testing without sending
 * real emails.
 *
 * @type {nodemailer.Transporter}
 * @see https://nodemailer.com/
 * @see https://ethereal.email/
 */
let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        // IMPORTANT: Replace with a real test account from ethereal.email
        user: 'joany.rempel@ethereal.email',
        pass: 'Gz6N7p2E2B4Dmyk4eP'
    }
});

/**
 * Express route to confirm that the service is running.
 * @name GET /
 * @function
 * @memberof module:NotificationService
 */
app.get('/', (req, res) => {
    res.send('Notification Service is running.');
});

/**
 * Express route to send an email alert.
 *
 * Accepts a POST request with a JSON body containing the recipient, subject,
 * and content of the email.
 *
 * @name POST /send-alert
 * @function
 * @memberof module:NotificationService
 * @param {object} req - The Express request object.
 * @param {object} req.body - The JSON body of the request.
 * @param {string} req.body.to - The recipient's email address.
 * @param {string} req.body.subject - The subject line of the email.
 * @param {string} req.body.text - The plain text body of the email.
 * @param {string} [req.body.html] - The HTML body of the email (optional).
 * @param {object} res - The Express response object.
 */
app.post('/send-alert', async (req, res) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).send('Missing required fields: to, subject, text');
    }

    try {
        let info = await transporter.sendMail({
            from: '"Space Junk Tracker" <noreply@spacejunktracker.com>',
            to: to,
            subject: subject,
            text: text,
            html: html
        });

        console.log('Message sent: %s', info.messageId);
        // The preview URL is a feature of Ethereal.email for viewing the sent email.
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL: %s', previewUrl);
        
        res.status(200).json({ status: 'success', messageId: info.messageId, previewUrl: previewUrl });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send email.' });
    }
});

/**
 * Starts the Notification Service server.
 */
app.listen(PORT, () => {
    console.log(`Notification Service started on port ${PORT}`);
});

/**
 * @module NotificationService
 */
