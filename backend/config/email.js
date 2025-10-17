const nodemailer = require('nodemailer');

// Create transporter for email
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Function to send OTP via email
async function sendEmailOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Your OTP for SMS Server Monitor',
    text: `Your OTP is: ${otp}. It expires in 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    return false;
  }
}

module.exports = { sendEmailOTP };
