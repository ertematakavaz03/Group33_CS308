const nodemailer = require('nodemailer');

const sendOrderEmail = async (to, orderInfo) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const itemsHtml = orderInfo.items.map((item) => {
    return `<li>${item.name} x ${item.quantity} - $${Number(item.price).toFixed(2)}</li>`;
  }).join('');

  const formatAddress = (addr) => {
    if (!addr) return 'Not provided';
    return `${addr.title}<br>${addr.full_address}<br>${addr.district || ''}, ${addr.city || ''} ${addr.postal_code || ''}`;
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Order Confirmation',
    html: `
      <h2>Thank you for your order</h2>
      <p>Your order has been received successfully.</p>
      <p><strong>Order Number:</strong> ${orderInfo.orderId}</p>
      <p><strong>Total:</strong> $${Number(orderInfo.totalAmount).toFixed(2)}</p>
      
      <div style="display: flex; gap: 20px; margin-top: 20px;">
        <div style="flex: 1; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
          <h3 style="margin-top: 0;">Shipping Address</h3>
          <p>${formatAddress(orderInfo.shippingAddress)}</p>
        </div>
        <div style="flex: 1; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
          <h3 style="margin-top: 0;">Billing Address</h3>
          <p>${formatAddress(orderInfo.billingAddress)}</p>
        </div>
      </div>

      <h3 style="margin-top: 20px;">Items:</h3>
      <ul>
        ${itemsHtml}
      </ul>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOrderEmail;