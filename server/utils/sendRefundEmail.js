const nodemailer = require('nodemailer');

const sendRefundEmail = async (to, info) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`Refund email skipped for ${to}: email credentials are not configured.`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const amount = Number(info.refundAmount || 0).toFixed(2);
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#8B0000;padding:28px;color:#fff;text-align:center">
      <div style="font-size:24px;font-weight:800;color:#fff;margin:0">Refund Approved</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px">PazarYolu Marketplace</div>
    </div>
    <div style="padding:28px">
      <p style="margin:0 0 16px;color:#111;font-size:15px">Hi ${info.customerName || 'there'},</p>
      <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6">
        Your return request for <strong>${info.productName || 'your product'}</strong> has been approved.
      </p>
      <div style="background:#f8f9fa;border-radius:10px;padding:18px;text-align:center">
        <p style="margin:0 0 6px;color:#666;font-size:13px">Refund amount</p>
        <p style="margin:0;color:#8B0000;font-weight:800;font-size:24px">$${amount}</p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:22px">
        The returned quantity has been added back to store stock.
      </p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"PazarYolu" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Refund approved: ${info.productName || 'return request'}`,
    html
  });
};

module.exports = sendRefundEmail;
