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

    const result = await req.db.query(
      `INSERT INTO addresses
      (user_id, title, full_address, city, district, postal_code)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [user_id, title, full_address, city, district, postal_code]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
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

// Delete address
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.query('DELETE FROM addresses WHERE id=$1', [id]);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;