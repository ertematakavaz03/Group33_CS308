const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('../utils/rateLimiter');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 255;
const MAX_EMAIL_LENGTH = 255;
const MAX_HOME_ADDRESS_LENGTH = 500;

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.startsWith('0') ? digits.slice(1) : digits;
}

// Brute-force protection on the credential endpoints.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please try again later.' });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 15, message: 'Too many sign-up attempts. Please try again later.' });


// get user profile by id
router.get('/user/:id', async (req, res) => {
    try {
        const result = await req.db.query(
            'SELECT id, name, email, phone, tax_id, home_address, role FROM users WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
    const { name, email, phone, password, tax_id, home_address } = req.body;

    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > MAX_NAME_LENGTH) {
        return res.status(400).json({ error: 'Name must be between 2 and 255 characters' });
    }
    const cleanEmail = String(email || '').trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > MAX_EMAIL_LENGTH) {
        return res.status(400).json({ error: 'A valid email address is required' });
    }
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length !== 10) {
        return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    const pwdStr = String(password || '');
    if (pwdStr.length < MIN_PASSWORD_LENGTH || pwdStr.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` });
    }
    const cleanTaxId = tax_id ? String(tax_id).replace(/\D/g, '') : null;
    if (cleanTaxId && (cleanTaxId.length < 10 || cleanTaxId.length > 11)) {
        return res.status(400).json({ error: 'Tax ID must be 10 or 11 digits' });
    }
    const cleanHomeAddress = home_address ? String(home_address).trim() : null;
    if (cleanHomeAddress && cleanHomeAddress.length > MAX_HOME_ADDRESS_LENGTH) {
        return res.status(400).json({ error: 'Home address must be under 500 characters' });
    }

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
            'INSERT INTO users (name, email, phone, tax_id, home_address, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, phone, tax_id, home_address, role',
            [cleanName, cleanEmail, phoneDigits, cleanTaxId, cleanHomeAddress, hashedPassword, 'customer']
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
    const { name, email, phone, password, tax_id, home_address } = req.body;

    try {
        const existing = await req.db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const duplicate = await req.db.query(
            'SELECT id FROM users WHERE (email = $1 OR phone = $2) AND id != $3',
            [email !== undefined ? String(email).trim() : existing.rows[0].email,
             phone !== undefined ? normalizePhone(phone) : existing.rows[0].phone,
             id]
        );
        if (duplicate.rows.length > 0) return res.status(400).json({ error: 'Email or phone already in use by another account' });

        const updName = name !== undefined ? String(name).trim() : existing.rows[0].name;
        if (updName.length < 2 || updName.length > MAX_NAME_LENGTH) {
            return res.status(400).json({ error: 'Name must be between 2 and 255 characters' });
        }
        const updEmail = email !== undefined ? String(email).trim() : existing.rows[0].email;
        if (!EMAIL_REGEX.test(updEmail) || updEmail.length > MAX_EMAIL_LENGTH) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }
        const updPhone = phone !== undefined ? normalizePhone(phone) : existing.rows[0].phone;
        if (updPhone.length !== 10) {
            return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
        }
        const updTaxId = tax_id !== undefined ? (tax_id ? String(tax_id).replace(/\D/g, '') : null) : existing.rows[0].tax_id;
        if (updTaxId && (updTaxId.length < 10 || updTaxId.length > 11)) {
            return res.status(400).json({ error: 'Tax ID must be 10 or 11 digits' });
        }
        const updAddress = home_address !== undefined ? String(home_address).trim() : existing.rows[0].home_address;
        if (updAddress && updAddress.length > MAX_HOME_ADDRESS_LENGTH) {
            return res.status(400).json({ error: 'Home address must be under 500 characters' });
        }

        let hashedPassword = existing.rows[0].password;
        if (password && String(password).trim().length > 0) {
            const pwdStr = String(password);
            if (pwdStr.length < MIN_PASSWORD_LENGTH || pwdStr.length > MAX_PASSWORD_LENGTH) {
                return res.status(400).json({ error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` });
            }
            hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await req.db.query(
            `UPDATE users SET name=$1, email=$2, phone=$3, tax_id=$4, home_address=$5, password=$6 WHERE id=$7
             RETURNING id, name, email, phone, tax_id, home_address, role`,
            [updName, updEmail, updPhone, updTaxId, updAddress, hashedPassword, id]
        );

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
