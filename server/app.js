const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// DB middleware - gerçek ya da mock db inject edilir
app.use((req, res, next) => {
    if (!req.db) req.db = require('./db');
    next();
});

const authRoutes    = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const addressRoutes = require('./routes/addresses');
const adminRoutes   = require('./routes/admin');

app.use('/api/auth',      authRoutes);
app.use('/api/products',  productsRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/', (req, res) => {
    res.send('Server is running: CS 308 Marketplace API');
});

module.exports = app;
