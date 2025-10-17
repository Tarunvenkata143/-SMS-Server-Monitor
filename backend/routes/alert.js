const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase');

// Mock alerts data
let alerts = [
  { _id: 1, message: 'High CPU usage detected', timestamp: new Date(), severity: 'warning' },
  { _id: 2, message: 'Disk space running low', timestamp: new Date(Date.now() - 3600000), severity: 'error' },
  { _id: 3, message: 'Memory usage above 80%', timestamp: new Date(Date.now() - 7200000), severity: 'warning' }
];

// Firebase Cloud Messaging (FCM) push notification function (free tier: unlimited)
async function sendPushNotification(fcmToken, title, body) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Push notification sent successfully: ${response}`);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error.message);
    throw error;
  }
}

// Fallback SMS sending function using Fast2SMS (if FCM fails)
async function sendSMS(phone, message) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.log(`Mock SMS (Fast2SMS not configured) to ${phone}: ${message}`);
      return true;
    }

    const axios = require('axios');
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'v3',
      sender_id: 'TXTIND',
      message: message,
      language: 'english',
      flash: 0,
      numbers: phone.replace('+', ''),
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`SMS sent successfully to ${phone}`, response.data);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
}

// Email sending function using Nodemailer
async function sendEmail(email, subject, message) {
  try {
    const { sendEmail } = require('../config/email');
    const result = await sendEmail(email, subject, message);
    if (result) {
      console.log(`Alert email sent successfully to ${email}`);
      return true;
    } else {
      throw new Error('Email send failed');
    }
  } catch (error) {
    console.error('Error sending alert email:', error.message);
    throw error;
  }
}

// GET /api/alerts
router.get('/', (req, res) => {
  res.json(alerts);
});

// POST /api/alerts
router.post('/', async (req, res) => {
  const { message, severity = 'info' } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required' });

  const newAlert = {
    _id: Date.now(),
    message,
    severity,
    timestamp: new Date()
  };
  alerts.unshift(newAlert);

  // Send push notifications, SMS and Email alerts if user has tokens/phone/email configured
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      const user = await User.findById(decoded.id);
      if (user) {
        // Send FCM push notification (primary method - free and unlimited)
        if (user.fcmToken) {
          try {
            await sendPushNotification(user.fcmToken, 'Server Alert', message);
          } catch (fcmError) {
            console.error('FCM push notification failed, falling back to SMS:', fcmError.message);
            // Fallback to SMS if FCM fails
            if (user.phone) {
              await sendSMS(user.phone, `Hi ${user.name}, ALERT: ${message}`);
            }
          }
        } else if (user.phone) {
          // Fallback to SMS if no FCM token
          await sendSMS(user.phone, `Hi ${user.name}, ALERT: ${message}`);
        }

        // Send email notification
        if (user.email) {
          await sendEmail(user.email, 'Server Alert Notification', `ALERT: ${message}`);
        }
      }
    }
  } catch (err) {
    console.error('Error sending alerts:', err);
  }

  res.status(201).json(newAlert);
});

// DELETE /api/alerts/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  alerts = alerts.filter(alert => alert._id !== id);
  res.json({ message: 'Alert deleted' });
});

module.exports = router;
