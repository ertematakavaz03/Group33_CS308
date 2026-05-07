const request = require('supertest');
const express = require('express');
const ordersRoutes = require('../routes/orders');
const mockDb = require('./mockDb');

jest.mock('../utils/sendOrderEmail', () => jest.fn().mockResolvedValue(true));

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/orders', ordersRoutes);

describe('POST /api/orders/checkout', () => {
    test('successfully creates an order and returns orderId', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })              // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // stock update (sufficient)
            .mockResolvedValueOnce({ rows: [{ id: 42 }] })   // orders INSERT → orderId = 42
            .mockResolvedValueOnce({ rows: [] })              // order_items INSERT
            .mockResolvedValueOnce({ rows: [] })              // COMMIT
            .mockResolvedValueOnce({ rows: [{ id: 1, full_address: '123 St', city: 'Istanbul' }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, full_address: '123 St', city: 'Istanbul' }] });

        const res = await request(app).post('/api/orders/checkout').send({
            userId: 1,
            userEmail: 'test@test.com',
            items: [{ id: 1, quantity: 2, price: 100 }],
            totalAmount: 200,
            shippingAddressId: 1,
            billingAddressId: 1
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('orderId', 42);
    });

    test('returns 400 when stock is insufficient', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })   // BEGIN
            .mockResolvedValueOnce({ rows: [] })   // stock update → empty = not enough stock
            .mockResolvedValueOnce({ rows: [] });  // ROLLBACK

        const res = await request(app).post('/api/orders/checkout').send({
            userId: 1,
            userEmail: 'test@test.com',
            items: [{ id: 1, quantity: 9999, price: 100 }],
            totalAmount: 999900,
            shippingAddressId: 1,
            billingAddressId: 1
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/stock/i);
    });

    test('returns 400 before transaction when checkout cart is empty', async () => {
        const res = await request(app).post('/api/orders/checkout').send({
            userId: 1,
            userEmail: 'test@test.com',
            items: [],
            totalAmount: 0,
            shippingAddressId: 1,
            billingAddressId: 1
        });

        expect(res.status).toBe(400);
        expect(mockDb.query).not.toHaveBeenCalled();
    });

    test('returns 400 before transaction when an item quantity is invalid', async () => {
        const res = await request(app).post('/api/orders/checkout').send({
            userId: 1,
            userEmail: 'test@test.com',
            items: [{ id: 1, quantity: 0, price: 100 }],
            totalAmount: 100,
            shippingAddressId: 1,
            billingAddressId: 1
        });

        expect(res.status).toBe(400);
        expect(mockDb.query).not.toHaveBeenCalled();
    });

    test('successfully checks out multiple items', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })              // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // stock item 1
            .mockResolvedValueOnce({ rows: [{ id: 2 }] })    // stock item 2
            .mockResolvedValueOnce({ rows: [{ id: 99 }] })   // orders INSERT
            .mockResolvedValueOnce({ rows: [] })              // order_items INSERT item 1
            .mockResolvedValueOnce({ rows: [] })              // order_items INSERT item 2
            .mockResolvedValueOnce({ rows: [] })              // COMMIT
            .mockResolvedValueOnce({ rows: [{ id: 1, full_address: '123 St', city: 'Istanbul' }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, full_address: '123 St', city: 'Istanbul' }] });

        const res = await request(app).post('/api/orders/checkout').send({
            userId: 1,
            userEmail: 'test@test.com',
            items: [
                { id: 1, quantity: 1, price: 50 },
                { id: 2, quantity: 2, price: 75 }
            ],
            totalAmount: 200,
            shippingAddressId: 1,
            billingAddressId: 1
        });

        expect(res.status).toBe(200);
        expect(res.body.orderId).toBe(99);
    });
});

describe('GET /api/orders/my-orders/:userId', () => {
    test('returns orders with items for a user', async () => {
        mockDb.query
            .mockResolvedValueOnce({
                rows: [{ id: 1, total_amount: 200, status: 'pending', created_at: new Date() }]
            })
            .mockResolvedValueOnce({
                rows: [{ quantity: 2, price_at_purchase: 100, name: 'Laptop', image_url: null }]
            });

        const res = await request(app).get('/api/orders/my-orders/1');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].items).toBeDefined();
        expect(res.body[0].items[0].name).toBe('Laptop');
    });

    test('returns empty array if user has no orders', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/orders/my-orders/999');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});
