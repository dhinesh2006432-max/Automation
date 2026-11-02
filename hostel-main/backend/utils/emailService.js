const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const smtpUser = process.env.SMTP_USER || 'dhinesh2006432@gmail.com';
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || 'uaswuqjpsxbvilgd';

// Create Nodemailer Transporter with Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

// Generic Email Sender
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Hostel Management System" <${smtpUser}>`,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      html
    });
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH SUCCESS]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`MessageID: ${info.messageId}`);
    console.log(`======================================================\n`);
    return true;
  } catch (error) {
    console.log(`[EMAIL NOTICE] Could not deliver email to ${to} via SMTP: ${error.message}`);
    console.log(`[EMAIL DEV FALLBACK] Email details preserved for offline/local use.`);
    return false;
  }
};

// Send OTP Verification Email with Professional Template
const sendOtpEmail = async (to, otp, name = '') => {
  console.log(`\n======================================================`);
  console.log(`🔑 [VERIFICATION OTP GENERATED]`);
  console.log(`👤 User: ${name || 'Student'} (${to})`);
  console.log(`🔢 OTP Code: [ ${otp} ] (Valid for 10 minutes)`);
  console.log(`======================================================\n`);
  const subject = `Your Hostel Portal Verification Code: ${otp}`;
  const text = `Your Hostel Portal email verification OTP code is: ${otp}\n\nThis code is valid for 10 minutes.\nDo not share this code with anyone.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 15px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Hostel Management System</h1>
          <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 13px;">Official Account Verification</p>
        </div>
        <div style="padding: 32px 28px; color: #1e293b;">
          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">Hello <strong>${name || 'Student/Staff'}</strong>,</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for registering with the Hostel Room Allocation and Management Portal. Please use the following One-Time Password (OTP) to verify your email address:
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace, Courier, sans-serif; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #0f766e; display: inline-block;">${otp}</span>
          </div>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
            ⏰ This OTP code is valid for <strong>10 minutes</strong>. Please enter this code on the verification screen to complete your registration.
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            If you did not initiate this request, please disregard this email.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © 2026 Hostel Management System • Automated Notification
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to, subject, html });
};

// Send Parent Outpass Notification
const sendParentOutpassEmail = async ({ student, outpass, parentEmail }) => {
  const subject = `[Hostel Outpass Alert] ${student.name} Approved Outing`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0f766e; margin-top: 0;">Hostel Outpass Approved Notice</h2>
      <p>Dear Parent / Guardian,</p>
      <p>This is to inform you that your ward <strong>${student.name}</strong> (${student.register_number}) has been approved for a hostel outpass.</p>
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Outpass Code:</strong> ${outpass.outpass_code}</p>
        <p style="margin: 4px 0;"><strong>Out Date & Time:</strong> ${outpass.out_date} ${outpass.out_time}</p>
        <p style="margin: 4px 0;"><strong>Expected Return:</strong> ${outpass.expected_return_date} ${outpass.expected_return_time}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${outpass.reason}</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">If you did not authorize this outing, please contact the warden office immediately.</p>
    </div>
  `;
  return sendEmail({ to: parentEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendParentOutpassEmail
};
