const request = require('supertest');
const express = require('express');
const addressesRoutes = require('../routes/addresses');
const mockDb = require('./mockDb');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/addresses', addressesRoutes);

describe('POST /api/addresses', () => {
  test('makes the first address the default address', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })             // BEGIN
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // COUNT
      .mockResolvedValueOnce({ rows: [] })             // clear existing defaults
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Home', is_default: true }] }) // INSERT
      .mockResolvedValueOnce({ rows: [] });            // COMMIT

    const res = await request(app).post('/api/addresses').send({
      user_id: 7,
      title: 'Home',
      full_address: 'Main Street 1'
    });

    expect(res.status).toBe(201);
    expect(res.body.is_default).toBe(true);
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/addresses').send({
      user_id: 7,
      title: 'Home'
    });

    expect(res.status).toBe(400);
    expect(mockDb.query).not.toHaveBeenCalled();
  });
});

describe('PUT /api/addresses/:id/default', () => {
  test('sets one owned address as the default', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // ownership check
      .mockResolvedValueOnce({ rows: [] })          // BEGIN
      .mockResolvedValueOnce({ rows: [] })          // clear defaults
      .mockResolvedValueOnce({ rows: [{ id: 2, is_default: true }] }) // update chosen
      .mockResolvedValueOnce({ rows: [] });         // COMMIT

    const res = await request(app).put('/api/addresses/2/default').send({ userId: 7 });

    expect(res.status).toBe(200);
    expect(res.body.is_default).toBe(true);
  });

  test('returns 404 when the address does not belong to the user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/api/addresses/2/default').send({ userId: 7 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/addresses/:id', () => {
  test('promotes another address when the default is deleted', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ user_id: 7, is_default: true }] }) // DELETE
      .mockResolvedValueOnce({ rows: [] }) // promote newest remaining
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const res = await request(app).delete('/api/addresses/2');

    expect(res.status).toBe(200);
  });
});
