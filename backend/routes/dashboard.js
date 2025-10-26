const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const path = require('path');
// Persist alerts/logs
const Alerts = require('../models/Alerts');
const Logs = require('../models/Logs');

let logs = [];
let previousCpuTimes = null;

// Function to get real system metrics
function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const uptime = os.uptime();

  // Calculate CPU usage properly by sampling over time
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  let cpuUsage = 0;
  if (previousCpuTimes) {
    const idleDiff = totalIdle - previousCpuTimes.idle;
    const totalDiff = totalTick - previousCpuTimes.total;
    if (totalDiff > 0) {
      cpuUsage = Math.round(100 - (idleDiff / totalDiff) * 100);
    }
  }
  previousCpuTimes = { idle: totalIdle, total: totalTick };

  // Memory usage
  const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

  // Disk usage (Windows-specific calculation)
  let diskSpace = 45; // Default fallback
  try {
    if (os.platform() === 'win32') {
      // For Windows, use a more accurate calculation
      const execSync = require('child_process').execSync;
      // Use PowerShell to get more reliable disk space information
      const output = execSync('powershell -command "$drive = Get-PSDrive C; $total = $drive.Used + $drive.Free; $usedPercent = [Math]::Round(($drive.Used / $total) * 100, 2); Write-Output $usedPercent"').toString();
      const usagePercentage = parseFloat(output);
      if (!isNaN(usagePercentage)) {
        diskSpace = Math.min(100, Math.max(0, usagePercentage));
      }

      if (totalSize > 0) {
        const used = totalSize - totalFree;
        diskSpace = Math.min(100, Math.max(0, Math.round((used / totalSize) * 100)));
      }
    } else {
      // For Unix-like systems
      const stats = fs.statSync('/');
      const totalSpace = 100000000000; // 100GB fallback
      const usedSpace = Math.random() * totalSpace * 0.6; // Mock 0-60% usage
      diskSpace = Math.round((usedSpace / totalSpace) * 100);
    }
  } catch (err) {
    // Keep default
  }

  // Temperature (mock for now, as it's hardware dependent)
  const temperature = Math.floor(Math.random() * 20) + 40; // 40-60°C range

  return {
    cpuUsage: Math.max(0, Math.min(100, cpuUsage)), // Clamp between 0-100
    memoryUsage,
    diskSpace,
    uptime: Math.floor(uptime / 3600), // hours
    temperature
  };
}

// Start with empty logs - only real-time data will be added

// GET /api/dashboard/status
router.get('/status', (req, res) => {
  const status = getSystemMetrics();
  res.json(status);
});

// GET /api/dashboard/logs
router.get('/logs', async (req, res) => {
  // Add new log entry with real data
  const newLog = {
    _id: Date.now(),
    timestamp: new Date(),
    ...getSystemMetrics()
  };
  logs.unshift(newLog);
  if (logs.length > 100) logs = logs.slice(0, 100); // Keep only last 100

  // Check for alerts and send SMS automatically
  const metrics = newLog;
  let alerts = [];

  // Allow overriding thresholds via query params for testing
  // Default thresholds lowered to 50% per request
  const cpuThreshold = parseInt(req.query.cpuThreshold) || 80;
  const memThreshold = parseInt(req.query.memThreshold) || 85;
  const diskThreshold = parseInt(req.query.diskThreshold) || 75;

  // Force a test alert when ?force=true is provided
  if (req.query.force === 'true') {
    alerts.push('Forced test alert for debugging');
  } else {
    if (metrics.cpuUsage > cpuThreshold) {
      alerts.push(`High CPU usage: ${metrics.cpuUsage}%`);
    }
    if (metrics.memoryUsage > memThreshold) {
      alerts.push(`High memory usage: ${metrics.memoryUsage}%`);
    }
    if (metrics.diskSpace > diskThreshold) {
      alerts.push(`High disk usage: ${metrics.diskSpace}%`);
    }
    if (metrics.temperature > 70) {
      alerts.push(`High temperature: ${metrics.temperature}°C`);
    }
  }

  // Send SMS alerts if any thresholds exceeded
  if (alerts.length > 0) {
    try {
      const axios = require('axios');

      // Development helper: allow sending to an arbitrary phone via ?to=PHONE (bypass JWT/user lookup)
      // Example: /api/dashboard/logs?force=true&to=9985252395
      const overrideTo = req.query.to;
      let recipientPhone = null;
      let recipientName = 'User';

      if (overrideTo) {
        recipientPhone = overrideTo.startsWith('+') ? overrideTo : `+91${overrideTo}`;
        console.log(`Dev override: sending alert to ${recipientPhone} (query param 'to' used)`);
      } else {
        // Default behavior: find user from JWT
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
          const user = await User.findById(decoded.id);
          if (user && user.phone) {
            recipientPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
            recipientName = user.name || 'User';
          }
        }
      }

      if (recipientPhone) {
        const message = `Hi ${recipientName}, ALERT: ${alerts.join(', ')}`;

        // Track whether an SMS was actually handed off to a provider
        let smsSent = false;

        // Try Twilio first if configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          try {
            const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            console.log(`dashboard: attempting Twilio send to ${recipientPhone}`);
            const resp = await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: recipientPhone });
            console.log(`Automatic alert SMS SENT via Twilio to ${recipientPhone}:`, resp && resp.sid ? resp.sid : resp);
            smsSent = true;
          } catch (twErr) {
            console.error('Error sending automatic alert SMS via Twilio:', twErr && twErr.message ? twErr.message : twErr);
          }
        }

        // If not sent via Twilio, try Fast2SMS if configured
        if (!smsSent && process.env.FAST2SMS_API_KEY) {
          try {
            let phoneNumber = recipientPhone.replace('+', '');
            if (!phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber;
            const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
              route: 'v3',
              sender_id: 'TXTIND',
              message: message,
              language: 'english',
              flash: 0,
              numbers: phoneNumber,
            }, {
              headers: {
                'authorization': process.env.FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
              }
            });
            console.log(`Automatic alert SMS SENT via Fast2SMS to ${phoneNumber}: ${message}`, response.data);
            smsSent = true;
          } catch (smsError) {
            console.error('Error sending automatic alert SMS via Fast2SMS:', smsError && smsError.message ? smsError.message : smsError);
          }
        }

        // If still not sent, attempt Textbelt as a lightweight fallback
        if (!smsSent) {
          try {
            const axios = require('axios');
            let phoneNumber = recipientPhone.replace('+', '');
            const key = process.env.TEXTBELT_KEY || 'textbelt';
            console.log('Attempting Textbelt fallback for', phoneNumber);
            const tbResp = await axios.post('https://textbelt.com/text', {
              phone: phoneNumber,
              message: message,
              key
            });
            console.log('Textbelt fallback response:', tbResp && tbResp.data ? tbResp.data : tbResp);
            if (tbResp && tbResp.data && tbResp.data.success) smsSent = true;
          } catch (tbErr) {
            console.error('Textbelt fallback error:', tbErr && tbErr.message ? tbErr.message : tbErr);
          }
        }

        // Send alert email when we have an authenticated user with email configured
        try {
          if (recipientName && recipientPhone && req.headers.authorization) {
            // try to fetch full user from token to get email
            const jwtLib = require('jsonwebtoken');
            const UserModel = require('../models/User');
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
              const decoded = jwtLib.verify(token, process.env.JWT_SECRET || 'secretkey');
              const user = await UserModel.findById(decoded.id);
              if (user && user.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                try {
                  const { sendEmail } = require('../config/email');
                  const emailSent = await sendEmail(user.email, 'Server Alert Notification', `Hi ${user.name || recipientName}, ALERT: ${alerts.join(', ')}`);
                  if (emailSent) {
                    console.log('Alert email sent to', user.email);
                  }
                } catch (emailErr) {
                  console.error('Error sending alert email:', emailErr && emailErr.message ? emailErr.message : emailErr);
                }
              }
            }
          }
        } catch (sendEmailErr) {
          console.error('Error preparing/sending alert email:', sendEmailErr && sendEmailErr.message ? sendEmailErr.message : sendEmailErr);
        }

        // Persist alerts and a log entry for each alert item
        try {
          const timestamp = new Date().toISOString();
          // Save a Logs document summarizing the alert event
          await Logs.create({
            server_id: 'local',
            log_type: 'alert',
            message: alerts.join(', '),
            timestamp,
            data: { metrics }
          });

          // For each individual alert, create an Alerts document
          for (const a of alerts) {
            // Attempt to extract metric and value (e.g., "High memory usage: 67%")
            let metric = 'unknown';
            let value = null;
            try {
              const m = a.match(/(CPU|memory|disk|temperature|Temp|High)\s*([A-Za-z]*)\s*:?\s*(\d+)%?/i);
              if (m) {
                metric = (m[1] || m[2] || 'metric').toString().toLowerCase();
                value = m[3] ? parseInt(m[3]) : null;
              } else {
                // fallback: try number extraction
                const n = a.match(/(\d+)%/);
                if (n) value = parseInt(n[1]);
              }
            } catch (ex) {
              // ignore parsing errors
            }

            await Alerts.create({
              server_id: 'local',
              metric: metric || 'unknown',
              value: value !== null ? value : 0,
              threshold: `${metric === 'memory' ? memThreshold : metric === 'cpu' ? cpuThreshold : diskThreshold}`,
              message: a,
              sms_sent: !!smsSent,
              timestamp
            });
          }
        } catch (dbErr) {
          console.error('Error saving Alerts/Logs to DB:', dbErr && dbErr.message ? dbErr.message : dbErr);
        }
      } else {
        console.log('No recipient phone found for alert (no JWT and no ?to provided)');
      }
    } catch (err) {
      console.error('Error processing automatic alerts:', err);
    }
  }

  res.json(logs);
});

// GET /api/dashboard/alerts
router.get('/alerts', (req, res) => {
  // Mock alerts
  const alerts = [
    { _id: 1, message: 'High CPU usage detected', timestamp: new Date() },
    { _id: 2, message: 'Disk space running low', timestamp: new Date(Date.now() - 3600000) }
  ];
  res.json(alerts);
});

// GET /api/dashboard/sms
router.get('/sms', (req, res) => {
  // Mock SMS history
  const sms = [
    { _id: 1, direction: 'inbound', body: 'STATUS OK', timestamp: new Date() },
    { _id: 2, direction: 'outbound', body: 'Server restarted', timestamp: new Date(Date.now() - 1800000) }
  ];
  res.json(sms);
});

module.exports = router;
