/**
 * sendEmail.js
 * Sends transactional email using Brevo SMTP via nodemailer.
 * Falls back to console logging in development if BREVO_API_KEY is not configured.
 */

const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@ecoloop.com';
  const fromName = process.env.FROM_NAME || 'EcoLoop';

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.log('\n==================================================');
    console.log('📧  [EMAIL MOCK/DEVELOPMENT MODE]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log(text || html);
    console.log('==================================================\n');
    return { success: true, mock: true };
  }

  try {
    // Create a nodemailer transporter using Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: fromEmail,
        pass: apiKey,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
