const express = require('express');
const router = express.Router();
const sendOrderEmail = require('../utils/sendOrderEmail');

// customer checkout
router.post('/checkout', async (req, res) => {
  try {
    const { userId, userEmail, items, totalAmount, shippingAddressId, billingAddressId } = req.body;

    await req.db.query('BEGIN');

    // decrease stock
    for (const item of items) {
      const productId = item.id || item.product_id;
      const result = await req.db.query(
        'UPDATE products SET stock = stock - $1, sales_count = sales_count + $1 WHERE id = $2 AND stock >= $1 RETURNING id',
        [item.quantity, productId]
      );
      if (result.rows.length === 0) {
        await req.db.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough stock for one or more items.' });
      }
    }

    const orderResult = await req.db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status)
       VALUES ($1, $2, $3, $4, 'processing') RETURNING id`,
      [userId, totalAmount, shippingAddressId, billingAddressId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await req.db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id || item.product_id, item.quantity, item.price]
      );
    }

    await req.db.query('COMMIT');

let shippingAddress = null;
let billingAddress = null;

if (shippingAddressId) {
  const shipResult = await req.db.query(
    'SELECT * FROM addresses WHERE id = $1',
    [shippingAddressId]
  );
  shippingAddress = shipResult.rows[0];
}

if (billingAddressId) {
  const billResult = await req.db.query(
    'SELECT * FROM addresses WHERE id = $1',
    [billingAddressId]
  );
  billingAddress = billResult.rows[0];
}

await sendOrderEmail(userEmail, {
  orderId,
  items,
  totalAmount,
  shippingAddress,
  billingAddress
}).catch(err => console.error('Email error:', err));

    res.status(200).json({ message: 'Order completed successfully', orderId });
  } catch (error) {
    console.error('Order checkout error:', error);
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'Checkout failed.' });
  }
});

// customer: get own orders
router.get('/my-orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const ordersResult = await req.db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              a_ship.title      AS shipping_title,
              a_ship.full_address AS shipping_address,
              a_ship.city       AS shipping_city,
              a_bill.title      AS billing_title,
              a_bill.full_address AS billing_address,
              a_bill.city       AS billing_city
       FROM orders o
       LEFT JOIN addresses a_ship ON o.shipping_address_id = a_ship.id
       LEFT JOIN addresses a_bill ON o.billing_address_id  = a_bill.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = ordersResult.rows;
    for (const order of orders) {
      const itemsResult = await req.db.query(
        `SELECT oi.quantity, oi.price_at_purchase, p.id AS product_id, p.name, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// admin: get all orders
router.get('/', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT o.*, u.email AS user_email, u.name AS user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// admin: get one order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await req.db.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await req.db.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// admin: update status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['processing', 'in-transit', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const result = await req.db.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
