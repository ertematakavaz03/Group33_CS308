const express = require('express');
const router = express.Router();
const sendOrderEmail = require('../utils/sendOrderEmail');

router.post('/checkout', async (req, res) => {
  try {
    const { userEmail, items, totalAmount } = req.body;

    const orderInfo = {
      orderId: Date.now(),
      items,
      totalAmount
    };

    await sendOrderEmail(userEmail, orderInfo);

    res.status(200).json({
      message: 'Order completed and email sent.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Checkout failed.'
    });
  }
});

module.exports = router;