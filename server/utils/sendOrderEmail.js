const nodemailer = require('nodemailer');
const generateInvoicePDF = require('./generateInvoicePDF');

const sendOrderEmail = async (to, orderInfo) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const pdfBuffer = await generateInvoicePDF(orderInfo);

  const formatAddress = (addr) => {
    if (!addr) return 'Not provided';
    return `${addr.title}<br>${addr.full_address}<br>${addr.district || ''}, ${addr.city || ''} ${addr.postal_code || ''}`;
  };

  const itemsHtml = orderInfo.items.map((item) =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-weight:600">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;color:#666">x${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#8B0000;padding:32px;color:#fff">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top">
            <div style="font-size:24px;font-weight:800;color:#fff;margin:0">INVOICE</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px">PazarYolu Marketplace</div>
          </td>
          <td style="vertical-align:top;text-align:right">
            <div style="font-size:15px;font-weight:700;color:#fff">Order #${orderInfo.orderId}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px">${orderInfo.date || new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:28px">
      <div style="background:#f8f9fa;border-radius:8px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;letter-spacing:0.08em">BILLED TO</p>
        <p style="margin:0;font-weight:600;color:#111">${orderInfo.customerName || ''}</p>
        <p style="margin:2px 0 0;color:#666;font-size:13px">${to}</p>
      </div>
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#888;letter-spacing:0.08em">ITEMS</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f8f9fa">
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:#888;letter-spacing:0.06em">PRODUCT</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:#888;letter-spacing:0.06em">QTY</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;color:#888;letter-spacing:0.06em">PRICE</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#fafafa;border-top:2px solid #f0f0f0">
            <td colspan="2" style="padding:12px 14px;font-weight:800;color:#111">Total</td>
            <td style="padding:12px 14px;text-align:right;font-weight:800;font-size:15px;color:#8B0000">$${Number(orderInfo.totalAmount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      ${orderInfo.shippingAddress ? `
      <div style="margin-top:20px;background:#f8f9fa;border-radius:8px;padding:14px 16px">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;letter-spacing:0.08em">SHIPPING ADDRESS</p>
        <p style="margin:0;font-weight:600;color:#111">${orderInfo.shippingAddress.title || ''}</p>
        <p style="margin:2px 0 0;color:#666;font-size:13px">${formatAddress(orderInfo.shippingAddress)}</p>
      </div>` : ''}
      <p style="text-align:center;color:#16a34a;font-weight:600;font-size:13px;margin-top:20px">
        Your invoice PDF is attached to this email.
      </p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"PazarYolu" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Confirmation – Order #${orderInfo.orderId}`,
    html,
    attachments: [
      {
        filename: `invoice-order-${orderInfo.orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
};

module.exports = sendOrderEmail;
