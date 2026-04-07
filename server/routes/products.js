const express = require('express');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const { rows } = await req.db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
