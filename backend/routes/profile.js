const express = require('express');
const Profile = require('../models/Profile');   // MongoDB account A
const User = require('../models/User');
const isValidId = require('../utils/isValidId');

const router = express.Router();

// Helper to get or create the profile for ONE specific logged-in user.
// A profile is looked up by userId, so each account sees only its own
// data - never a shared/global document.
async function getActiveProfile(userId) {
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    // Seed a brand-new profile from the real account (signup) data
    // instead of the old hardcoded "Alex Rivera" placeholder.
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    profile = new Profile({
      userId,
      name: user.fullName || user.username || 'FoundAI User',
      location: user.organization || user.department || ''
    });
    await profile.save();
  }
  return profile;
}

// Shared guard used by every route below: validates :userId and
// attaches the matching profile (creating it on first visit) to req.
async function loadProfile(req, res, next) {
  const { userId } = req.params;
  if (!isValidId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  try {
    req.profile = await getActiveProfile(userId);
    next();
  } catch (error) {
    const status = error.status || 500;
    if (status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error loading profile:', error);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
}

// GET /api/profile/:userId - Fetch the logged-in user's profile
router.get('/:userId', loadProfile, async (req, res) => {
  res.json(req.profile);
});

// PUT /api/profile/:userId/verify - Toggle verified status
router.put('/:userId/verify', loadProfile, async (req, res) => {
  try {
    const profile = req.profile;
    profile.verified = !profile.verified;
    profile.updatedAt = new Date();
    await profile.save();
    console.log(` Verification toggled to: ${profile.verified} (user ${req.params.userId})`);
    res.json(profile);
  } catch (error) {
    console.error('Error toggling verification:', error);
    res.status(500).json({ error: 'Failed to toggle verification.' });
  }
});

// PUT /api/profile/:userId/trust-score - Recalculate trust score
router.put('/:userId/trust-score', loadProfile, async (req, res) => {
  try {
    const profile = req.profile;
    const total = profile.verifiedClaims + profile.disputedClaims;
    const ratio = total > 0 ? profile.verifiedClaims / total : 1;
    profile.trustScore = Math.round(ratio * 5 * 10) / 10;
    profile.updatedAt = new Date();
    await profile.save();
    console.log(` Trust score recalculated: ${profile.trustScore} (user ${req.params.userId})`);
    res.json(profile);
  } catch (error) {
    console.error('Error recalculating trust score:', error);
    res.status(500).json({ error: 'Failed to recalculate trust score.' });
  }
});

// POST /api/profile/:userId/badges - Unlock / Add achievement badge (max 6)
router.post('/:userId/badges', loadProfile, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Badge name is required.' });
    }

    const profile = req.profile;

    if (profile.badges.length >= 6) {
      return res.status(400).json({ error: 'Max badges (6) reached for this account.' });
    }

    profile.badges.push({
      name: name.trim(),
      type: type || 'member'
    });
    profile.updatedAt = new Date();
    await profile.save();

    console.log(` Badge unlocked: "${name}" (${type}) for user ${req.params.userId}`);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error adding badge:', error);
    res.status(500).json({ error: 'Failed to add badge.' });
  }
});

// PUT /api/profile/:userId/stats/:key/increment - Increment stat count by +1
router.put('/:userId/stats/:key/increment', loadProfile, async (req, res) => {
  try {
    const { key } = req.params;
    const profile = req.profile;

    const stat = profile.stats.find(s => s.key === key);
    if (!stat) {
      return res.status(404).json({ error: `Stat "${key}" not found.` });
    }

    stat.value += 1;
    profile.updatedAt = new Date();
    await profile.save();

    console.log(` Stat "${key}" incremented to: ${stat.value} (user ${req.params.userId})`);
    res.json(profile);
  } catch (error) {
    console.error('Error incrementing stat:', error);
    res.status(500).json({ error: 'Failed to increment stat.' });
  }
});

module.exports = router;
