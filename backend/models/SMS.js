const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  direction: { type: String, required: true }, // 'inbound' or 'outbound'
  body: { type: String, required: true },
  timestamp: { type: Date, required: true },
  to: { type: String }, // phone number for outbound
  from: { type: String }, // phone number for inbound
  status: { type: String, default: 'sent' }, // 'sent', 'delivered', 'failed'
  provider: { type: String }, // 'twilio', 'fast2sms', 'textbelt', 'mock'
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // reference to user who sent/received
}, { timestamps: true });

module.exports = mongoose.model('SMS', smsSchema);
