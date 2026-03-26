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

// sign in user things
router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        
        const duplicate = await req.db.query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [email, phone.replace(/\D/g, '')]
        );

        if (duplicate.rows.length > 0) {
            return res.status(400).json({ error: 'Account already exists with this email or phone number' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await req.db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
            [name, email, phone.replace(/\D/g, ''), hashedPassword, 'customer']
        );

        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
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

module.exports = router;