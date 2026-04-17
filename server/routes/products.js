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

// Checkout elements and reduce stock safely
router.post('/checkout', async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    try {
        await req.db.query('BEGIN'); // Start transaction
        
        for (const item of items) {
            // Subtract stock safely using SQL logic. Only proceeds if stock >= checkout amount.
            const result = await req.db.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
                [item.quantity, item.id]
            );
            
            if (result.rows.length === 0) {
                await req.db.query('ROLLBACK');
                return res.status(400).json({ error: `Not enough stock available for one or more items.` });
            }
        }
        
        await req.db.query('COMMIT');
        res.json({ message: 'Checkout successful, stock reduced' });
    } catch (err) {
        await req.db.query('ROLLBACK');
        console.error('Error during checkout:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
