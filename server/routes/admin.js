const express = require('express');
const router = express.Router();

const ADMINS = [
  {
    username: "product_manager",
    password: "product123",
    role: "product_manager"
  },
  {
    username: "sales_manager",
    password: "sales123",
    role: "sales_manager"
  }
];

const ADMIN_TOKEN = "pazaryolu-admin-secret-token";
const adminSessions = {};

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token !== ADMIN_TOKEN || !adminSessions[token]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminRole = adminSessions[token].role;
  next();
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
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const admin = ADMINS.find(
    (a) => a.username === username && a.password === password
  );

  if (!admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  adminSessions[ADMIN_TOKEN] = {
    username: admin.username,
    role: admin.role
  };
  
  res.json({
    token: ADMIN_TOKEN,
    role: admin.role
  });
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Products CRUD
router.post('/products', auth, requireRole("product_manager"), async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  try {
    const result = await req.db.query(
      'INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, 'active']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', auth, requireRole("product_manager"), async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  try {
    const result = await req.db.query(
      'UPDATE products SET name=$1, model=$2, serial_no=$3, description=$4, stock=$5, price=$6, warranty=$7, distributor=$8, category=$9, image_url=$10 WHERE id=$11 RETURNING *',
      [name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:id', auth, requireRole("product_manager"), async (req, res) => {
  try {
    await req.db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
router.get('/orders', auth, async (req, res) => {
  try {
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
       GROUP BY o.id, u.email, u.name, a.full_address, a.city, a.district
       ORDER BY o.created_at DESC`
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

router.put('/orders/:id/status', auth, async (req, res) => {
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews
router.get('/reviews', auth, async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT r.*, p.name as product_name, u.name as user_name 
             FROM reviews r 
             JOIN products p ON r.product_id = p.id 
             JOIN users u ON r.user_id = u.id 
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reviews/:id/status', auth, async (req, res) => {
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;