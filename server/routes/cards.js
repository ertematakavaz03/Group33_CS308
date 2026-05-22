const express = require('express');
const router = express.Router();
const { encrypt, luhnCheck, detectBrand } = require('../utils/cardCrypto');

// Shape a DB row into a safe, masked API response (never exposes the full PAN).
const toSafeCard = (row) => ({
  id: row.id,
  cardholder_name: row.cardholder_name,
  card_last4: row.card_last4,
  card_brand: row.card_brand,
  expiry_month: row.expiry_month,
  expiry_year: row.expiry_year,
  is_default: row.is_default,
  masked_number: `•••• •••• •••• ${row.card_last4}`,
  created_at: row.created_at
});

// List a user's saved cards (masked — no full card number ever leaves the server)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  try {
    const { rows } = await req.db.query(
      `SELECT id, cardholder_name, card_last4, card_brand,
              expiry_month, expiry_year, is_default, created_at
       FROM payment_cards
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    res.json(rows.map(toSafeCard));
  } catch (err) {
    console.error('Error fetching cards:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save a new card. The CVV is intentionally NOT accepted or stored.
router.post('/', async (req, res) => {
  const { userId, cardholder_name, card_number, expiry_month, expiry_year } = req.body;
  const isDefault = req.body.is_default === true;

  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'A valid userId is required' });
  }
  if (!cardholder_name || !String(cardholder_name).trim()) {
    return res.status(400).json({ error: 'Cardholder name is required' });
  }

  const digits = String(card_number || '').replace(/\D/g, '');
  if (!luhnCheck(digits)) {
    return res.status(400).json({ error: 'Invalid card number' });
  }

  const month = Number(expiry_month);
  const year = Number(expiry_year);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Expiry month must be between 1 and 12' });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Invalid expiry year' });
  }

  // Reject already-expired cards (compare against the end of the expiry month)
  const now = new Date();
  const expiryEnd = new Date(year, month, 1); // first day of the month AFTER expiry
  if (expiryEnd <= now) {
    return res.status(400).json({ error: 'Card has expired' });
  }

  try {
    const encrypted = encrypt(digits);
    const last4 = digits.slice(-4);
    const brand = detectBrand(digits);

    await req.db.query('BEGIN');

    if (isDefault) {
      await req.db.query('UPDATE payment_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    // The first card a user adds becomes their default automatically.
    const countResult = await req.db.query(
      'SELECT COUNT(*)::int AS n FROM payment_cards WHERE user_id = $1',
      [userId]
    );
    const makeDefault = isDefault || countResult.rows[0].n === 0;

    const inserted = await req.db.query(
      `INSERT INTO payment_cards
        (user_id, cardholder_name, card_number_encrypted, card_last4, card_brand,
         expiry_month, expiry_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, cardholder_name, card_last4, card_brand,
                 expiry_month, expiry_year, is_default, created_at`,
      [userId, String(cardholder_name).trim(), encrypted, last4, brand, month, year, makeDefault]
    );

    await req.db.query('COMMIT');
    res.status(201).json({ message: 'Card saved', card: toSafeCard(inserted.rows[0]) });
  } catch (err) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    if (err.code === '23503') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Error saving card:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set a card as the user's default
router.put('/:id/default', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'A valid userId is required' });
  }
  try {
    const owned = await req.db.query(
      'SELECT id FROM payment_cards WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    await req.db.query('BEGIN');
    await req.db.query('UPDATE payment_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
    await req.db.query('UPDATE payment_cards SET is_default = TRUE WHERE id = $1', [id]);
    await req.db.query('COMMIT');
    res.json({ message: 'Default card updated' });
  } catch (err) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error('Error updating default card:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a saved card (ownership enforced via userId).
// If the deleted card was the default, the most recent remaining card is promoted.
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({ error: 'A valid userId is required' });
  }
  try {
    await req.db.query('BEGIN');

    const result = await req.db.query(
      'DELETE FROM payment_cards WHERE id = $1 AND user_id = $2 RETURNING is_default',
      [id, userId]
    );
    if (result.rows.length === 0) {
      await req.db.query('ROLLBACK');
      return res.status(404).json({ error: 'Card not found' });
    }

    // Keep exactly one default: promote the newest remaining card if needed.
    if (result.rows[0].is_default) {
      await req.db.query(
        `UPDATE payment_cards SET is_default = TRUE
         WHERE id = (
           SELECT id FROM payment_cards
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 1
         )`,
        [userId]
      );
    }

    await req.db.query('COMMIT');
    res.json({ message: 'Card deleted' });
  } catch (err) {
    try { await req.db.query('ROLLBACK'); } catch (_) {}
    console.error('Error deleting card:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
