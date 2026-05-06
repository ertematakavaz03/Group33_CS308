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

describe('POST /api/admin/login', () => {
    test('returns token on valid admin credentials', async () => {
        const res = await request(app).post('/api/admin/login').send({
            username: 'admin',
            password: 'admin123'
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('returns 401 on invalid admin credentials', async () => {
        const res = await request(app).post('/api/admin/login').send({
            username: 'admin',
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
