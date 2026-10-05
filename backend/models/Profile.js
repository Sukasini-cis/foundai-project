const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['member', 'helper', 'hero'], default: 'member' }
}, { _id: true });

const statSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  unit: { type: String, default: 'count' }
}, { _id: false });

const monthlyDataSchema = new mongoose.Schema({
  month: { type: String, required: true },
  value: { type: Number, default: 0 }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  // Which account this profile belongs to - one profile per user.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'Alex Rivera'
  },
  location: {
    type: String,
    default: 'San Francisco, CA'
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150?img=12'
  },
  verified: {
    type: Boolean,
    default: true
  },
  trustScore: {
    type: Number,
    default: 4.9
  },
  verifiedClaims: {
    type: Number,
    default: 124
  },
  disputedClaims: {
    type: Number,
    default: 3
  },
  badges: {
    type: [badgeSchema],
    default: [
      { name: 'Trusted Member', type: 'member' },
      { name: 'AI Helper', type: 'helper' },
      { name: 'Community Hero', type: 'hero' }
    ]
  },
  stats: {
    type: [statSchema],
    default: [
      { key: 'itemsFound', label: 'Items Found', value: 24, unit: 'count' },
      { key: 'itemsReturned', label: 'Items Returned', value: 18, unit: 'count' },
      { key: 'connections', label: 'Connections Made', value: 1240, unit: 'count' }
    ]
  },
  monthlyData: {
    type: [monthlyDataSchema],
    default: [
      { month: 'Jan', value: 8 },
      { month: 'Feb', value: 12 },
      { month: 'Mar', value: 18 },
      { month: 'Apr', value: 14 },
      { month: 'May', value: 9 },
      { month: 'Jun', value: 17 }
    ]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', profileSchema);
