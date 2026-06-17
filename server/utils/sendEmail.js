/**
 * sendEmail.js
 * Sends transactional email using Brevo (formerly Sendinblue) HTTP API.
 * Falls back to console logging in development if BREVO_API_KEY is not configured.
 */

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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error sending email via Brevo');
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
