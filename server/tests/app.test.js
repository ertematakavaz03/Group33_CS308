const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
    test('returns a simple API health response', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: 'ok',
            service: 'CS 308 Marketplace API'
        });
    });
});
