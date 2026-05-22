const nodemailer = require('nodemailer');

/**
 * Notify a wishlist user that a product they saved is now discounted.
 * @param {string} to - recipient email
 * @param {object} info - { customerName, productId, productName, oldPrice, newPrice, discountPercentage }
 */
const sendDiscountEmail = async (to, info) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const old = Number(info.oldPrice).toFixed(2);
  const now = Number(info.newPrice).toFixed(2);
  const pct = Math.round(Number(info.discountPercentage));

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#8B0000;padding:32px;color:#fff;text-align:center">
      <div style="font-size:24px;font-weight:800;color:#fff;margin:0">Price Drop!</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px">PazarYolu Marketplace</div>
    </div>
    <div style="padding:28px">
      <p style="margin:0 0 16px;color:#111;font-size:15px">Hi ${info.customerName || 'there'},</p>
      <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6">
        Good news! An item on your wishlist is now on sale.
      </p>
      <div style="background:#f8f9fa;border-radius:10px;padding:20px;text-align:center">
        <p style="margin:0 0 10px;font-weight:700;color:#111;font-size:16px">${info.productName}</p>
        <p style="margin:0">
          <span style="color:#9ca3af;text-decoration:line-through;font-size:15px">$${old}</span>
          <span style="color:#8B0000;font-weight:800;font-size:22px;margin-left:10px">$${now}</span>
        </p>
        <span style="display:inline-block;margin-top:10px;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:800">
          ${pct}% OFF
        </span>
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="http://localhost:5173/product/${info.productId}"
           style="display:inline-block;background:#8B0000;color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;font-size:14px">
          View Product
        </a>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px">
        You received this email because this product is on your PazarYolu wishlist.
      </p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"PazarYolu" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Price drop on your wishlist: ${info.productName}`,
    html
  });
};

module.exports = sendDiscountEmail;
