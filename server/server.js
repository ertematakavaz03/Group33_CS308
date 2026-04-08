const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// getting info from env
// || means if .env doesnt work it will use left side values
// we can remove it later add them for checking if everything runs fine
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

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

app.get('/', (req, res) => {
    res.send('Server is running: CS 308 Marketplace API');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
