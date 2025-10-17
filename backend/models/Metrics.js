const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
  server_id: { type: String, required: true },
  cpu: { type: Number, required: true },
  memory: { type: Number, required: true },
  disk_free_gb: { type: Number, required: true },
  temperature_c: { type: Number, required: true },
  timestamp: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Metrics', metricsSchema);
