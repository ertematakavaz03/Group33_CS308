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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Order Confirmation',
    html: `
      <h2>Thank you for your order</h2>
      <p>Your order has been received successfully.</p>
      <p><strong>Order Number:</strong> ${orderInfo.orderId}</p>
      <p><strong>Total:</strong> $${Number(orderInfo.totalAmount).toFixed(2)}</p>
      <h3>Items:</h3>
      <ul>
        ${itemsHtml}
      </ul>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOrderEmail;