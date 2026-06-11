const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const sendDiscountEmail = require('../utils/sendDiscountEmail');
const rateLimit = require('../utils/rateLimiter');
const generateInvoicePDF = require('../utils/generateInvoicePDF');

// Admin auth uses stateless JWTs so a token stays valid across server restarts
// (there is no in-memory session store to wipe). Falls back to a dev secret if
// JWT_SECRET is not set — set a real one in server/.env for production.
const JWT_SECRET = process.env.JWT_SECRET || 'pazaryolu_admin_dev_secret';
const ADMIN_TOKEN_TTL = '12h';
const sendRefundEmail = require('../utils/sendRefundEmail');

// Brute-force protection on the admin login endpoint.
const adminLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please try again later.' });

// Fire wishlist price-drop notifications for a freshly discounted product (non-blocking)
const notifyWishlistUsers = async (db, product) => {
  try {
    const pct = Number(product.discount_percentage);
    if (!pct || pct <= 0) return;

    const now = Date.now();
    const startOk = !product.discount_start || new Date(product.discount_start).getTime() <= now;
    const endOk = !product.discount_end || new Date(product.discount_end).getTime() >= now;
    if (!startOk || !endOk) return; // discount not active yet — don't notify

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email
       FROM wishlist_items w
       JOIN users u ON u.id = w.user_id
       WHERE w.product_id = $1`,
      [product.id]
    );

    const oldPrice = Number(product.price);
    const newPrice = Math.round(oldPrice * (1 - pct / 100) * 100) / 100;
    let createdCount = 0;

    for (const user of rows) {
      const title = `Discount on ${product.name}`;
      const message = `${product.name} is now ${pct}% off: $${oldPrice.toFixed(2)} -> $${newPrice.toFixed(2)}.`;
      // $2/$3 appear both in the SELECT list and in varchar/text comparisons,
      // so they need explicit casts or Postgres fails with "inconsistent types
      // deduced for parameter" (42P08).
      const inserted = await db.query(
        `INSERT INTO notifications (user_id, type, title, message)
         SELECT $1::int, 'discount', $2::varchar, $3::text
         WHERE NOT EXISTS (
           SELECT 1
           FROM notifications
           WHERE user_id = $1::int
             AND type = 'discount'
             AND title = $2::varchar
             AND message = $3::text
             AND created_at > NOW() - INTERVAL '1 hour'
         )
         RETURNING id`,
        [user.id, title, message]
      );
      if (inserted.rows.length === 0) continue;
      createdCount += 1;

      sendDiscountEmail(user.email, {
        customerName: user.name,
        productId: product.id,
        productName: product.name,
        oldPrice,
        newPrice,
        discountPercentage: pct
      }).catch((err) => console.error(`Discount email failed for ${user.email}:`, err.message));
    }
    if (createdCount > 0) {
      console.log(`Discount notification queued for ${createdCount} wishlist user(s) on product ${product.id}`);
    }
  } catch (err) {
    console.error('notifyWishlistUsers error:', err);
  }
};



// Auth middleware — verifies the JWT signature. No server-side lookup, so the
// token keeps working after a restart (which is what previously caused random
// "Unauthorized" errors mid-session).
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.adminRole = payload.role;
    req.adminUser = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.adminRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role permission" });
    }

    next();
  };
};

// Login
router.post('/login', adminLoginLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    const { rows } = await req.db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Issue a signed, stateless JWT. It carries the role, survives server
    // restarts, and needs no server-side session store. Concurrent roles never
    // collide because each token is self-contained.
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_TTL }
    );

    res.json({
      token,
      role: admin.role
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout — with stateless JWTs there is no server session to clear, so the
// client just drops its token. Kept for API compatibility.
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out' });
});

// Admin invoice download
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminToken } = req.query;
    try {
      jwt.verify(adminToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

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

    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

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
  } catch (err) {
    console.error('Admin Invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products list (admin) — includes discount info + computed effective price
router.get('/products', auth, async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT p.*,
              CASE
                WHEN p.discount_percentage > 0
                  AND (p.discount_start IS NULL OR p.discount_start <= NOW())
                  AND (p.discount_end   IS NULL OR p.discount_end   >= NOW())
                THEN ROUND(p.price * (1 - p.discount_percentage / 100), 2)
                ELSE p.price
              END AS effective_price,
              CASE
                WHEN p.discount_percentage > 0
                  AND (p.discount_start IS NULL OR p.discount_start <= NOW())
                  AND (p.discount_end   IS NULL OR p.discount_end   >= NOW())
                THEN TRUE ELSE FALSE
              END AS is_on_discount
       FROM products p
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Categories CRUD
router.get('/categories', auth, async (req, res) => {
  try {
    const result = await req.db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/categories', auth, requireRole("product_manager"), async (req, res) => {
  const { name, description } = req.body;
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 100) return res.status(400).json({ error: 'Category name is required (max 100 characters)' });
  if (description && String(description).length > 500) return res.status(400).json({ error: 'Description must be under 500 characters' });
  try {
    const result = await req.db.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [cleanName, description ? String(description).trim() : null]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    if (err.code === '23505') return res.status(400).json({ error: 'Category already exists' });
    console.error('Admin route error:', err); 
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

router.put('/categories/:id', auth, requireRole("product_manager"), async (req, res) => {
  const { name, description } = req.body;
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 100) return res.status(400).json({ error: 'Category name is required (max 100 characters)' });
  if (description && String(description).length > 500) return res.status(400).json({ error: 'Description must be under 500 characters' });
  try {
    const result = await req.db.query(
      'UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [cleanName, description ? String(description).trim() : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) { 
    if (err.code === '23505') return res.status(400).json({ error: 'Category already exists' });
    console.error('Admin route error:', err); 
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

router.delete('/categories/:id', auth, requireRole("product_manager"), async (req, res) => {
  try {
    await req.db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

function validateProductFields({ name, model, serial_no, description, stock, price, warranty, distributor, image_url }) {
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 255) return 'Product name is required (max 255 characters)';
  const cleanModel = String(model || '').trim();
  if (!cleanModel || cleanModel.length > 255) return 'Model is required (max 255 characters)';
  const cleanSerial = String(serial_no || '').trim();
  if (!cleanSerial || cleanSerial.length > 100) return 'Serial number is required (max 100 characters)';
  const stockNum = parseInt(stock, 10);
  if (!Number.isInteger(stockNum) || stockNum < 0 || stockNum > 99999) return 'Stock must be an integer between 0 and 99,999';
  const priceNum = parseFloat(price);
  if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 999999) return 'Price must be a number between 0 and 999,999';
  if (description && String(description).length > 2000) return 'Description must be under 2000 characters';
  if (warranty && String(warranty).trim().length > 100) return 'Warranty must be under 100 characters';
  if (distributor && String(distributor).trim().length > 255) return 'Distributor must be under 255 characters';
  if (image_url && String(image_url).length > 1000) return 'Image URL must be under 1000 characters';
  return null;
}

// Products CRUD
router.post('/products', auth, requireRole("product_manager"), async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  const validationError = validateProductFields({ name, model, serial_no, description, stock, price, warranty, distributor, image_url });
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const result = await req.db.query(
      'INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [String(name).trim(), String(model).trim(), String(serial_no).trim(), description || null, parseInt(stock, 10), parseFloat(price), warranty || null, distributor || null, category, image_url || null, 'active']
    );
    res.json(result.rows[0]);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/products/:id', auth, requireRole("product_manager"), async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  const validationError = validateProductFields({ name, model, serial_no, description, stock, price, warranty, distributor, image_url });
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const result = await req.db.query(
      'UPDATE products SET name=$1, model=$2, serial_no=$3, description=$4, stock=$5, price=$6, warranty=$7, distributor=$8, category=$9, image_url=$10 WHERE id=$11 RETURNING *',
      [String(name).trim(), String(model).trim(), String(serial_no).trim(), description || null, parseInt(stock, 10), parseFloat(price), warranty || null, distributor || null, category, image_url || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/products/:id', auth, requireRole("product_manager"), async (req, res) => {
  try {
    await req.db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Sales managers own pricing decisions.
router.put('/products/:id/price', auth, requireRole("sales_manager"), async (req, res) => {
  const price = Number(req.body.price);
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }

  try {
    const result = await req.db.query(
      'UPDATE products SET price = $1 WHERE id = $2 RETURNING *',
      [price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Set / update a product's discount (dynamic, date-ranged)
router.put('/products/:id/discount', auth, requireRole("sales_manager"), async (req, res) => {
  const { discount_percentage, discount_start, discount_end } = req.body;
  const pct = Number(discount_percentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 99) {
    return res.status(400).json({ error: 'discount_percentage must be between 0 and 99' });
  }
  if (discount_start && discount_end && new Date(discount_start) > new Date(discount_end)) {
    return res.status(400).json({ error: 'discount_start must be before discount_end' });
  }
  try {
    const result = await req.db.query(
      `UPDATE products
         SET discount_percentage = $1,
             discount_start = $2,
             discount_end = $3
       WHERE id = $4
       RETURNING *`,
      [pct, discount_start || null, discount_end || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    // SCRUM-45: notify wishlist users when the product becomes discounted
    notifyWishlistUsers(req.db, result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Clear a product's discount
router.delete('/products/:id/discount', auth, requireRole("sales_manager"), async (req, res) => {
  try {
    const result = await req.db.query(
      `UPDATE products
         SET discount_percentage = 0,
             discount_start = NULL,
             discount_end = NULL
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = [];
    const params = [];
    if (startDate) {
      params.push(startDate);
      filters.push(`o.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      filters.push(`o.created_at <= $${params.length}`);
    }

    const result = await req.db.query(
      `SELECT 
          o.*,
          u.email AS user_email,
          u.name AS user_name,
          a.full_address,
          a.city,
          a.district,
          COALESCE(
            json_agg(
              json_build_object(
                'product_name', p.name,
                'quantity', oi.quantity
              )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'
          ) AS items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       GROUP BY o.id, u.email, u.name, a.full_address, a.city, a.district
       ORDER BY o.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await req.db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const itemsResult = await req.db.query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

router.put('/orders/:id/status', auth, requireRole("product_manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['processing', 'in-transit', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    const result = await req.db.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
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

// Deliveries (Product Manager specific flattened view)
router.get('/deliveries', auth, requireRole("product_manager"), async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT 
          oi.id AS delivery_id,
          o.user_id AS customer_id,
          oi.product_id,
          p.name AS product_name,
          oi.quantity,
          (oi.price_at_purchase * oi.quantity) AS total_price,
          a.full_address,
          a.city,
          a.district,
          o.status,
          o.id AS order_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Users
router.get('/users', auth, async (req, res) => {
  try {
    const result = await req.db.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Reviews
router.get('/reviews', auth, requireRole("product_manager"), async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT r.*, p.name as product_name, u.name as user_name 
             FROM reviews r 
             JOIN products p ON r.product_id = p.id 
             JOIN users u ON r.user_id = u.id 
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/reviews/:id/status', auth, requireRole("product_manager"), async (req, res) => {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const result = await req.db.query(
            'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
        res.json(result.rows[0]);
    } catch (err) { console.error('Admin route error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

// Returns (Sales Manager): list all return requests
router.get('/returns', auth, requireRole("sales_manager"), async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT rr.*,
              p.name AS product_name,
              u.name AS user_name,
              u.email AS user_email,
              oi.price_at_purchase,
              (oi.price_at_purchase * rr.quantity) AS refund_amount
       FROM return_requests rr
       LEFT JOIN products p ON p.id = rr.product_id
       LEFT JOIN users u ON u.id = rr.user_id
       LEFT JOIN order_items oi ON oi.id = rr.order_item_id
       ORDER BY
         CASE WHEN rr.status = 'pending' THEN 0 ELSE 1 END,
         rr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching return requests:', err);
    res.status(500).json({ error: 'Failed to fetch return requests' });
  }
});

// Returns (Sales Manager): approve or reject a return request
router.put('/returns/:id', auth, requireRole("sales_manager"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
  }

  try {
    await req.db.query('BEGIN');

    const current = await req.db.query(
      `SELECT rr.*, u.name AS user_name, u.email AS user_email,
              p.name AS product_name, oi.price_at_purchase,
              (oi.price_at_purchase * rr.quantity) AS refund_amount
       FROM return_requests rr
       LEFT JOIN users u ON u.id = rr.user_id
       LEFT JOIN products p ON p.id = rr.product_id
       LEFT JOIN order_items oi ON oi.id = rr.order_item_id
       WHERE rr.id = $1
       FOR UPDATE OF rr`,
      [id]
    );
    if (current.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(404).json({ error: 'Return request not found' });
    }
    const request = current.rows[0];
    if (request.status !== 'pending') {
      await req.db.query('ROLLBACK');
      return res.status(400).json({ error: `Return request is already ${request.status}` });
    }

    // On approval, restock the returned product
    if (status === 'approved' && request.product_id) {
      await req.db.query(
        `UPDATE products
            SET stock = stock + $1,
                sales_count = GREATEST(sales_count - $1, 0)
          WHERE id = $2`,
        [request.quantity, request.product_id]
      );
    }

    const updated = await req.db.query(
      `UPDATE return_requests
          SET status = $1, resolved_at = NOW()
        WHERE id = $2
        RETURNING *`,
      [status, id]
    );

    await req.db.query('COMMIT');

    if (status === 'approved') {
      try {
        await req.db.query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'refund', $2, $3)`,
          [
            request.user_id,
            `Refund approved for ${request.product_name || 'your product'}`,
            `Your refund of $${Number(request.refund_amount || 0).toFixed(2)} has been approved and the returned item was added back to stock.`
          ]
        );
      } catch (err) {
        console.error('Refund notification insert failed:', err);
      }

      sendRefundEmail(request.user_email, {
        customerName: request.user_name,
        productName: request.product_name,
        refundAmount: request.refund_amount
      }).catch((err) => console.error(`Refund email failed for ${request.user_email}:`, err.message));
    }

    res.json({ message: `Return request ${status}`, request: updated.rows[0] });
  } catch (err) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error('Error processing return request:', err);
    res.status(500).json({ error: 'Failed to process return request' });
  }
});

module.exports = router;
