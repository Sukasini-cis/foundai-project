const mongoose = require('mongoose');

// One message. `senderId` is the real user who wrote it; each viewer sees it
// as "me" or "them" (computed in routes/messages.js).
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  time: { type: Date, default: Date.now },
  itemMatch: {
    name: { type: String },
    location: { type: String },
    matchScore: { type: Number }
  },
  verification: { type: Boolean, default: false }
});

// A private thread between exactly two registered users.
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

  // Sorted "idA_idB" key so two users can only ever have ONE thread.
  pairKey: { type: String, required: true, unique: true },

  messages: [messageSchema],

  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  lastSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Per-user unread counters: [{ user, count }]
  unread: [{
    _id: false,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 0 }
  }],

  // Users who "removed" the thread from their own inbox (other side keeps it)
  hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  identityVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
