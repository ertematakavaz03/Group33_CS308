BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keep the reset account realistic on-screen. Older local resets used the
-- final.demo.customer@example.com address; migrate it once if it exists.
UPDATE users
SET name = 'Ertem Kavaz',
    email = 'ertematakavaz@gmail.com',
    phone = '5553080001',
    tax_id = '30820260001',
    home_address = 'Moda Caddesi No:42 D:8, Kadikoy/Istanbul',
    password = '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG',
    role = 'customer'
WHERE email = 'final.demo.customer@example.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'ertematakavaz@gmail.com');

INSERT INTO users (name, email, phone, tax_id, home_address, password, role)
VALUES (
  'Ertem Kavaz',
  'ertematakavaz@gmail.com',
  '5553080001',
  '30820260001',
  'Moda Caddesi No:42 D:8, Kadikoy/Istanbul',
  '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG',
  'customer'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  tax_id = EXCLUDED.tax_id,
  home_address = EXCLUDED.home_address,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT u.id, 'Home', 'Moda Caddesi No:42 D:8', 'Istanbul', 'Kadikoy', '34710', TRUE
FROM users u
WHERE u.email = 'ertematakavaz@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM addresses a
    WHERE a.user_id = u.id
      AND a.title = 'Home'
  );

UPDATE addresses
SET full_address = 'Moda Caddesi No:42 D:8',
    city = 'Istanbul',
    district = 'Kadikoy',
    postal_code = '34710',
    is_default = TRUE
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com')
  AND title = 'Home';

-- Reset only the dedicated customer account. This makes the script safe to run
-- before every rehearsal without damaging real catalog data.
DELETE FROM payment_cards
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM return_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM reviews
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM wishlist_items
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM cart_items
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

DELETE FROM orders
WHERE user_id = (SELECT id FROM users WHERE email = 'ertematakavaz@gmail.com');

-- Remove older artificial demo-only catalog rows so the product grid looks like
-- a normal marketplace instead of a seeded test fixture.
DELETE FROM reviews
WHERE product_id IN (SELECT id FROM products WHERE serial_no LIKE 'SN-FINAL-%');
DELETE FROM wishlist_items
WHERE product_id IN (SELECT id FROM products WHERE serial_no LIKE 'SN-FINAL-%');
DELETE FROM cart_items
WHERE product_id IN (SELECT id FROM products WHERE serial_no LIKE 'SN-FINAL-%');
DELETE FROM products
WHERE serial_no LIKE 'SN-FINAL-%'
   OR serial_no = 'SN-PM-D-001'
   OR name ILIKE 'NovaBrew Travel Coffee Maker%';

-- Final demo product roles are mapped to normal catalog products:
-- A Soccer Ball: out of stock
-- B SoundStage Studio Headphones: exactly one in stock
-- C Mechanical RGB Keyboard: multiple units in stock, customer adds to wishlist
-- E Robot Vacuum Cleaner: delivered more than 30 days ago
-- F Desk Lamp: delivered within 30 days, returnable/refundable
-- G E-Reader: processing, cancellable
-- H Tennis Racket: in-transit, not cancellable
UPDATE products SET
  name = 'Soccer Ball',
  model = 'StrikeMaster 5',
  description = 'Official size 5 match ball with a durable textured cover, reinforced bladder, and consistent flight for training sessions and weekend matches.',
  stock = 0,
  price = 19.99,
  warranty = 'No Warranty',
  distributor = 'SportPro',
  status = 'active',
  category = 'Sports & Outdoors',
  image_url = 'https://live.staticflickr.com/3317/4625644446_1f16d51af8_b.jpg',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-SO-054';

UPDATE products SET
  name = 'SoundStage Studio Headphones',
  model = 'SS-700',
  description = 'Closed-back over-ear headphones with balanced 40 mm drivers, a detachable cable, and plush replaceable memory-foam ear pads for long listening sessions.',
  stock = 1,
  price = 149.99,
  warranty = '2 Years',
  distributor = 'TechAudio Inc',
  status = 'active',
  category = 'Electronics',
  image_url = 'https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=500&q=80',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-EL-059';

UPDATE products SET
  name = 'Mechanical RGB Keyboard',
  model = 'MK-RGB87',
  description = 'Tenkeyless mechanical keyboard with hot-swappable tactile switches, per-key RGB lighting, a rigid aluminum top plate, and a detachable USB-C cable.',
  stock = 15,
  price = 79.99,
  warranty = '2 Years',
  distributor = 'GameTech',
  status = 'active',
  category = 'Electronics',
  image_url = 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-EL-060';

UPDATE products SET
  name = 'Robot Vacuum Cleaner',
  model = 'CleanBot S6',
  description = 'Laser-navigation robot vacuum with 2700 Pa suction, room mapping, automatic recharge-and-resume, and app controls for scheduled cleaning.',
  stock = 5,
  price = 249.99,
  warranty = '2 Years',
  distributor = 'HomeAppliances Co',
  status = 'active',
  category = 'Home & Kitchen',
  image_url = 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-HK-042';

UPDATE products SET
  name = 'Desk Lamp',
  model = 'BrightLite LED',
  description = 'Adjustable LED desk lamp with touch controls, three brightness levels, low-heat illumination, and a compact weighted base for study or office use.',
  stock = 14,
  price = 22.00,
  warranty = '1 Year',
  distributor = 'HomeAppliances Co',
  status = 'active',
  category = 'Home & Kitchen',
  image_url = 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-HK-015';

UPDATE products SET
  name = 'E-Reader',
  model = 'PageLight 7',
  description = 'Seven-inch e-reader with a 300 ppi glare-free display, adjustable warm light, 16 GB storage, and weeks of battery life for everyday reading.',
  stock = 11,
  price = 129.99,
  warranty = '1 Year',
  distributor = 'TechAudio Inc',
  status = 'active',
  category = 'Electronics',
  image_url = 'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=500&q=80',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-EL-033';

UPDATE products SET
  name = 'Tennis Racket',
  model = 'PowerSwing 300',
  description = 'Lightweight graphite-composite tennis racket with a forgiving mid-plus head, balanced swing weight, and comfortable grip for club players.',
  stock = 11,
  price = 65.00,
  warranty = '1 Year',
  distributor = 'SportPro',
  status = 'active',
  category = 'Sports & Outdoors',
  image_url = 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Tennis_Racket_and_Balls.jpg',
  discount_percentage = 0,
  discount_start = NULL,
  discount_end = NULL
WHERE serial_no = 'SN-SO-021';

INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id
FROM users u
JOIN products p ON p.serial_no = 'SN-EL-060'
WHERE u.email = 'ertematakavaz@gmail.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

WITH demo_user AS (
  SELECT id AS user_id FROM users WHERE email = 'ertematakavaz@gmail.com'
), demo_addr AS (
  SELECT a.id AS address_id
  FROM addresses a
  JOIN demo_user u ON u.user_id = a.user_id
  WHERE a.title = 'Home'
  LIMIT 1
), inserted_orders AS (
  INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
  SELECT user_id, 249.99, address_id, address_id, 'delivered', NOW() - INTERVAL '45 days' FROM demo_user, demo_addr
  UNION ALL
  SELECT user_id, 22.00, address_id, address_id, 'delivered', NOW() - INTERVAL '10 days' FROM demo_user, demo_addr
  UNION ALL
  SELECT user_id, 129.99, address_id, address_id, 'processing', NOW() - INTERVAL '1 day' FROM demo_user, demo_addr
  UNION ALL
  SELECT user_id, 65.00, address_id, address_id, 'in-transit', NOW() - INTERVAL '3 days' FROM demo_user, demo_addr
  RETURNING id, total_amount
)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT io.id, p.id, 1, io.total_amount
FROM inserted_orders io
JOIN products p ON p.serial_no = CASE
  WHEN io.total_amount = 249.99 THEN 'SN-HK-042'
  WHEN io.total_amount = 22.00 THEN 'SN-HK-015'
  WHEN io.total_amount = 129.99 THEN 'SN-EL-033'
  WHEN io.total_amount = 65.00 THEN 'SN-SO-021'
END;

COMMIT;
