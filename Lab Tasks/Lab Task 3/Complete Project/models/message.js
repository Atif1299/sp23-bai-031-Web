const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ['order', 'contact'], required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  userEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema); 