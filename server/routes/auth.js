const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('../utils/rateLimiter');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Brute-force protection on the credential endpoints.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please try again later.' });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 15, message: 'Too many sign-up attempts. Please try again later.' });


// verify if user still exists
router.get('/verify/:id', async (req, res) => {
    try {
        const result = await req.db.query(
            'SELECT id FROM users WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ valid: true });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// sign in user things
router.post('/register', registerLimiter, async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Validate every field before touching the database — missing fields
    // previously caused an unhandled crash (500).
    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ error: 'A valid email address is required' });
    }
    const phoneDigits = String(phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        return res.status(400).json({ error: 'A valid phone number is required' });
    }
    if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();

    try {
        const duplicate = await req.db.query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [cleanEmail, phoneDigits]
        );

        if (duplicate.rows.length > 0) {
            return res.status(400).json({ error: 'Account already exists with this email or phone number' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await req.db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [cleanName, cleanEmail, phoneDigits, hashedPassword, 'customer']
        );

        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// user to login
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await req.db.query(
            'SELECT * FROM users WHERE email = $1',
            [String(email).trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Account not found' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const { password: _, ...safeUser } = user;
        res.status(200).json({ message: 'Login successful', user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// update user profile
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    try {
        const existing = await req.db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const duplicate = await req.db.query(
            'SELECT id FROM users WHERE (email = $1 OR phone = $2) AND id != $3',
            [email, phone ? phone.replace(/\D/g, '') : '', id]
        );
        if (duplicate.rows.length > 0) return res.status(400).json({ error: 'Email or phone already in use by another account' });

        let hashedPassword = existing.rows[0].password;
        if (password && password.trim().length > 0) {
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await req.db.query(
            `UPDATE users SET name=$1, email=$2, phone=$3, password=$4 WHERE id=$5
             RETURNING id, name, email, phone, role`,
            [name, email, phone ? phone.replace(/\D/g, '') : existing.rows[0].phone, hashedPassword, id]
        );

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;