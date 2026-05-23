const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'marketplace',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

app.use((req, res, next) => {
    req.db = pool;
    next();
});

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Redirect root to frontend admin page
app.get('/', (req, res) => {
    res.redirect('http://localhost:5174/admin');
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Admin Server started on port ${PORT}`);
});
