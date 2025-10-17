const mongoose = require('mongoose');

const alertsSchema = new mongoose.Schema({
  server_id: { type: String, required: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  threshold: { type: String, required: true },
  message: { type: String, required: true },
  sms_sent: { type: Boolean, required: true },
  timestamp: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Alerts', alertsSchema);
