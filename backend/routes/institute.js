const express = require('express');
const router = express.Router();
const { requireInstitute } = require('../middleware/auth');
const Institute = require('../models/Institute');

// GET /api/institute/profile
router.get('/profile', requireInstitute, async (req, res) => {
  try {
    const institute = await Institute.findById(req.user.id).select('-password');
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    res.json(institute);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/institute/update-students
router.patch('/update-students', requireInstitute, async (req, res) => {
  try {
    const { totalStudents } = req.body;
    await Institute.findByIdAndUpdate(req.user.id, { totalStudents });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
