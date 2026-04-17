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
    const result = await req.db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Users
router.get('/users', auth, async (req, res) => {
  try {
    const result = await req.db.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;