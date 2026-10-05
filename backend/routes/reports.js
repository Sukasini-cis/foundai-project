const express = require('express');
const Report = require('../models/Report');   // MongoDB account A
const Notification = require('../models/Notification');

const router = express.Router();

// GET /api/reports - Get all lost reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports from database.' });
  }
});

// POST /api/reports - Create a new lost report
router.post('/', async (req, res) => {
  try {
    const { userId, itemName, category, brand, reward, dateLost, location, photo } = req.body;

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    const newReport = new Report({
      userId: userId || null,
      itemName: itemName.trim(),
      category: category || 'Personal Accessories',
      brand: brand ? brand.trim() : '',
      reward: reward ? Number(reward) : 0,
      dateLost: dateLost || new Date().toISOString().split('T')[0],
      location: location ? location.trim() : '',
      photo: photo || '',
      status: 'searching'
    });

    const savedReport = await newReport.save();
    console.log(` New report saved to MongoDB: "${savedReport.itemName}" (ID: ${savedReport._id})`);

    // Notify the reporter so their lost report shows up on the Notifications page
    if (userId) {
      try {
        await Notification.create({
          userId: userId,
          message: `Your lost item report "${savedReport.itemName}" has been posted${savedReport.location ? ' for ' + savedReport.location : ''}. We'll alert you as soon as a match is found.`,
          type: 'lost'
        });
      } catch (notifyErr) {
        console.error('Failed to create lost-report notification:', notifyErr);
      }
    }

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to save report to database.' });
  }
});

// PUT /api/reports/:id/status - Update / cycle report status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const statusCycle = ['searching', 'returned'];
    const currentIndex = statusCycle.indexOf(report.status);
    const nextStatus = (currentIndex === -1 || report.status === 'returned') ? 'searching' : 'returned';

    report.status = nextStatus;
    const updatedReport = await report.save();

    console.log(` Report ${id} status updated to "${nextStatus}"`);
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await Report.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    console.log(` Report ${id} deleted from database.`);
    res.json({ message: 'Report deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

module.exports = router;
