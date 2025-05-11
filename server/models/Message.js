const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  recipient: { type: String }, // Only for private messages
  group: { type: String },     // Only for group messages
  content: { type: String, required: true },
  type: { type: String, enum: ['private', 'group'], default: 'private' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
