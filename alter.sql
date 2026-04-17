ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0;

UPDATE products SET sales_count = 150 WHERE name ILIKE '%Wireless Noise-Canceling%';
UPDATE products SET sales_count = 120 WHERE name ILIKE '%Men''s Running Shoes%';
UPDATE products SET sales_count = 80 WHERE name ILIKE '%Bestselling Fiction Novel%';
UPDATE products SET sales_count = 50 WHERE name ILIKE '%Smart LED Light Bulb%';

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    full_address TEXT NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
