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

// PATCH /api/institute/change-username - the logged-in institute changes their own login username
router.patch('/change-username', requireInstitute, async (req, res) => {
  try {
    const newUsername = (req.body.newUsername || '').trim();

    if (!newUsername) {
      return res.status(400).json({ error: 'New username is required' });
    }
    if (newUsername.length < 4) {
      return res.status(400).json({ error: 'Username must be at least 4 characters' });
    }
    if (!/^[A-Za-z0-9._-]+$/.test(newUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, dots, underscores and hyphens' });
    }

    // Load ONLY the currently authenticated institute - never trust an id from the request body
    const institute = await Institute.findById(req.user.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    if (newUsername === institute.loginId) {
      return res.status(400).json({ error: 'This is already your current username' });
    }

    // Uniqueness check against the database (exclude the current institute)
    const taken = await Institute.findOne({ loginId: newUsername, _id: { $ne: institute._id } });
    if (taken) {
      return res.status(409).json({ error: 'Username already taken. Please choose another one.' });
    }

    institute.loginId = newUsername;
    await institute.save();

    return res.json({
      message: 'Username updated successfully',
      loginId: institute.loginId,
      user: {
        id: institute._id,
        loginId: institute.loginId,
        instituteName: institute.instituteName,
        ownerName: institute.ownerName,
        role: 'institute',
      },
    });
  } catch (err) {
    console.error('change-username error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/institute/change-password - the logged-in institute changes their own password
router.patch('/change-password', requireInstitute, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }

    // Load ONLY the currently authenticated institute - never trust an id from the request body
    const institute = await Institute.findById(req.user.id);
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Verify the current password before allowing a change
    const isCurrentValid = await institute.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const isSameAsOld = await institute.comparePassword(newPassword);
    if (isSameAsOld) {
      return res.status(400).json({ error: 'New password must be different from your current password' });
    }

    // Assigning the password triggers the model pre-save hook which hashes it with bcrypt.
    // Plain-text passwords are never stored.
    institute.password = newPassword;
    await institute.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
