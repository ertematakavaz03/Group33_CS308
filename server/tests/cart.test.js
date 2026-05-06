const request = require('supertest');
const express = require('express');
const cartRoutes = require('../routes/cart');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/cart', cartRoutes);

describe('GET /api/cart/:userId', () => {
    test('returns cart items for a user', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, name: 'Laptop', price: 999, quantity: 2, stock: 5, image_url: null }]
        });

        const res = await request(app).get('/api/cart/1');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].name).toBe('Laptop');
    });

    test('returns empty array if cart is empty', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/cart/1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('POST /api/cart/:userId', () => {
    test('adds a product to the cart when stock is available', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ stock: 10 }] })  // product exists, stock = 10
            .mockResolvedValueOnce({ rows: [] })                // no existing cart item
            .mockResolvedValueOnce({ rows: [] });               // INSERT

        const res = await request(app).post('/api/cart/1').send({
            productId: 5,
            quantity: 1
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/cart/i);
    });

    test('returns 400 if product is out of stock', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ stock: 0 }] });

        const res = await request(app).post('/api/cart/1').send({
            productId: 5,
            quantity: 1
        });

        expect(res.status).toBe(400);
    });

    test('returns 404 if product does not exist', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).post('/api/cart/1').send({
            productId: 9999,
            quantity: 1
        });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/cart/:userId/item/:productId', () => {
    test('removes a specific item from the cart', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/cart/1/item/5');

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/removed/i);
    });
});

describe('DELETE /api/cart/:userId', () => {
    test('clears the entire cart for a user', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/cart/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/cleared/i);
    });
});
