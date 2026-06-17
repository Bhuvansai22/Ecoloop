/**
 * sendEmail.js
 * Sends transactional email using Brevo HTTP API.
 */

const sendEmail = async ({ to, subject, html, text }) => {
  const brevoKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@ecoloop.com';
  const fromName = process.env.FROM_NAME || 'EcoLoop';

  if (!brevoKey) {
    console.log('\n==================================================');
    console.log('📧  [EMAIL NOT CONFIGURED]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log(text || html);
    console.log('==================================================\n');
    throw new Error('BREVO_API_KEY is not configured. Please set it in your .env file.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': brevoKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error('❌ Brevo API error:', errData);
    throw new Error(errData.message || `Brevo API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Email sent via Brevo API:', data.messageId);
  return { success: true, messageId: data.messageId };
};

module.exports = sendEmail;
