const request = require('supertest');
const express = require('express');
const adminRoutes = require('../routes/admin');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/admin', adminRoutes);

// Each login now issues its own unique token, so the tests capture the
// token from the login response rather than relying on a shared constant.
let pmHeader;   // product_manager session
let smHeader;   // sales_manager session

beforeAll(async () => {
    const pm = await request(app).post('/api/admin/login').send({
        username: 'product_manager',
        password: 'product123'
    });
    pmHeader = { Authorization: `Bearer ${pm.body.token}` };

    const sm = await request(app).post('/api/admin/login').send({
        username: 'sales_manager',
        password: 'sales123'
    });
    smHeader = { Authorization: `Bearer ${sm.body.token}` };
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

    test('issues a distinct token per login (no session collision)', async () => {
        const a = await request(app).post('/api/admin/login').send({
            username: 'product_manager', password: 'product123'
        });
        const b = await request(app).post('/api/admin/login').send({
            username: 'sales_manager', password: 'sales123'
        });
        expect(a.body.token).not.toBe(b.body.token);
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

        const res = await request(app).get('/api/admin/reviews').set(pmHeader);

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
            .set(pmHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('approved');
    });

    test('returns 400 on invalid status value', async () => {
        const res = await request(app)
            .put('/api/admin/reviews/1/status')
            .set(pmHeader)
            .send({ status: 'invalid_status' });

        expect(res.status).toBe(400);
    });

    test('returns 404 if review does not exist', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/admin/reviews/9999/status')
            .set(pmHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(404);
    });
});

describe('Sales Manager — Returns', () => {
    test('lists all return requests', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, product_name: 'T-Shirt', user_name: 'Alice', status: 'pending' }]
        });

        const res = await request(app).get('/api/admin/returns').set(smHeader);

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
            .set(smHeader)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(res.body.request).toHaveProperty('status', 'approved');
    });

    test('returns 400 on invalid return status', async () => {
        const res = await request(app)
            .put('/api/admin/returns/1')
            .set(smHeader)
            .send({ status: 'maybe' });

        expect(res.status).toBe(400);
    });

    test('rejects a product_manager from the returns endpoint (role check)', async () => {
        const res = await request(app).get('/api/admin/returns').set(pmHeader);
        expect(res.status).toBe(403);
    });
});
