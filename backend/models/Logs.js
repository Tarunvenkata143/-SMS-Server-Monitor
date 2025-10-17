const mongoose = require('mongoose');

const logsSchema = new mongoose.Schema({
  server_id: { type: String, required: true },
  log_type: { type: String, required: true }, // e.g., 'metrics', 'alert', 'command'
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Store additional data like metrics values, alert details, etc.
}, { timestamps: true });

module.exports = mongoose.model('Logs', logsSchema);
