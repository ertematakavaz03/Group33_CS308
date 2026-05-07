const PDFDocument = require('pdfkit');

const RED = '#8B0000';
const DARK = '#111111';
const GRAY = '#666666';
const LIGHT_BG = '#F8F9FA';
const LINE = '#E5E7EB';
const GREEN = '#16A34A';

const generateInvoicePDF = (orderInfo) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 595.28;
    const MARGIN = 50;
    const INNER = W - MARGIN * 2;

    // --- RED HEADER ---
    doc.rect(0, 0, W, 110).fill(RED);

    doc.font('Helvetica-Bold').fontSize(26).fillColor('#FFFFFF')
      .text('INVOICE', MARGIN, 30);

    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.85)')
      .text('PazarYolu Marketplace', MARGIN, 62);

    const dateStr = orderInfo.date ||
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF')
      .text(`Order #${orderInfo.orderId}`, 0, 30, { align: 'right', width: W - MARGIN });

    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.85)')
      .text(dateStr, 0, 50, { align: 'right', width: W - MARGIN });

    let y = 130;

    // --- BILLED TO ---
    doc.rect(MARGIN, y, INNER, 68).fill(LIGHT_BG).stroke(LINE);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
      .text('BILLED TO', MARGIN + 16, y + 12, { characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text(orderInfo.customerName || '', MARGIN + 16, y + 26);
    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
      .text(orderInfo.customerEmail || '', MARGIN + 16, y + 42);

    y += 84;

    // --- ITEMS HEADER ---
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
      .text('ITEMS', MARGIN, y, { characterSpacing: 1 });

    y += 14;

    // table outer border start
    const tableTop = y;
    const COL_QTY = W - MARGIN - 60;
    const COL_PRICE = W - MARGIN - 10;

    // table header row
    doc.rect(MARGIN, y, INNER, 28).fill(LIGHT_BG);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
      .text('PRODUCT', MARGIN + 14, y + 10, { characterSpacing: 0.8 })
      .text('QTY', COL_QTY - 30, y + 10, { characterSpacing: 0.8 })
      .text('PRICE', COL_PRICE - 38, y + 10, { characterSpacing: 0.8 });

    y += 28;

    // item rows
    orderInfo.items.forEach((item, idx) => {
      const rowH = 34;
      if (idx % 2 === 1) doc.rect(MARGIN, y, INNER, rowH).fill('#FAFAFA');

      doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
        .text(item.name, MARGIN + 14, y + 11, { width: INNER - 120 });

      doc.font('Helvetica').fontSize(10).fillColor(GRAY)
        .text(`x${item.quantity}`, COL_QTY - 22, y + 11)
        .text(`$${(item.price * item.quantity).toFixed(2)}`, COL_PRICE - 50, y + 11);

      doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER, y).stroke(LINE);
      y += rowH;
    });

    // total row
    doc.rect(MARGIN, y, INNER, 36).fill('#FAFAFA');
    doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER, y).lineWidth(1.5).stroke(LINE);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text('Total', MARGIN + 14, y + 11);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(RED)
      .text(`$${Number(orderInfo.totalAmount).toFixed(2)}`, COL_PRICE - 55, y + 9);

    y += 36;

    // table border
    doc.rect(MARGIN, tableTop, INNER, y - tableTop).lineWidth(1).stroke(LINE);

    y += 20;

    // --- SHIPPING ADDRESS ---
    if (orderInfo.shippingAddress) {
      const addr = orderInfo.shippingAddress;
      const textW = INNER - 32;
      const addrLines = [
        addr.full_address,
        [addr.district, addr.city, addr.postal_code].filter(Boolean).join(', ')
      ].filter(Boolean);

      // measure real heights
      const titleH = addr.title
        ? doc.font('Helvetica-Bold').fontSize(10).heightOfString(addr.title, { width: textW })
        : 0;
      const linesH = addrLines.reduce((sum, line) =>
        sum + doc.font('Helvetica').fontSize(9).heightOfString(line, { width: textW }) + 4, 0);

      const blockH = 16 + 16 + 8 + titleH + 6 + linesH + 16;

      doc.rect(MARGIN, y, INNER, blockH).fill(LIGHT_BG).stroke(LINE);

      doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
        .text('SHIPPING ADDRESS', MARGIN + 16, y + 16, { characterSpacing: 1, width: textW });

      let lineY = y + 38;

      if (addr.title) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
          .text(addr.title, MARGIN + 16, lineY, { width: textW });
        lineY += titleH + 6;
      }

      addrLines.forEach(line => {
        const lh = doc.font('Helvetica').fontSize(9).heightOfString(line, { width: textW });
        doc.font('Helvetica').fontSize(9).fillColor(GRAY)
          .text(line, MARGIN + 16, lineY, { width: textW });
        lineY += lh + 4;
      });

      y += blockH + 20;
    }

    // --- CONFIRMATION NOTE ---
    doc.font('Helvetica').fontSize(9).fillColor(GREEN)
      .text(
        `A copy of this invoice has been sent to ${orderInfo.customerEmail}`,
        MARGIN, y, { align: 'center', width: INNER }
      );

    y += 28;

    // --- FOOTER ---
    doc.moveTo(MARGIN, y).lineTo(MARGIN + INNER, y).lineWidth(0.5).stroke(LINE);
    y += 12;
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
      .text('PazarYolu Marketplace  ·  Thank you for your purchase', MARGIN, y, { align: 'center', width: INNER });

    doc.end();
  });
};

module.exports = generateInvoicePDF;
