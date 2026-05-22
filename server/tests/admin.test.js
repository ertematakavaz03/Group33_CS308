const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/admin');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/admin', adminRoutes);

const ADMIN_TOKEN = 'pazaryolu-admin-secret-token';
const authHeader = { Authorization: `Bearer ${ADMIN_TOKEN}` };

// The auth middleware requires an active admin session, so log in once
// before the authenticated route tests run to populate it.
beforeAll(async () => {
    await request(app).post('/api/admin/login').send({
        username: 'product_manager',
        password: 'product123'
    });
});

describe('POST /api/admin/login', () => {
    test('returns token on valid admin credentials', async () => {
        const res = await request(app).post('/api/admin/login').send({
            username: 'product_manager',
            password: 'product123'
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('role', 'product_manager');
    });

    test('returns 401 on invalid admin credentials', async () => {
        const res = await request(app).post('/api/admin/login').send({
            username: 'product_manager',
            password: 'wrongpassword'
        });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/admin/reviews', () => {
    test('returns 401 without auth token', async () => {
        const res = await request(app).get('/api/admin/reviews');
        expect(res.status).toBe(401);
    });

    test('returns all reviews for admin', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, rating: 5, comment: 'Great', product_name: 'Laptop', user_name: 'Alice', status: 'pending' }]
        });

        const res = await request(app).get('/api/admin/reviews').set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body[0].status).toBe('pending');
    });
});

describe('PUT /api/admin/reviews/:id/status', () => {
    test('admin can approve a review', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, status: 'approved' }]
        });

        const res = await request(app)
            .put('/api/admin/reviews/1/status')
            .set(authHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('approved');
    });

    test('returns 400 on invalid status value', async () => {
        const res = await request(app)
            .put('/api/admin/reviews/1/status')
            .set(authHeader)
            .send({ status: 'invalid_status' });

        expect(res.status).toBe(400);
    });

    test('returns 404 if review does not exist', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/admin/reviews/9999/status')
            .set(authHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(404);
    });
});

describe('Sales Manager — Returns', () => {
    // Returns routes require the sales_manager role
    beforeAll(async () => {
        await request(app).post('/api/admin/login').send({
            username: 'sales_manager',
            password: 'sales123'
        });
    });

    test('lists all return requests', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, product_name: 'T-Shirt', user_name: 'Alice', status: 'pending' }]
        });

        const res = await request(app).get('/api/admin/returns').set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('status', 'pending');
    });

    test('approving a return restocks the product', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })                                                   // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1, product_id: 8, quantity: 2, status: 'pending' }] }) // SELECT ... FOR UPDATE
            .mockResolvedValueOnce({ rows: [] })                                                   // UPDATE products (restock)
            .mockResolvedValueOnce({ rows: [{ id: 1, status: 'approved' }] })                      // UPDATE return_requests
            .mockResolvedValueOnce({ rows: [] });                                                  // COMMIT

        const res = await request(app)
            .put('/api/admin/returns/1')
            .set(authHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(res.body.request).toHaveProperty('status', 'approved');
    });

    test('returns 400 on invalid return status', async () => {
        const res = await request(app)
            .put('/api/admin/returns/1')
            .set(authHeader)
            .send({ status: 'maybe' });

        expect(res.status).toBe(400);
    });
});
