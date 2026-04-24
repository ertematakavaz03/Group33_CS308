const express = require('express');
const router = express.Router();
const sendOrderEmail = require('../utils/sendOrderEmail');

// customer checkout
router.post('/checkout', async (req, res) => {
  try {
    const {
      userId,
      customerName,
      userEmail,
      address,
      items,
      totalAmount
    } = req.body;

    const orderResult = await req.db.query(
      `INSERT INTO orders (user_id, customer_name, customer_email, address, total_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId || null, customerName, userEmail, address, totalAmount]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await req.db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          item.id || null,
          item.name,
          item.quantity,
          item.price
        ]
      );
    }

    await sendOrderEmail(userEmail, {
      orderId: order.id,
      items,
      totalAmount
    });

    res.status(200).json({
      message: 'Order completed successfully',
      order
    });
  } catch (error) {
    console.error('Order checkout error:', error);
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
        `SELECT oi.quantity, oi.price_at_purchase, p.name, p.image_url
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