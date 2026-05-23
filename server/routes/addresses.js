const express = require('express');
const router = express.Router();

// Get all addresses of a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await req.db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add new address
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      title,
      full_address,
      city,
      district,
      postal_code
    } = req.body;

    if (!user_id || !title || !full_address) {
      return res.status(400).json({ error: 'user_id, title, and full_address are required' });
    }

    await req.db.query('BEGIN');

    const countResult = await req.db.query(
      'SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1',
      [user_id]
    );
    const makeDefault = req.body.is_default === true || countResult.rows[0].count === 0;

    if (makeDefault) {
      await req.db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [user_id]);
    }

    const result = await req.db.query(
      `INSERT INTO addresses
      (user_id, title, full_address, city, district, postal_code, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [user_id, title, full_address, city, district, postal_code, makeDefault]
    );

    await req.db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error(error);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

// Update address
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, full_address, city, district, postal_code } = req.body;
    const result = await req.db.query(
      `UPDATE addresses SET title=$1, full_address=$2, city=$3, district=$4, postal_code=$5
       WHERE id=$6 RETURNING *`,
      [title, full_address, city, district, postal_code, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Address not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Mark one address as the user's default checkout/home address.
router.put('/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.body.user_id;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const owned = await req.db.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await req.db.query('BEGIN');
    await req.db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    const updated = await req.db.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    await req.db.query('COMMIT');

    res.json(updated.rows[0]);
  } catch (error) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error(error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// Delete address
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.query('BEGIN');
    const deleted = await req.db.query('DELETE FROM addresses WHERE id=$1 RETURNING user_id, is_default', [id]);
    if (deleted.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found' });
    }
    if (deleted.rows[0].is_default) {
      await req.db.query(
        `UPDATE addresses SET is_default = TRUE
         WHERE id = (
           SELECT id FROM addresses
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 1
         )`,
        [deleted.rows[0].user_id]
      );
    }
    await req.db.query('COMMIT');
    res.json({ message: 'Address deleted' });
  } catch (error) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error(error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
