const express = require('express');
const router = express.Router();
const sendOrderEmail = require('../utils/sendOrderEmail');

router.post('/checkout', async (req, res) => {
  try {
    const { userId, userEmail, items, totalAmount, shippingAddressId, billingAddressId } = req.body;

    // 1. Insert order into the database
    const orderResult = await req.db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
      [userId, totalAmount, shippingAddressId, billingAddressId]
    );
    const orderId = orderResult.rows[0].id;

    // 2. Insert order items
    for (const item of items) {
      await req.db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id || item.product_id, item.quantity, item.price]
      );
    }

    // 3. Fetch addresses to include in the email
    let shippingAddress = null;
    let billingAddress = null;

    if (shippingAddressId) {
      const shipResult = await req.db.query('SELECT * FROM addresses WHERE id = $1', [shippingAddressId]);
      shippingAddress = shipResult.rows[0];
    }
    if (billingAddressId) {
      const billResult = await req.db.query('SELECT * FROM addresses WHERE id = $1', [billingAddressId]);
      billingAddress = billResult.rows[0];
    }

    const orderInfo = {
      orderId,
      items,
      totalAmount,
      shippingAddress,
      billingAddress
    };

    await sendOrderEmail(userEmail, orderInfo);

    res.status(200).json({
      message: 'Order completed and email sent.',
      orderId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Checkout failed.'
    });
  }
});

module.exports = router;