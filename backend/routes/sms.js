 const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock SMS functionality
let smsHistory = [
  { _id: 1, direction: 'inbound', body: 'STATUS OK', timestamp: new Date() },
  { _id: 2, direction: 'outbound', body: 'Server restarted', timestamp: new Date(Date.now() - 1800000) }
];

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
      const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
      const lines = output.trim().split('\n').slice(1);
      let totalSize = 0;
      let totalFree = 0;

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && parts[0].endsWith(':')) {
          const free = parseInt(parts[1]) || 0;
          const size = parseInt(parts[2]) || 0;
          totalFree += free;
          totalSize += size;
        }
      });

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

// Measure CPU usage by sampling two snapshots separated by `delay` ms.
// This gives a more accurate immediate CPU percentage than relying on a stored previous sample.
async function measureCpuUsage(delay = 500) {
  try {
    const cpus1 = os.cpus();
    let totalIdle1 = 0, totalTick1 = 0;
    cpus1.forEach(cpu => {
      for (let t in cpu.times) totalTick1 += cpu.times[t];
      totalIdle1 += cpu.times.idle;
    });

    await new Promise((r) => setTimeout(r, delay));

    const cpus2 = os.cpus();
    let totalIdle2 = 0, totalTick2 = 0;
    cpus2.forEach(cpu => {
      for (let t in cpu.times) totalTick2 += cpu.times[t];
      totalIdle2 += cpu.times.idle;
    });

    const idleDiff = totalIdle2 - totalIdle1;
    const totalDiff = totalTick2 - totalTick1;
    if (totalDiff <= 0) return 0;
    const usage = Math.round(100 - (idleDiff / totalDiff) * 100);
    return Math.max(0, Math.min(100, usage));
  } catch (err) {
    console.error('measureCpuUsage error:', err && err.message ? err.message : err);
    return 0;
  }
}

// POST /api/sms/send
router.post('/send', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ message: 'Command required' });

  // Mock command processing
  const response = `Command "${command}" executed successfully`;
  smsHistory.unshift({
    _id: Date.now(),
    direction: 'outbound',
    body: response,
    timestamp: new Date()
  });

  res.json({ message: 'Command sent', response });
});

// POST /api/sms/send-system-info
router.post('/send-system-info', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

  // Get current real-time system status
  // Measure CPU with a short sample to avoid an immediate 0% reading
  const measuredCpu = await measureCpuUsage();
  const systemInfo = getSystemMetrics();
  // Debug: log both baseline and measured CPU to troubleshoot 0% readings
  console.log('Baseline cpuUsage from getSystemMetrics():', systemInfo.cpuUsage, 'Measured cpu:', measuredCpu);
  systemInfo.cpuUsage = measuredCpu;
  // Include CPU and Memory usage in the message
  const messageCore = `System Status - Temp: ${systemInfo.temperature}°C, Disk: ${systemInfo.diskSpace}%, CPU: ${systemInfo.cpuUsage}%, Memory: ${systemInfo.memoryUsage}%`;

  // When running without Twilio configured, prepend the Twilio trial-account text to simulate trial messages
  const isTwilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
  const message = isTwilioConfigured ? messageCore : `Sent from your Twilio trial account - ${messageCore}`;

  console.log(`Sending to ${user.phone}: ${message}`);

    // Prepare formatted phone before attempting providers
    const formattedPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;

    // Send actual SMS using Twilio (primary)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      try {
        console.log(`Formatted phone for SMS: ${formattedPhone}`);
        const response = await twilio.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        console.log(`System info SMS sent to ${formattedPhone}`, response && response.sid ? response.sid : response);
      } catch (error) {
        // Log full Twilio error object to help diagnose (don't leak secrets to clients)
        console.error('Error sending system info SMS via Twilio:', error && error.message ? error.message : error);
        console.error('Twilio error details:', error);

        // Fallback: try Fast2SMS if configured
        if (process.env.FAST2SMS_API_KEY) {
          try {
            const axios = require('axios');
            let phoneNumber = formattedPhone.replace('+', '');
            if (!phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber;
            const f2Resp = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
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
            console.log('Fast2SMS fallback response:', f2Resp && f2Resp.data ? f2Resp.data : f2Resp);
          } catch (f2Err) {
            console.error('Fast2SMS fallback error:', f2Err && f2Err.message ? f2Err.message : f2Err);
          }
        } else {
          console.log('FAST2SMS_API_KEY not configured; no SMS fallback available.');
        }
      }
        } else {
      // Try a lightweight fallback: Textbelt (free tier) — limited but useful for development.
      try {
        const axios = require('axios');
        let phoneNumber = formattedPhone.replace('+', '');
        // Textbelt expects international format without + for non-US; use as-is
        const key = process.env.TEXTBELT_KEY || 'textbelt';
        console.log('Attempting Textbelt fallback for', phoneNumber);
        const tbResp = await axios.post('https://textbelt.com/text', {
          phone: phoneNumber,
          message: message,
          key
        });
        console.log('Textbelt fallback response:', tbResp && tbResp.data ? tbResp.data : tbResp);
        if (!tbResp || !tbResp.data || !tbResp.data.success) {
          console.log('Textbelt responded with failure; still in mock mode. Response:', tbResp && tbResp.data ? tbResp.data : tbResp);
        }
      } catch (tbErr) {
        console.error('Textbelt fallback error:', tbErr && tbErr.message ? tbErr.message : tbErr);
        console.log('SMS not sent (mock mode). Mock message will include trial prefix.');
      }
    }

    smsHistory.unshift({
      _id: Date.now(),
      direction: 'outbound',
      body: message,
      timestamp: new Date(),
      to: user.phone
    });

    res.json({ message: 'System info sent via SMS' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sms/history
router.get('/history', (req, res) => {
  res.json(smsHistory);
});

// POST /api/sms/send-to-user
// Authenticated endpoint: sends a provided message (or system-info when no message provided)
router.post('/send-to-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If caller provided a custom message, use it. Otherwise send system info.
    let messageCore = req.body && req.body.message ? req.body.message : null;
    if (!messageCore) {
      const measuredCpu = await measureCpuUsage();
      const systemInfo = getSystemMetrics();
      systemInfo.cpuUsage = measuredCpu;
      messageCore = `System Status - Temp: ${systemInfo.temperature}\u00b0C, Disk: ${systemInfo.diskSpace}%, CPU: ${systemInfo.cpuUsage}%, Memory: ${systemInfo.memoryUsage}%`;
    }

    const isTwilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
    const message = isTwilioConfigured ? messageCore : `Sent from your Twilio trial account - ${messageCore}`;

    const formattedPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;

    // Attempt to send via Twilio
    if (isTwilioConfigured) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      try {
        const resp = await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: formattedPhone });
        console.log(`send-to-user: SMS sent to ${formattedPhone}`, resp && resp.sid ? resp.sid : resp);
      } catch (error) {
        console.error('send-to-user: Twilio error:', error && error.message ? error.message : error);
        console.error('send-to-user: Twilio error details:', error);

        // Fallback to Fast2SMS when configured
        if (process.env.FAST2SMS_API_KEY) {
          try {
            const axios = require('axios');
            let phoneNumber = formattedPhone.replace('+', '');
            if (!phoneNumber.startsWith('91')) phoneNumber = '91' + phoneNumber;
            const f2Resp = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
              route: 'v3',
              sender_id: 'TXTIND',
              message: message,
              language: 'english',
              flash: 0,
              numbers: phoneNumber,
            }, {
              headers: { 'authorization': process.env.FAST2SMS_API_KEY, 'Content-Type': 'application/json' }
            });
            console.log('send-to-user: Fast2SMS fallback response:', f2Resp && f2Resp.data ? f2Resp.data : f2Resp);
          } catch (f2Err) {
            console.error('send-to-user: Fast2SMS fallback error:', f2Err && f2Err.message ? f2Err.message : f2Err);
          }
        } else {
          console.log('send-to-user: FAST2SMS_API_KEY not configured; no SMS fallback available.');
        }
      }
    } else {
      // Try Textbelt fallback for development convenience
      try {
        const axios = require('axios');
        let phoneNumber = formattedPhone.replace('+', '');
        const key = process.env.TEXTBELT_KEY || 'textbelt';
        console.log('send-to-user: attempting Textbelt fallback for', phoneNumber);
        const tbResp = await axios.post('https://textbelt.com/text', { phone: phoneNumber, message, key });
        console.log('send-to-user: Textbelt response:', tbResp && tbResp.data ? tbResp.data : tbResp);
        if (!tbResp || !tbResp.data || !tbResp.data.success) {
          console.log(`send-to-user: Textbelt returned failure; mock send to ${formattedPhone}: ${message}`);
        }
      } catch (tbErr) {
        console.error('send-to-user: Textbelt error:', tbErr && tbErr.message ? tbErr.message : tbErr);
        console.log(`send-to-user: Twilio not configured; mock send to ${formattedPhone}: ${message}`);
      }
    }

    smsHistory.unshift({ _id: Date.now(), direction: 'outbound', body: message, timestamp: new Date(), to: user.phone });

    return res.json({ message: 'SMS send request processed' });
  } catch (err) {
    console.error('send-to-user error:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
