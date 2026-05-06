const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// for admin to see all user
router.get('/users', async (req, res) => {
    try {
        const result = await req.db.query(
            'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
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
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, phone, password, dob } = req.body;

    try {
        const digitsOnly = phone.replace(/\D/g, '');
        const duplicate = await req.db.query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [email, digitsOnly]
        );

        if (duplicate.rows.length > 0) {
            return res.status(400).json({ error: 'Account already exists with this email or phone number' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const fullName = `${first_name} ${last_name}`;
        const result = await req.db.query(
            'INSERT INTO users (name, first_name, last_name, email, phone, password, dob, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, first_name, last_name, email, role, dob, phone',
            [fullName, first_name, last_name, email, digitsOnly, hashedPassword, dob, 'customer']
        );

        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// user to login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await req.db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
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

// Update user profile
router.put('/profile/:id', async (req, res) => {
    const { first_name, last_name, email, phone, date_of_birth } = req.body;
    const userId = req.params.id;

    try {
        const result = await req.db.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, name = $6
             WHERE id = $7 
             RETURNING id, name, first_name, last_name, email, phone, dob, role`,
            [first_name, last_name, email, phone, date_of_birth, `${first_name} ${last_name}`, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;