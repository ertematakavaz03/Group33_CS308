const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/customerAuth');

router.use(authenticate);

// Get all addresses of a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
      title,
      full_address,
      city,
      district,
      postal_code
    } = req.body;
    const user_id = req.user.id;

    const cleanTitle = String(title || '').trim();
    if (!cleanTitle || cleanTitle.length > 100) {
      return res.status(400).json({ error: 'Title is required and must be under 100 characters' });
    }
    const cleanFullAddress = String(full_address || '').trim();
    if (!cleanFullAddress || cleanFullAddress.length < 5 || cleanFullAddress.length > 500) {
      return res.status(400).json({ error: 'Address must be between 5 and 500 characters' });
    }
    const cleanCity = city ? String(city).trim().slice(0, 100) : null;
    const cleanDistrict = district ? String(district).trim().slice(0, 100) : null;
    const cleanPostal = postal_code ? String(postal_code).replace(/\D/g, '') : null;
    if (cleanPostal && cleanPostal.length !== 5) {
      return res.status(400).json({ error: 'Postal code must be exactly 5 digits' });
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
      [user_id, cleanTitle, cleanFullAddress, cleanCity, cleanDistrict, cleanPostal, makeDefault]
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
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle || cleanTitle.length > 100) {
      return res.status(400).json({ error: 'Title is required and must be under 100 characters' });
    }
    const cleanFullAddress = String(full_address || '').trim();
    if (!cleanFullAddress || cleanFullAddress.length < 5 || cleanFullAddress.length > 500) {
      return res.status(400).json({ error: 'Address must be between 5 and 500 characters' });
    }
    const cleanCity = city ? String(city).trim().slice(0, 100) : null;
    const cleanDistrict = district ? String(district).trim().slice(0, 100) : null;
    const cleanPostal = postal_code ? String(postal_code).replace(/\D/g, '') : null;
    if (cleanPostal && cleanPostal.length !== 5) {
      return res.status(400).json({ error: 'Postal code must be exactly 5 digits' });
    }

    const existing = await req.db.query('SELECT user_id FROM addresses WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Address not found' });
    if (req.user.id !== Number(existing.rows[0].user_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await req.db.query(
      `UPDATE addresses SET title=$1, full_address=$2, city=$3, district=$4, postal_code=$5
       WHERE id=$6 RETURNING *`,
      [cleanTitle, cleanFullAddress, cleanCity, cleanDistrict, cleanPostal, id]
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
    const userId = req.user.id;

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

    const existing = await req.db.query('SELECT user_id FROM addresses WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Address not found' });
    if (req.user.id !== Number(existing.rows[0].user_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
