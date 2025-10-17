const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

dotenv.config({ path: __dirname + '/.env' });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount routes if present
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.warn('Auth routes not found or failed to load:', e.message);
}

try {
  const alertRoutes = require('./routes/alert');
  app.use('/api/alerts', alertRoutes);
} catch (e) {
  console.warn('Alert routes not found or failed to load:', e.message);
}

try {
  const smsRoutes = require('./routes/sms');
  app.use('/api/sms', smsRoutes);
} catch (e) {
  console.warn('SMS routes not found or failed to load:', e.message);
}

try {
  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);
} catch (e) {
  console.warn('Dashboard routes not found or failed to load:', e.message);
}

app.get('/', (req, res) => {
  res.json({ message: 'SMS Server Monitor Backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sms-monitor';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
