const express = require('express');
const router = express.Router();

// Customer: create a return request for a delivered order item
router.post('/', async (req, res) => {
  const { userId, orderItemId, reason } = req.body;

  if (!Number.isInteger(Number(userId)) || !Number.isInteger(Number(orderItemId))) {
    return res.status(400).json({ error: 'userId and orderItemId are required' });
  }

  try {
    // Fetch the order item together with its parent order
    const itemResult = await req.db.query(
      `SELECT oi.id AS order_item_id, oi.order_id, oi.product_id, oi.quantity,
              o.user_id, o.status AS order_status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1`,
      [orderItemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order item not found' });
    }
    const item = itemResult.rows[0];

    if (Number(item.user_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Not allowed to return this item' });
    }
    if (item.order_status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be returned' });
    }

    const existing = await req.db.query(
      'SELECT id, status FROM return_requests WHERE order_item_id = $1',
      [orderItemId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `A return request already exists for this item (${existing.rows[0].status}).` });
    }

    const inserted = await req.db.query(
      `INSERT INTO return_requests (order_id, order_item_id, user_id, product_id, quantity, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [item.order_id, item.order_item_id, userId, item.product_id, item.quantity, reason || null]
    );

    res.status(201).json({ message: 'Return request submitted', request: inserted.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A return request already exists for this item.' });
    }
    console.error('Error creating return request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer: list own return requests
router.get('/my/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await req.db.query(
      `SELECT rr.*, p.name AS product_name, p.image_url
       FROM return_requests rr
       LEFT JOIN products p ON p.id = rr.product_id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching return requests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
