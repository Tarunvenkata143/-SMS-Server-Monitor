const mongoose = require('mongoose');

const commandsSchema = new mongoose.Schema({
  server_id: { type: String, required: true },
  command: { type: String, required: true },
  sms_sender: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: String, required: true },
  response_log: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Commands', commandsSchema);
