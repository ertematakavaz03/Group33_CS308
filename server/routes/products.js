const express = require('express');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const { rows } = await req.db.query(`
            SELECT p.*,
                   COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
                   COUNT(r.rating)::int AS review_count,
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
            LEFT JOIN reviews r
              ON r.product_id = p.id AND r.status = 'approved'
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Deprecated: checkout must go through /api/orders/checkout so login,
// payment, invoice, and order history rules stay together.
router.post('/checkout', async (req, res) => {
    res.status(410).json({ error: 'Use /api/orders/checkout for checkout.' });
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
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
             FROM products p WHERE p.id = $1`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get reviews for a product
router.get('/:id/reviews', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await req.db.query(
            `SELECT r.id, r.user_id, r.rating, r.comment, r.status, r.created_at, u.name as user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = $1 AND r.status = 'approved'
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit a new review
router.post('/:id/reviews', async (req, res) => {
    const { id } = req.params;
    const { user_id, rating, comment } = req.body;

    if (!user_id || isNaN(Number(user_id)) || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid review data' });
    }

    try {
        const purchaseCheck = await req.db.query(
            `SELECT 1 FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
             LIMIT 1`,
            [user_id, id]
        );
        if (purchaseCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You can only review products that have been delivered to you.' });
        }

        const result = await req.db.query(
            `WITH inserted AS (
                INSERT INTO reviews (product_id, user_id, rating, comment, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
             )
             SELECT inserted.id, inserted.product_id, inserted.user_id, inserted.rating,
                    inserted.comment, inserted.status, inserted.created_at, users.name as user_name
             FROM inserted
             JOIN users ON users.id = inserted.user_id`,
            [id, user_id, rating, comment, 'pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all reviews by a user
router.get('/user-reviews/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await req.db.query(
            `SELECT r.id, r.product_id, r.rating, r.comment, r.status, r.created_at, p.name AS product_name
             FROM reviews r
             JOIN products p ON r.product_id = p.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
