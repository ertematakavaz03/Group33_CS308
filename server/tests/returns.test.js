const request = require('supertest');
const express = require('express');
const returnsRoutes = require('../routes/returns');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/returns', returnsRoutes);

describe('POST /api/returns', () => {
    test('creates a return request for a delivered order item', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ order_item_id: 15, order_id: 7, product_id: 8, quantity: 1, user_id: 4, order_status: 'delivered', order_created_at: new Date() }] }) // item lookup
            .mockResolvedValueOnce({ rows: [] })                                  // no existing return
            .mockResolvedValueOnce({ rows: [{ id: 1, order_id: 7, status: 'pending' }] }); // INSERT

        const res = await request(app).post('/api/returns').send({
            userId: 4, orderItemId: 15, reason: 'Defective'
        });

        expect(res.status).toBe(201);
        expect(res.body.request).toHaveProperty('status', 'pending');
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/api/returns').send({ userId: 4 });
        expect(res.status).toBe(400);
    });

    test('returns 404 when the order item does not exist', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).post('/api/returns').send({ userId: 4, orderItemId: 9999 });
        expect(res.status).toBe(404);
    });

    test('returns 403 when the item belongs to another user', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ order_item_id: 15, order_id: 7, product_id: 8, quantity: 1, user_id: 99, order_status: 'delivered' }]
        });
        const res = await request(app).post('/api/returns').send({ userId: 4, orderItemId: 15 });
        expect(res.status).toBe(403);
    });

    test('returns 400 when the order is not delivered', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ order_item_id: 19, order_id: 8, product_id: 5, quantity: 1, user_id: 4, order_status: 'processing' }]
        });
        const res = await request(app).post('/api/returns').send({ userId: 4, orderItemId: 19 });
        expect(res.status).toBe(400);
    });

    test('returns 400 when a return request already exists for the item', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [{ order_item_id: 15, order_id: 7, product_id: 8, quantity: 1, user_id: 4, order_status: 'delivered', order_created_at: new Date() }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] });
        const res = await request(app).post('/api/returns').send({ userId: 4, orderItemId: 15 });
        expect(res.status).toBe(400);
    });

    test('returns 400 when the purchase is older than 30 days', async () => {
        const olderThanThirtyDays = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
        mockDb.query.mockResolvedValueOnce({
            rows: [{ order_item_id: 15, order_id: 7, product_id: 8, quantity: 1, user_id: 4, order_status: 'delivered', order_created_at: olderThanThirtyDays }]
        });

        const res = await request(app).post('/api/returns').send({ userId: 4, orderItemId: 15 });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/30 days/i);
    });
});

describe('GET /api/returns/my/:userId', () => {
    test('returns the list of a user return requests', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, product_name: 'T-Shirt', status: 'pending', order_item_id: 15 }]
        });
        const res = await request(app).get('/api/returns/my/4');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('status', 'pending');
    });
});
