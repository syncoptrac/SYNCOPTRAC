// Add this to backend/routes/admin.js if you need admin to change own password
// PATCH /api/admin/change-password
// Requires: requireAdmin middleware
// Body: { currentPassword, newPassword }

/*
router.patch('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const valid = await admin.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/
