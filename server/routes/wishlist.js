const express = require('express');
const router = express.Router();

// Get a user's wishlist with full product info + effective price
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    const { rows } = await req.db.query(
      `SELECT w.id AS wishlist_id, w.created_at AS added_at,
              p.*,
              CASE
                WHEN p.discount_percentage > 0
                  AND (p.discount_start IS NULL OR p.discount_start <= NOW())
                  AND (p.discount_end   IS NULL OR p.discount_end   >= NOW())
                THEN ROUND(p.price * (1 - p.discount_percentage / 100), 2)
                ELSE p.price
              END AS effective_price,
              CASE
                WHEN p.discount_percentage > 0
                  AND (p.discount_start IS NULL OR p.discount_start <= NOW())
                  AND (p.discount_end   IS NULL OR p.discount_end   >= NOW())
                THEN TRUE ELSE FALSE
              END AS is_on_discount
       FROM wishlist_items w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if a product is in the user's wishlist
router.get('/:userId/has/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const { rows } = await req.db.query(
      'SELECT 1 FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    res.json({ inWishlist: rows.length > 0 });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a product to the wishlist (idempotent)
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;
  if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(productId))) {
    return res.status(400).json({ error: 'Invalid user or product id' });
  }
  try {
    await req.db.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    );
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'User or product not found' });
    }
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a product from the wishlist
router.delete('/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const result = await req.db.query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not in wishlist' });
    }
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
