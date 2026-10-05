const mongoose = require('mongoose');

const foundReportSchema = new mongoose.Schema({
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
  location: {
    type: String,
    default: '',
    trim: true
  },
  dateFound: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  brand: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    default: 'Personal Accessories'
  },
  photo: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'returned'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FoundReport', foundReportSchema);
