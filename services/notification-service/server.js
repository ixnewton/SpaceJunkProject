const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8004; // Assuming notification service runs on 8004

// Nodemailer transporter setup (using a test account from ethereal.email)
// In a real application, you would use a proper SMTP provider like SendGrid, Mailgun, or AWS SES.
let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'test.user@ethereal.email', // Replace with a real test user from ethereal
        pass: 'test.password'  // Replace with a real test password from ethereal
    }
});

app.get('/', (req, res) => {
    res.send('Notification Service is running.');
});

// Endpoint to send a notification
app.post('/send-alert', async (req, res) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).send('Missing required fields: to, subject, text');
    }

    try {
        let info = await transporter.sendMail({
            from: '"Space Junk Tracker" <noreply@spacejunktracker.com>',
            to: to, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: html // html body
        });

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        
        res.status(200).json({ status: 'success', messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (error) {
        console.error('Error sending email:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Notification Service started on port ${PORT}`);
});
