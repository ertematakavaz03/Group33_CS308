const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/customerAuth');

router.use(authenticate);

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (req.user.id !== Number(userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { rows } = await req.db.query(
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid notification id' });
  }

  try {
    const { rows } = await req.db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, message, is_read, created_at`,
      [id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
