const express = require('express');
const router = express.Router();

// GET user cart
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await req.db.query(`
            SELECT c.id as cart_item_id, c.product_id as id, c.quantity, 
                   p.name, p.price, p.image_url, p.category, p.stock
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.id ASC
        `, [userId]);
        
        // Ensure we don't send back items with quantity > stock (auto-adjustment could happen here, or frontend can handle it)
        const adjustedItems = result.rows.map(item => {
            if (item.quantity > item.stock) {
                // We'll trust the DB updates to fix it, but provide stock accurately so the frontend disables + signs
                item.quantity = Math.min(item.quantity, item.stock);
            }
            return item;
        });

        res.json(adjustedItems);
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST to sync an entire local cart to the DB (used on login)
router.post('/:userId/sync', async (req, res) => {
    const { userId } = req.params;
    const { cartItems } = req.body; // array of { id: product_id, quantity }
    
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.json({ message: 'No items to sync' });
    }

    try {
        await req.db.query('BEGIN'); // Start transaction

        for (const item of cartItems) {
            // Check stock
            const product = await req.db.query('SELECT stock FROM products WHERE id = $1', [item.id]);
            if (product.rows.length === 0) continue;
            
            const maxQuantity = product.rows[0].stock;
            const requestedQuantity = item.quantity || 1;
            
            // Upsert: if product is already in cart, increment quantity (up to stock)
            await req.db.query(`
                INSERT INTO cart_items (user_id, product_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, product_id)
                DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, $4)
            `, [userId, item.id, requestedQuantity, maxQuantity]);
        }

        await req.db.query('COMMIT');
        res.json({ message: 'Cart synced successfully' });
    } catch (err) {
        await req.db.query('ROLLBACK');
        console.error('Error syncing cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST add item to cart (or increment)
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    const qty = quantity || 1;

    try {
        const product = await req.db.query('SELECT stock FROM products WHERE id = $1', [productId]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const stock = product.rows[0].stock;
        if (stock < 1) {
            return res.status(400).json({ error: 'Product is out of stock' });
        }

        const currentItem = await req.db.query('SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        const currentQty = currentItem.rows.length > 0 ? currentItem.rows[0].quantity : 0;
        
        if (currentQty + qty > stock) {
            return res.status(400).json({ error: 'Cannot add more than available stock' });
        }

        await req.db.query(`
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
        `, [userId, productId, qty]);

        res.json({ message: 'Added to cart' });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update quantity directly (e.g., handles +/- buttons where you send new total qty)
router.put('/:userId/item/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
        try {
            await req.db.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
            return res.json({ message: 'Item removed from cart' });
        } catch (e) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    try {
        const product = await req.db.query('SELECT stock FROM products WHERE id = $1', [productId]);
        if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        
        const safeQuantity = Math.min(quantity, product.rows[0].stock);

        await req.db.query(`
            UPDATE cart_items 
            SET quantity = $3
            WHERE user_id = $1 AND product_id = $2
        `, [userId, productId, safeQuantity]);

        res.json({ message: 'Cart updated', quantity: safeQuantity });
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE remove single item
router.delete('/:userId/item/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    try {
        await req.db.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
        res.json({ message: 'Item removed' });
    } catch (err) {
        console.error('Error removing item:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE clear entire cart
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await req.db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
