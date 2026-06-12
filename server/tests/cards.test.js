const request = require('supertest');
const express = require('express');
const mockDb = require('./mockDb');

process.env.CARD_ENCRYPTION_KEY =
  process.env.CARD_ENCRYPTION_KEY || 'a'.repeat(64);

jest.mock('../middleware/customerAuth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: Number(req.params.userId || req.body.userId || 1), role: 'customer' };
    next();
  },
  signCustomerToken: () => 'test-token'
}));

const cardsRoutes = require('../routes/cards');
const { encrypt, decrypt, luhnCheck, detectBrand } = require('../utils/cardCrypto');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.db = mockDb; next(); });
app.use('/api/cards', cardsRoutes);

// A Luhn-valid test card number
const VALID_CARD = '4242424242424242';

describe('cardCrypto utility', () => {
  test('encrypt → decrypt round-trips correctly', () => {
    const enc = encrypt(VALID_CARD);
    expect(enc).not.toContain(VALID_CARD);
    expect(decrypt(enc)).toBe(VALID_CARD);
  });

  test('decrypt detects tampering (GCM auth tag)', () => {
    const enc = encrypt(VALID_CARD);
    const tampered = enc.slice(0, -2) + (enc.endsWith('00') ? 'ff' : '00');
    expect(() => decrypt(tampered)).toThrow();
  });

  test('luhnCheck accepts a valid number and rejects an invalid one', () => {
    expect(luhnCheck(VALID_CARD)).toBe(true);
    expect(luhnCheck('1234567812345678')).toBe(false);
  });

  test('detectBrand identifies the card network', () => {
    expect(detectBrand('4111111111111111')).toBe('Visa');
    expect(detectBrand('5500000000000004')).toBe('Mastercard');
    expect(detectBrand('340000000000009')).toBe('Amex');
  });
});

describe('POST /api/cards', () => {
  test('saves a valid card and returns a masked response', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })                       // BEGIN
      .mockResolvedValueOnce({ rows: [{ n: 0 }] })               // COUNT existing
      .mockResolvedValueOnce({ rows: [{
        id: 1, cardholder_name: 'Test User', card_last4: '4242',
        card_brand: 'Visa', expiry_month: 11, expiry_year: 2030, is_default: true
      }] })                                                       // INSERT
      .mockResolvedValueOnce({ rows: [] });                       // COMMIT

    const res = await request(app).post('/api/cards').send({
      userId: 1, cardholder_name: 'Test User', card_number: VALID_CARD,
      expiry_month: 11, expiry_year: 2030
    });

    expect(res.status).toBe(201);
    expect(res.body.card).toHaveProperty('card_last4', '4242');
    expect(res.body.card.masked_number).toMatch(/4242$/);
    // The full PAN must never appear in the response
    expect(JSON.stringify(res.body)).not.toContain(VALID_CARD);
  });

  test('rejects a card that fails the Luhn check', async () => {
    const res = await request(app).post('/api/cards').send({
      userId: 1, cardholder_name: 'Test User', card_number: '1234567812345678',
      expiry_month: 11, expiry_year: 2030
    });
    expect(res.status).toBe(400);
  });

  test('rejects an expired card', async () => {
    const res = await request(app).post('/api/cards').send({
      userId: 1, cardholder_name: 'Test User', card_number: VALID_CARD,
      expiry_month: 1, expiry_year: 2020
    });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid expiry month', async () => {
    const res = await request(app).post('/api/cards').send({
      userId: 1, cardholder_name: 'Test User', card_number: VALID_CARD,
      expiry_month: 13, expiry_year: 2030
    });
    expect(res.status).toBe(400);
  });

  test('rejects a missing cardholder name', async () => {
    const res = await request(app).post('/api/cards').send({
      userId: 1, card_number: VALID_CARD, expiry_month: 11, expiry_year: 2030
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cards/:userId', () => {
  test('lists cards without exposing the full card number', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        id: 1, cardholder_name: 'Test User', card_last4: '4242',
        card_brand: 'Visa', expiry_month: 11, expiry_year: 2030,
        is_default: true, created_at: new Date().toISOString()
      }]
    });
    const res = await request(app).get('/api/cards/1');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('masked_number');
    expect(res.body[0]).not.toHaveProperty('card_number_encrypted');
  });
});

describe('DELETE /api/cards/:id', () => {
  test('returns 404 when the card does not belong to the user', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })   // BEGIN
      .mockResolvedValueOnce({ rows: [] })   // DELETE → no row
      .mockResolvedValueOnce({ rows: [] });  // ROLLBACK
    const res = await request(app).delete('/api/cards/999').send({ userId: 1 });
    expect(res.status).toBe(404);
  });

  test('deletes a card and promotes a new default when needed', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })                   // BEGIN
      .mockResolvedValueOnce({ rows: [{ is_default: true }] }) // DELETE → was default
      .mockResolvedValueOnce({ rows: [] })                   // UPDATE promote newest
      .mockResolvedValueOnce({ rows: [] });                  // COMMIT
    const res = await request(app).delete('/api/cards/1').send({ userId: 1 });
    expect(res.status).toBe(200);
  });
});
