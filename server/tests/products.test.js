const request = require('supertest');
const express = require('express');
const productsRoutes = require('../routes/products');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/products', productsRoutes);

const fakeProduct = {
    id: 1, name: 'Test Laptop', model: 'X200', serial_no: 'SN001',
    description: 'A laptop', stock: 10, price: 999.99,
    warranty: '2 years', distributor: 'TechCorp', category: 'Electronics'
};

describe('GET /api/products', () => {
    test('returns list of all products', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [fakeProduct] });

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].name).toBe('Test Laptop');
    });

    test('aggregates product ratings using only approved reviews', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ ...fakeProduct, average_rating: '4.5', review_count: 2 }]
        });

        const res = await request(app).get('/api/products');
        const sql = mockDb.query.mock.calls[0][0];

        expect(res.status).toBe(200);
        expect(res.body[0]).toMatchObject({ average_rating: '4.5', review_count: 2 });
        expect(sql).toMatch(/AVG\(r\.rating\)/);
        expect(sql).toMatch(/COUNT\(r\.rating\)::int AS review_count/);
        expect(sql).toMatch(/r\.product_id = p\.id AND r\.status = 'approved'/);
    });

    test('returns 500 on database error', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(500);
    });
});

describe('GET /api/products/:id', () => {
    test('returns a single product by id', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [fakeProduct] });

        const res = await request(app).get('/api/products/1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
    });

    test('returns 404 if product does not exist', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/products/9999');

        expect(res.status).toBe(404);
    });
});

describe('POST /api/products/checkout', () => {
    test('rejects the deprecated stock-only checkout path', async () => {
        const res = await request(app).post('/api/products/checkout').send({
            items: [{ id: 1, quantity: 1 }]
        });

        expect(res.status).toBe(410);
        expect(mockDb.query).not.toHaveBeenCalled();
    });
});

describe('GET /api/products/:id/reviews', () => {
    test('returns only approved reviews for a product', async () => {
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, rating: 5, comment: 'Great!', user_name: 'Alice' }]
        });

        const res = await request(app).get('/api/products/1/reviews');

        expect(res.status).toBe(200);
        expect(res.body[0].rating).toBe(5);
        expect(mockDb.query.mock.calls[0][0]).toMatch(/r\.status = 'approved'/);
    });
});

describe('POST /api/products/:id/reviews', () => {
    test('successfully submits a review with pending status', async () => {
        // First call: purchase verification check
        mockDb.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
        // Second call: insert review
        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, product_id: 1, user_id: 2, rating: 4, comment: 'Good', status: 'pending' }]
        });

        const res = await request(app).post('/api/products/1/reviews').send({
            user_id: 2,
            rating: 4,
            comment: 'Good product'
        });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('pending');
    });

    test('returns 403 if user has not purchased the product', async () => {
        // Purchase check returns empty (not purchased)
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).post('/api/products/1/reviews').send({
            user_id: 2,
            rating: 4,
            comment: 'I have not bought this'
        });

        expect(res.status).toBe(403);
    });

    test('returns 400 if rating is missing', async () => {
        const res = await request(app).post('/api/products/1/reviews').send({
            user_id: 2,
            comment: 'No rating provided'
        });

        expect(res.status).toBe(400);
    });

    test('returns 400 if rating is out of range (1-5)', async () => {
        const res = await request(app).post('/api/products/1/reviews').send({
            user_id: 2,
            rating: 6
        });

        expect(res.status).toBe(400);
    });
});
