const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send password reset email
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.recipientName
 * @param {string} options.resetUrl
 * @param {number} options.expiresInMinutes
 */
const sendPasswordResetEmail = async ({ toEmail, recipientName = 'User', resetUrl, expiresInMinutes = 60 }) => {
  if (!isEmailConfigured()) {
    console.log(`\n======================================================`);
    console.log(`[CivicConnect Email Service - Notice]`);
    console.log(`Email delivery not configured in environment.`);
    console.log(`Recipient: ${toEmail} (${recipientName})`);
    console.log(`Single-use reset link (expires in ${expiresInMinutes} mins):`);
    console.log(`${resetUrl}`);
    console.log(`======================================================\n`);
    return { delivered: false, reason: 'unconfigured', resetUrl };
  }

  try {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"CivicConnect" <noreply@civicconnect.gov>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0; }
          .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; background: #dbeafe; color: #1d4ed8; border-radius: 9999px; margin-top: 6px; }
          .content { font-size: 15px; line-height: 1.6; color: #374151; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
          .note { font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
          .link-fallback { word-break: break-all; color: #2563eb; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">CivicConnect</h1>
            <span class="badge">Security & Password Recovery</span>
          </div>
          <div class="content">
            <p>Hello <strong>${recipientName}</strong>,</p>
            <p>We received a request to reset the password for your CivicConnect account. Click the button below to choose a new password:</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p class="note">
              This reset link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.<br>
              If you did not request this password reset, please ignore this email or contact your municipal system administrator. Your account remains secure.
            </p>
            <p class="note">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" class="link-fallback">${resetUrl}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `CivicConnect Password Reset\n\nHello ${recipientName},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for ${expiresInMinutes} minutes and can only be used once.\nIf you did not request this reset, you can safely ignore this email.\n`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'CivicConnect - Password Reset Request',
      text: textContent,
      html: htmlContent,
    });

    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error('[CivicConnect Email Service - Error]:', error.message);
    return { delivered: false, error: error.message };
  }
};

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};
