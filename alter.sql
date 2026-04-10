ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0;

UPDATE products SET sales_count = 150 WHERE name ILIKE '%Wireless Noise-Canceling%';
UPDATE products SET sales_count = 120 WHERE name ILIKE '%Men''s Running Shoes%';
UPDATE products SET sales_count = 80 WHERE name ILIKE '%Bestselling Fiction Novel%';
UPDATE products SET sales_count = 50 WHERE name ILIKE '%Smart LED Light Bulb%';
