const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Personal Accessories'
  },
  brand: {
    type: String,
    default: ''
  },
  reward: {
    type: Number,
    default: 0
  },
  dateLost: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  location: {
    type: String,
    default: ''
  },
  photo: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['searching', 'returned'],
    default: 'searching'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
