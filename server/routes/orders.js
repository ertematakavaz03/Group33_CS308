const express = require('express');
const router = express.Router();
const sendOrderEmail = require('../utils/sendOrderEmail');
const generateInvoicePDF = require('../utils/generateInvoicePDF');
const adminSessions = require('../utils/adminSessions');

// customer checkout
router.post('/checkout', async (req, res) => {
  try {
    const { userId, userEmail, userName, items, shippingAddressId, billingAddressId } = req.body;

    if (!userId || !userEmail || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Checkout requires a user, email, and at least one item.' });
    }

    // Only the product id and quantity are trusted from the client.
    // Prices are NEVER taken from the request — they are resolved server-side.
    const requestedItems = items.map((item) => ({
      productId: item?.id ?? item?.product_id,
      quantity: item?.quantity
    }));

    const hasInvalidItem = requestedItems.some((item) =>
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    );
    if (hasInvalidItem) {
      return res.status(400).json({ error: 'Checkout items must include a product id and a positive quantity.' });
    }

    await req.db.query('BEGIN');

    // Decrease stock and read the authoritative (discount-aware) price in one
    // atomic statement, so the price cannot be tampered with by the client.
    const pricedItems = [];
    for (const item of requestedItems) {
      const result = await req.db.query(
        `UPDATE products
            SET stock = stock - $1, sales_count = sales_count + $1
          WHERE id = $2 AND stock >= $1
          RETURNING id, name,
            CASE
              WHEN discount_percentage > 0
                AND (discount_start IS NULL OR discount_start <= NOW())
                AND (discount_end   IS NULL OR discount_end   >= NOW())
              THEN ROUND(price * (1 - discount_percentage / 100), 2)
              ELSE price
            END AS effective_price`,
        [item.quantity, item.productId]
      );
      if (result.rows.length === 0) {
        await req.db.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough stock for one or more items.' });
      }
      const row = result.rows[0];
      pricedItems.push({
        id: row.id,
        name: row.name,
        quantity: item.quantity,
        price: Number(row.effective_price)
      });
    }

    // The server is the single source of truth for the order total.
    const totalAmount = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const orderResult = await req.db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status)
       VALUES ($1, $2, $3, $4, 'processing') RETURNING id`,
       [userId, totalAmount, shippingAddressId, billingAddressId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of pricedItems) {
      await req.db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
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
  customerName: userName,
  customerEmail: userEmail,
  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
  items: pricedItems,
  totalAmount,
  shippingAddress,
  billingAddress
}).catch(err => console.error('Email error:', err));

    res.status(200).json({ message: 'Order completed successfully', orderId, totalAmount });
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
        `SELECT oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price_at_purchase,
                p.name, p.image_url
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

// download invoice PDF for a specific order
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const orderResult = await req.db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email,
              a_ship.title AS ship_title, a_ship.full_address AS ship_full_address,
              a_ship.city AS ship_city, a_ship.district AS ship_district,
              a_ship.postal_code AS ship_postal_code
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN addresses a_ship ON o.shipping_address_id = a_ship.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Authorization: User must be the owner of the order
    const isOwner = userId && Number(userId) === Number(order.user_id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to download this invoice' });
    }
    const itemsResult = await req.db.query(
      `SELECT oi.quantity, oi.price_at_purchase AS price, p.name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    const pdfBuffer = await generateInvoicePDF({
      orderId: order.id,
      customerName: order.user_name,
      customerEmail: order.user_email,
      date: new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      items: itemsResult.rows,
      totalAmount: order.total_amount,
      shippingAddress: order.ship_full_address ? {
        title: order.ship_title,
        full_address: order.ship_full_address,
        city: order.ship_city,
        district: order.ship_district,
        postal_code: order.ship_postal_code
      } : null
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-order-${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
});

// customer: cancel own order (only while in "processing" state)
router.put('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    await req.db.query('BEGIN');

    const orderResult = await req.db.query(
      'SELECT id, user_id, status FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (orderResult.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderResult.rows[0];
    if (Number(order.user_id) !== Number(userId)) {
      await req.db.query('ROLLBACK');
      return res.status(403).json({ error: 'Not allowed to cancel this order' });
    }
    if (order.status !== 'processing') {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Order cannot be cancelled in "${order.status}" state.` });
    }

    const itemsResult = await req.db.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );
    for (const item of itemsResult.rows) {
      if (item.product_id) {
        await req.db.query(
          `UPDATE products
              SET stock = stock + $1,
                  sales_count = GREATEST(sales_count - $1, 0)
            WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    const updated = await req.db.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    await req.db.query('COMMIT');
    res.json({ message: 'Order cancelled', order: updated.rows[0] });
  } catch (err) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
