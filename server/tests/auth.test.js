const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/auth', authRoutes);

describe('POST /api/auth/register', () => {
    test('successfully registers a new user', async () => {
        mockDb.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test User', email: 'test@test.com', role: 'customer' }] });

        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password123',
            phone: '5551234567'
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe('test@test.com');
    });

    test('returns 400 if email is already registered', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password123',
            phone: '5551234567'
        });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 500 if phone is missing', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password123'
        });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/auth/login', () => {
    test('returns user on successful login', async () => {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password123', 10);

        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, name: 'Test', email: 'test@test.com', password: hashedPassword, role: 'customer' }]
        });

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@test.com',
            password: 'password123'
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).not.toHaveProperty('password');
    });

    test('returns 401 on wrong password', async () => {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('correctPassword', 10);

        mockDb.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@test.com', password: hashedPassword, role: 'customer' }]
        });

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@test.com',
            password: 'wrongPassword'
        });

        expect(res.status).toBe(401);
    });

    test('returns 401 if email is not found', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).post('/api/auth/login').send({
            email: 'notfound@test.com',
            password: 'password123'
        });

        expect(res.status).toBe(401);
    });
});
