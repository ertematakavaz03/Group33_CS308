const express = require('express');
const router = express.Router();
const ensureReviewUpdatedAtColumn = require('../utils/ensureReviewUpdatedAtColumn');

const hasPurchasedProduct = async (db, userId, productId) => {
    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE o.user_id = $1
              AND oi.product_id = $2
              AND o.status <> 'cancelled'
        ) AS can_review`,
        [userId, productId]
    );

    return result.rows[0]?.can_review === true;
};

// Get all products
router.get('/', async (req, res) => {
    try {
        const { rows } = await req.db.query(`
            SELECT p.*,
                   COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
                   COUNT(r.id)::int AS review_count
            FROM products p
            LEFT JOIN reviews r
              ON r.product_id = p.id
             AND r.status = 'approved'
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
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

// Get reviews for a product
router.get('/:id/reviews', async (req, res) => {
    const { id } = req.params;
    try {
        await ensureReviewUpdatedAtColumn(req.db);
        const result = await req.db.query(
            `SELECT r.id, r.user_id, r.rating, r.comment, r.status, r.created_at, r.updated_at, u.name as user_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/review-eligibility', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
        return res.json({ canReview: false });
    }

    try {
        const canReview = await hasPurchasedProduct(req.db, userId, id);
        res.json({ canReview });
    } catch (err) {
        console.error('Error checking review eligibility:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit a new review
router.post('/:id/reviews', async (req, res) => {
    const { id } = req.params;
    const { user_id, rating, comment } = req.body;
    
    if (!user_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid review data' });
    }

    try {
        await ensureReviewUpdatedAtColumn(req.db);
        const canReview = await hasPurchasedProduct(req.db, user_id, id);
        if (!canReview) {
            return res.status(403).json({ error: 'Only customers who purchased this product can review it' });
        }

        const result = await req.db.query(
            `WITH inserted AS (
                INSERT INTO reviews (product_id, user_id, rating, comment, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
             )
             SELECT inserted.id, inserted.product_id, inserted.user_id, inserted.rating,
                    inserted.comment, inserted.status, inserted.created_at, inserted.updated_at, users.name as user_name
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

router.put('/:productId/reviews/:reviewId', async (req, res) => {
    const { productId, reviewId } = req.params;
    const { user_id, rating, comment } = req.body;

    if (!user_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid review data' });
    }

    try {
        await ensureReviewUpdatedAtColumn(req.db);

        const result = await req.db.query(
            `UPDATE reviews AS r
             SET rating = $1,
                 comment = $2,
                 status = 'pending',
                 updated_at = CURRENT_TIMESTAMP
             FROM users
             WHERE r.id = $3
               AND r.product_id = $4
               AND r.user_id = $5
               AND users.id = r.user_id
             RETURNING r.id, r.product_id, r.user_id, r.rating, r.comment,
                       r.status, r.created_at, r.updated_at, users.name AS user_name`,
            [rating, comment, reviewId, productId, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
