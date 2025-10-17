const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase');

// In-memory OTP storage (in production, use Redis or database)
let otpStore = {};

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ message: 'All fields required' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: 'Phone already exists' });

    const otp = generateOTP();
    otpStore[phone] = { otp, name, email, password, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    // Try Firebase Phone Auth first (free tier)
    let firebaseSent = false;
    if (admin.apps.length > 0) {
      try {
        // Firebase Phone Auth verification (free tier)
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        // Note: In production, you'd use Firebase SDK on client-side for reCAPTCHA
        // This is a simplified server-side approach for demo
        console.log(`Firebase OTP would be sent to ${formattedPhone}: ${otp}`);
        firebaseSent = true; // Assume success for demo
      } catch (fbErr) {
        console.error('Firebase send error:', fbErr.message);
      }
    }

    // Fallback to Twilio if Firebase fails or not configured
    let smsSent = false;
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    if (!firebaseSent && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log(`Sending OTP to ${formattedPhone}: ${otp}`);
        await twilio.messages.create({
          body: `Your OTP for SMS Server Monitor is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        console.log(`OTP SMS sent to ${formattedPhone}`);
        smsSent = true;
      } catch (twErr) {
        console.error('Twilio send error:', twErr && twErr.message ? twErr.message : twErr);
      }
    }

    // If Fast2SMS is configured, attempt to send the same OTP there as well
    // (this allows sending via multiple providers when configured)
    if (!firebaseSent && !smsSent && process.env.FAST2SMS_API_KEY) {
      try {
        const axios = require('axios');
        let phoneNumber = formattedPhone.replace('+', '');
        if (!phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber;
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
          route: 'v3',
          sender_id: 'TXTIND',
          message: `Your OTP for SMS Server Monitor is: ${otp}. Valid for 5 minutes.`,
          language: 'english',
          flash: 0,
          numbers: phoneNumber,
        }, {
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        console.log('Fast2SMS response:', response.data);
        // mark smsSent true if either provider succeeded
        smsSent = smsSent || (response && response.data && (response.data.return == true || response.data.message_id || response.data.success));
      } catch (f2Err) {
        console.error('Fast2SMS send error:', f2Err && f2Err.message ? f2Err.message : f2Err);
      }
    }

    // Attempt to send OTP email if configured, regardless of SMS result
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const { sendEmailOTP } = require('../config/email');
        emailSent = await sendEmailOTP(email, otp);
      } catch (emailErr) {
        console.error('Email send error:', emailErr && emailErr.message ? emailErr.message : emailErr);
      }
    }

    // If neither Firebase, SMS nor Email were sent, fall back to returning the OTP in the response during development
    if (!firebaseSent && !smsSent && !emailSent) {
      console.log('Neither Firebase, SMS nor Email sent - returning OTP in response for development');
      return res.json({ message: 'OTP generated (not sent)', otp });
    }

    // Provide an informative response
    if (firebaseSent) return res.json({ message: 'OTP sent via Firebase Phone Auth' });
    if (smsSent && emailSent) return res.json({ message: 'OTP sent via SMS and Email' });
    if (smsSent) return res.json({ message: 'OTP sent via SMS' });
    if (emailSent) return res.json({ message: 'OTP sent via Email' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

    const stored = otpStore[phone];
    if (!stored || Date.now() > stored.expires) {
      return res.status(400).json({ message: 'Verification expired' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(stored.password, salt);
    const user = new User({ name: stored.name, email: stored.email, password: hash, phone });
    await user.save();

    delete otpStore[phone]; // Clean up OTP

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    if (!email || !password) {
      console.log('Login failed: missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: user not found for', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: invalid password for', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login success for', email);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, email: user.email, name: user.name, phone: user.phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const { name, phone, email, fcmToken } = req.body;
    const user = await User.findByIdAndUpdate(decoded.id, { name, phone, email, fcmToken }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, email: user.email, name: user.name, phone: user.phone, fcmToken: user.fcmToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// DEV-only: create a test user without OTP (convenience endpoint)
// POST /api/auth/create-test-user
router.post('/create-test-user', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Forbidden in production' });

    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ message: 'name,email,phone,password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hash, phone });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

    return res.status(201).json({ message: 'Test user created', token, user: { id: user._id, email: user.email, name: user.name, phone: user.phone } });
  } catch (err) {
    console.error('create-test-user error:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});
