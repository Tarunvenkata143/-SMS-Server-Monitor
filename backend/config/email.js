const nodemailer = require('nodemailer');

// Create transporter for email
const transporter = nodemailer.createTransport({
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

// General function to send email
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'your-email@gmail.com',
    to: to,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    if (error.message.includes('Invalid login') || error.message.includes('Authentication failed')) {
      console.error('Email authentication failed. For Gmail, ensure you are using an App Password instead of your regular password. Enable 2FA and generate an App Password at https://myaccount.google.com/apppasswords');
    } else {
      console.error('Error sending email:', error.message);
    }
    return false;
  }
}

module.exports = { sendEmailOTP, sendEmail };
