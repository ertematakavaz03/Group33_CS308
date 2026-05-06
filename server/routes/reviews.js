const express = require('express');
const router = express.Router();

// Get reviews for a specific user
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await req.db.query(
            `SELECT r.*, p.name as product_name, p.image_url 
             FROM reviews r 
             JOIN products p ON r.product_id = p.id 
             WHERE r.user_id = $1 
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
