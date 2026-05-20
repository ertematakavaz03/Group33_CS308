const express = require('express');
const router = express.Router();

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const ADMIN_TOKEN = "pazaryolu-admin-secret-token";

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
};

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

// Products CRUD
router.post('/products', auth, async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  try {
    const result = await req.db.query(
      'INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, 'active']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', auth, async (req, res) => {
  const { name, model, serial_no, description, stock, price, warranty, distributor, category, image_url } = req.body;
  try {
    const result = await req.db.query(
      'UPDATE products SET name=$1, model=$2, serial_no=$3, description=$4, stock=$5, price=$6, warranty=$7, distributor=$8, category=$9, image_url=$10 WHERE id=$11 RETURNING *',
      [name, model, serial_no, description, stock, price, warranty, distributor, category, image_url, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:id', auth, async (req, res) => {
  try {
    await req.db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
router.get('/orders', auth, async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT o.*, u.email AS user_email, u.name AS user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
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