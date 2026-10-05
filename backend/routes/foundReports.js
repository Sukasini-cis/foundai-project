const express = require('express');
const FoundReport = require('../models/FoundReport');   // MongoDB account A
const Notification = require('../models/Notification');

const router = express.Router();

// GET /api/found-reports - Get all found reports
router.get('/', async (req, res) => {
  try {
    const reports = await FoundReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching found reports:', error);
    res.status(500).json({ error: 'Failed to fetch found reports from database.' });
  }
});

// POST /api/found-reports - Create a new found report
router.post('/', async (req, res) => {
  try {
    const { userId, itemName, location, dateFound, brand, category, photo } = req.body;

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ error: 'Found item name is required.' });
    }

    const newReport = new FoundReport({
      userId: userId || null,
      itemName: itemName.trim(),
      location: location ? location.trim() : '',
      dateFound: dateFound || new Date().toISOString().split('T')[0],
      brand: brand ? brand.trim() : '',
      category: category || 'Personal Accessories',
      photo: photo || '',
      status: 'available'
    });

    const savedReport = await newReport.save();
    console.log(` Found report saved to MongoDB: "${savedReport.itemName}" (ID: ${savedReport._id})`);

    // Notify the reporter so their found report shows up on the Notifications page
    if (userId) {
      try {
        await Notification.create({
          userId: userId,
          message: `Your found item report "${savedReport.itemName}" has been posted${savedReport.location ? ' from ' + savedReport.location : ''}. Thanks for helping reunite it with its owner!`,
          type: 'found'
        });
      } catch (notifyErr) {
        console.error('Failed to create found-report notification:', notifyErr);
      }
    }

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error creating found report:', error);
    res.status(500).json({ error: 'Failed to save found report to database.' });
  }
});

// PUT /api/found-reports/:id/status - Update / cycle found report status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await FoundReport.findById(id);

    if (!report) {
      return res.status(404).json({ error: 'Found report not found.' });
    }

    const statusCycle = ['available', 'claimed', 'returned'];
    const currentIndex = statusCycle.indexOf(report.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    report.status = nextStatus;
    const updatedReport = await report.save();

    console.log(` Found report ${id} status updated to: "${nextStatus}"`);
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update found report status.' });
  }
});

// DELETE /api/found-reports/:id - Delete found report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await FoundReport.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: 'Found report not found.' });
    }

    console.log(` Found report ${id} deleted from database.`);
    res.json({ message: 'Found report deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting found report:', error);
    res.status(500).json({ error: 'Failed to delete found report.' });
  }
});

module.exports = router;
