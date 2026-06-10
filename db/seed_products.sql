
-- Placeholder products

INSERT INTO categories (name, description) VALUES
('Electronics', 'Consumer electronics, gadgets, and smart devices.'),
('Clothing', 'Apparel, shoes, bags, and everyday wear.'),
('Home & Kitchen', 'Home appliances, kitchen tools, and household products.'),
('Books', 'Books, notebooks, and reading materials.'),
('Sports & Outdoors', 'Fitness gear, sports equipment, and outdoor products.')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, status, category, image_url) VALUES 
('Wireless Noise-Canceling Headphones', 'QuietPro 300', 'SN-EL-001', 'High quality noise-canceling headphones with 30 hour battery life.', 12, 150.00, '1 Year', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'),
('Men''s Running Shoes', 'SpeedRunner V2', 'SN-CL-002', 'Lightweight athletic running shoes.', 5, 85.00, 'No Warranty', 'SportsFootwear Ltd', 'active', 'Clothing', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'),
('Stainless Steel Toaster', 'ToastMaster 2000', 'SN-HK-003', '2-slice toaster with multiple browning settings.', 3, 40.00, '2 Years', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Toaster.jpg/500px-Toaster.jpg'),
('Bestselling Fiction Novel', 'The Silent Echo', 'SN-BK-004', 'A thrilling mystery novel that will keep you on the edge of your seat.', 25, 18.00, 'No Warranty', 'BookWorld Publishing', 'active', 'Books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80'),
('Yoga Mat', 'ZenFlex Plus', 'SN-SO-005', 'Premium non-slip yoga mat with alignment lines.', 8, 22.00, '6 Months', 'FitnessGear', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80'),
('Smart LED Light Bulb', 'LumiSmart 4.0', 'SN-HK-006', 'RGB smart bulb compatible with voice assistants.', 20, 15.00, '1 Year', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=80'),
('4K Ultra HD Smart TV', 'VisionPro 55', 'SN-EL-007', '55-inch 4K HDR smart television with built-in streaming apps.', 4, 450.00, '2 Years', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'),
('Organic Cotton T-Shirt', 'EcoTee Basic', 'SN-CL-008', '100% organic cotton classic fit t-shirt.', 30, 25.00, 'No Warranty', 'EcoWear', 'active', 'Clothing', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'),
('Bluetooth Speaker', 'SoundBlast Mini', 'SN-EL-009', 'Portable Bluetooth speaker with deep bass and 12-hour playtime.', 15, 60.00, '1 Year', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80'),
('Gaming Mouse', 'ProClick X', 'SN-EL-010', 'High precision gaming mouse with customizable RGB lighting.', 10, 45.00, '2 Years', 'GameTech', 'active', 'Electronics', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&q=80'),
('Laptop Backpack', 'UrbanCarry 15', 'SN-CL-011', 'Water-resistant backpack fits up to 15-inch laptops.', 20, 35.00, '6 Months', 'CarryGoods', 'active', 'Clothing', 'https://images.unsplash.com/photo-1514474959185-1472d4c4e0d4?w=500&q=80'),
('Electric Kettle', 'QuickBoil 1.7L', 'SN-HK-012', 'Fast boiling electric kettle with auto shut-off.', 7, 28.00, '1 Year', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=500&q=80'),
('Cookware Set', 'ChefMaster 10pc', 'SN-HK-013', '10-piece non-stick cookware set for everyday cooking.', 6, 120.00, '2 Years', 'KitchenPro', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80'),
('Science Fiction Novel', 'Galactic Wars', 'SN-BK-014', 'Epic space adventure across distant galaxies.', 18, 20.00, 'No Warranty', 'BookWorld Publishing', 'active', 'Books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80'),
('Desk Lamp', 'BrightLite LED', 'SN-HK-015', 'Adjustable LED desk lamp with touch controls.', 14, 22.00, '1 Year', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80'),
('Fitness Dumbbells Set', 'IronFlex 20kg', 'SN-SO-016', 'Adjustable dumbbell set for home workouts.', 9, 75.00, '1 Year', 'FitnessGear', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=500&q=80'),
('Women''s Hoodie', 'CozyWear', 'SN-CL-017', 'Soft and warm hoodie for casual wear.', 25, 40.00, 'No Warranty', 'EcoWear', 'active', 'Clothing', 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=500&q=80'),
('Smartphone Stand', 'HoldIt Pro', 'SN-EL-018', 'Adjustable aluminum stand for smartphones and tablets.', 30, 12.00, '6 Months', 'GadgetCo', 'active', 'Electronics', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&q=80'),
('Air Fryer', 'CrispCook XL', 'SN-HK-019', 'Oil-free air fryer with digital controls.', 5, 95.00, '2 Years', 'KitchenPro', 'active', 'Home & Kitchen', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Airfryer_Convert.jpg/500px-Airfryer_Convert.jpg'),
('Notebook Set', 'WriteSmart Pack', 'SN-BK-020', 'Set of 5 premium notebooks for daily use.', 40, 15.00, 'No Warranty', 'OfficeSupplies Co', 'active', 'Books', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80'),
('Tennis Racket', 'PowerSwing 300', 'SN-SO-021', 'Lightweight tennis racket for beginners and pros.', 11, 65.00, '1 Year', 'SportPro', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=500&q=80'),
('Wireless Keyboard', 'TypeEase K7', 'SN-EL-022', 'Slim wireless keyboard with long battery life.', 13, 50.00, '1 Year', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80'),
('Blender', 'SmoothMix Pro', 'SN-HK-023', 'High-speed blender perfect for smoothies and soups.', 8, 70.00, '2 Years', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&q=80')
ON CONFLICT (serial_no) DO NOTHING;

UPDATE products SET sales_count = 150 WHERE name ILIKE '%Wireless Noise-Canceling%';
UPDATE products SET sales_count = 120 WHERE name ILIKE '%Men''s Running Shoes%';
UPDATE products SET sales_count = 80 WHERE name ILIKE '%Bestselling Fiction Novel%';
UPDATE products SET sales_count = 50 WHERE name ILIKE '%Smart LED Light Bulb%';

INSERT INTO users (name, email, phone, password, role) VALUES
('Ayse Demir', 'ayse.reviewer@example.com', '5551000001', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Mert Kaya', 'mert.reviewer@example.com', '5551000002', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Selin Aydin', 'selin.reviewer@example.com', '5551000003', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Can Yilmaz', 'can.reviewer@example.com', '5551000004', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Ece Arslan', 'ece.reviewer@example.com', '5551000005', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Deniz Sahin', 'deniz.reviewer@example.com', '5551000006', '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Battery life is great and the sound feels premium.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-EL-001' AND u.email = 'ayse.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Noise cancellation works better than I expected.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-EL-001' AND u.email = 'mert.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Comfortable for long use, very good overall.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-EL-001' AND u.email = 'selin.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Lightweight and comfortable during runs.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-CL-002' AND u.email = 'can.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Good grip and nice design for the price.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-CL-002' AND u.email = 'ece.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Finished it in two days, the story is really engaging.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-BK-004' AND u.email = 'deniz.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'A solid mystery novel with a strong ending.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-BK-004' AND u.email = 'ayse.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Easy setup and the colors look great in the room.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-HK-006' AND u.email = 'mert.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Very bright and works smoothly with voice control.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-HK-006' AND u.email = 'selin.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Compact speaker but the bass is surprisingly strong.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-EL-009' AND u.email = 'can.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Great response time and comfortable for gaming.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-EL-010' AND u.email = 'ece.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Good size for daily use and the fabric feels durable.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-CL-011' AND u.email = 'deniz.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Cooks fries quickly and the basket is very easy to clean.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-HK-019' AND u.email = 'ayse.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Good capacity for a small kitchen and food comes out crispy.', 'approved'
FROM products p, users u
WHERE p.serial_no = 'SN-HK-019' AND u.email = 'mert.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Mock Addresses (guarded so re-running the seed never duplicates rows)
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', '123 Main St, Apt 4B', 'Istanbul', 'Kadikoy', '34710', TRUE FROM users u WHERE email = 'ayse.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');

INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Office', '456 Business Rd, Floor 2', 'Ankara', 'Cankaya', '06690', TRUE FROM users u WHERE email = 'mert.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Office');

-- Mock Orders (identified by user + total so re-runs are no-ops)
INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status)
SELECT u.id, 150.00, a.id, a.id, 'processing'
FROM users u JOIN addresses a ON u.id = a.user_id
WHERE u.email = 'ayse.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 150.00)
LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status)
SELECT u.id, 65.00, a.id, a.id, 'in-transit'
FROM users u JOIN addresses a ON u.id = a.user_id
WHERE u.email = 'mert.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 65.00)
LIMIT 1;

-- Mock Order Items
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 150.00
FROM orders o, products p, users u
WHERE o.user_id = u.id AND u.email = 'ayse.reviewer@example.com' AND p.serial_no = 'SN-EL-001' AND o.total_amount = 150.00
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 65.00
FROM orders o, products p, users u
WHERE o.user_id = u.id AND u.email = 'mert.reviewer@example.com' AND p.serial_no = 'SN-SO-021' AND o.total_amount = 65.00
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

-- ============================================================================
-- EXTENDED SEED DATA
-- 34 additional products (verified Unsplash images), 8 additional customers,
-- addresses, 15 orders across every status, approved + pending reviews,
-- wishlist items, and return requests. Every block is idempotent.
-- All seeded customers share the password: password123
-- ============================================================================

INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, status, category, image_url) VALUES
-- Electronics
('Smartwatch', 'PulseFit S2', 'SN-EL-024', 'Fitness smartwatch with heart-rate and sleep tracking, built-in GPS, 5 ATM water resistance, and up to 7 days of battery life.', 14, 199.99, '2 Years', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'),
('True Wireless Earbuds', 'AirTune Pro', 'SN-EL-025', 'In-ear wireless earbuds with active noise cancellation, wireless charging case, and 24 hours of total playtime.', 25, 89.99, '1 Year', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&q=80'),
('Ultrabook Laptop', 'AeroBook 14', 'SN-EL-026', '14-inch ultrabook with a 2.8K display, 16 GB RAM, 512 GB NVMe SSD, and a fanless aluminum body weighing just 1.2 kg.', 6, 899.99, '2 Years', 'GadgetCo', 'active', 'Electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80'),
('DSLR Camera', 'PhotoMax D750', 'SN-EL-027', '24.2 MP DSLR camera with an 18-55mm kit lens, 4K video recording, and dual SD card slots for professional workflows.', 4, 649.99, '2 Years', 'PhotoPro Distribution', 'active', 'Electronics', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80'),
('10.9-inch Tablet', 'SlateTab 10', 'SN-EL-028', 'Slim 10.9-inch tablet with a laminated 2K display, quad speakers, stylus support, and all-day 10-hour battery.', 9, 379.99, '1 Year', 'GadgetCo', 'active', 'Electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80'),
('27-inch QHD Monitor', 'ClearView 27Q', 'SN-EL-029', '27-inch QHD IPS monitor with 144 Hz refresh rate, 1 ms response time, and a height-adjustable ergonomic stand.', 7, 259.99, '3 Years', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80'),
('Camera Drone', 'SkyHawk Mini', 'SN-EL-030', 'Foldable camera drone under 249 g with a 4K gimbal camera, 31 minutes of flight time, and GPS return-to-home.', 5, 329.99, '1 Year', 'GadgetCo', 'active', 'Electronics', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&q=80'),
('20000mAh Power Bank', 'ChargeCore 20K', 'SN-EL-031', '20,000 mAh power bank with 22.5 W fast charging, dual USB-A and USB-C ports, and an LED charge indicator.', 35, 39.99, '1 Year', 'GadgetCo', 'active', 'Electronics', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80'),
('Gaming Headset', 'ThunderSound GX', 'SN-EL-032', 'Over-ear gaming headset with 7.1 surround sound, a detachable noise-isolating microphone, and memory foam ear cushions.', 16, 69.99, '2 Years', 'GameTech', 'active', 'Electronics', 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500&q=80'),
('E-Reader', 'PageLight 7', 'SN-EL-033', '7-inch e-reader with a 300 ppi glare-free display, adjustable warm light, 16 GB storage, and weeks of battery life.', 11, 129.99, '1 Year', 'TechAudio Inc', 'active', 'Electronics', 'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=500&q=80'),
-- Clothing
('Men''s Denim Jacket', 'TrueBlue Classic', 'SN-CL-034', 'Classic-fit denim jacket in stonewashed indigo, 100% cotton with button flap chest pockets and adjustable waist tabs.', 18, 59.99, 'No Warranty', 'UrbanStyle Textiles', 'active', 'Clothing', 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500&q=80'),
('Leather Wallet', 'UrbanHide Slim', 'SN-CL-035', 'Slim bifold wallet in full-grain leather with RFID blocking, ten card slots, and a dedicated banknote compartment.', 40, 29.99, 'No Warranty', 'CarryGoods', 'active', 'Clothing', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80'),
('Polarized Sunglasses', 'SunShield Aviator', 'SN-CL-036', 'Aviator sunglasses with polarized UV400 lenses, a lightweight metal frame, and a hard protective case included.', 22, 34.99, 'No Warranty', 'UrbanStyle Textiles', 'active', 'Clothing', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80'),
('Baseball Cap', 'StreetFit Cap', 'SN-CL-037', 'Six-panel cotton twill baseball cap with an adjustable brass buckle strap and embroidered eyelets, one size fits most.', 50, 14.99, 'No Warranty', 'UrbanStyle Textiles', 'active', 'Clothing', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80'),
('Knit Beanie', 'WarmKnit', 'SN-CL-038', 'Soft ribbed-knit beanie in a double-layer acrylic blend that keeps warmth in without itching, unisex one-size fit.', 35, 12.99, 'No Warranty', 'EcoWear', 'active', 'Clothing', 'https://live.staticflickr.com/4069/4300232142_3beb25ec8e_b.jpg'),
('Women''s Summer Dress', 'Breeze Midi', 'SN-CL-039', 'Lightweight floral midi dress in breathable viscose with a smocked back, flutter sleeves, and side pockets.', 13, 49.99, 'No Warranty', 'UrbanStyle Textiles', 'active', 'Clothing', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80'),
('Men''s Classic Watch', 'Heritage 40', 'SN-CL-040', '40 mm analog watch with a sapphire-coated mineral glass, genuine leather strap, Japanese quartz movement, and 5 ATM water resistance.', 8, 119.99, '2 Years', 'TimeCraft Trading', 'active', 'Clothing', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80'),
-- Home & Kitchen
('Espresso Machine', 'BaristaHome 15Bar', 'SN-HK-041', '15-bar pump espresso machine with a steam milk frother, 1.5 L removable water tank, and stainless steel housing.', 6, 189.99, '2 Years', 'KitchenPro', 'active', 'Home & Kitchen', 'https://live.staticflickr.com/2089/2166195987_7c6a84ecd8.jpg'),
('Robot Vacuum Cleaner', 'CleanBot S6', 'SN-HK-042', 'Laser-navigation robot vacuum with 2700 Pa suction, app-controlled room mapping, and automatic recharge and resume.', 5, 249.99, '2 Years', 'HomeAppliances Co', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80'),
('Ceramic Dinnerware Set', 'TerraCeram 16pc', 'SN-HK-043', '16-piece stoneware dinnerware set for four in a matte sand finish; dishwasher and microwave safe.', 10, 79.99, 'No Warranty', 'KitchenPro', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=500&q=80'),
('Scented Candle', 'AmberGlow', 'SN-HK-044', 'Hand-poured soy wax candle with amber and sandalwood notes, 45-hour burn time, in a reusable glass jar.', 45, 16.99, 'No Warranty', 'CozyHome Goods', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80'),
('Memory Foam Pillow', 'CloudRest', 'SN-HK-045', 'Ergonomic memory foam pillow with a cooling gel layer and a removable, machine-washable bamboo cover.', 30, 27.99, 'No Warranty', 'CozyHome Goods', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&q=80'),
('Minimalist Wall Clock', 'MinimalTime 30cm', 'SN-HK-046', '30 cm silent non-ticking wall clock with a matte black metal frame and high-contrast Scandinavian dial.', 19, 21.99, '1 Year', 'CozyHome Goods', 'active', 'Home & Kitchen', 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80'),
-- Books
('Productivity Guide Book', 'The Art of Focus', 'SN-BK-047', 'A practical guide to deep work and attention management, with 12 evidence-based techniques to reclaim your day. Paperback, 312 pages.', 28, 16.99, 'No Warranty', 'BookWorld Publishing', 'active', 'Books', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80'),
('World History Book', 'A Brief History of Civilizations', 'SN-BK-048', 'An accessible survey of world civilizations from Mesopotamia to the modern era, illustrated with maps and timelines. Hardcover, 540 pages.', 15, 24.99, 'No Warranty', 'BookWorld Publishing', 'active', 'Books', 'https://live.staticflickr.com/1699/26695449166_4d9a13ea6a_b.jpg'),
('JavaScript Programming Book', 'Mastering JavaScript, 3rd Edition', 'SN-BK-049', 'From closures to async patterns and modern tooling — a hands-on guide for intermediate developers with 80+ exercises. Paperback, 624 pages.', 12, 39.99, 'No Warranty', 'PageTurner Media', 'active', 'Books', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&q=80'),
('Children''s Picture Book', 'The Little Explorer', 'SN-BK-050', 'A beautifully illustrated adventure about a curious fox discovering the forest, for ages 3-7. Hardcover, 40 pages.', 33, 11.99, 'No Warranty', 'PageTurner Media', 'active', 'Books', 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&q=80'),
('Anatolian Cuisine Cookbook', 'Anatolian Kitchen', 'SN-BK-051', '95 traditional Anatolian recipes with step-by-step photos, ingredient guides, and regional stories. Hardcover, 288 pages.', 17, 29.99, 'No Warranty', 'BookWorld Publishing', 'active', 'Books', 'https://live.staticflickr.com/6099/6292368951_3dfc07d650_b.jpg'),
-- Sports & Outdoors
('Camping Tent', 'TrailDome 3P', 'SN-SO-052', 'Three-person dome tent with a waterproof 3000 mm rainfly, fiberglass poles, and a 10-minute single-person setup.', 7, 139.99, '1 Year', 'OutdoorLife Supply', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80'),
('Basketball', 'ProBounce 7', 'SN-SO-053', 'Official size 7 composite leather basketball with deep channels for grip, suitable for indoor and outdoor courts.', 26, 24.99, 'No Warranty', 'SportPro', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80'),
('Soccer Ball', 'StrikeMaster 5', 'SN-SO-054', 'FIFA-quality size 5 match ball with thermally bonded panels for a consistent flight path and low water uptake.', 0, 19.99, 'No Warranty', 'SportPro', 'active', 'Sports & Outdoors', 'https://live.staticflickr.com/3317/4625644446_1f16d51af8_b.jpg'),
('Skateboard', 'StreetGlide 31', 'SN-SO-055', '31-inch double-kick skateboard with a 7-ply maple deck, ABEC-9 bearings, and 95A high-rebound wheels.', 9, 54.99, '6 Months', 'OutdoorLife Supply', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=500&q=80'),
('Hiking Backpack', 'SummitPack 45L', 'SN-SO-056', '45 L hiking backpack with an internal frame, rain cover, hydration bladder sleeve, and ventilated back panel.', 12, 64.99, '1 Year', 'OutdoorLife Supply', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80'),
('Insulated Water Bottle', 'ThermoFlow 750ml', 'SN-SO-057', 'Double-wall vacuum insulated 750 ml steel bottle that keeps drinks cold for 24 hours or hot for 12, leak-proof lid.', 38, 18.99, 'No Warranty', 'FitnessGear', 'active', 'Sports & Outdoors', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80')
ON CONFLICT (serial_no) DO NOTHING;

-- ============================================================================
-- IMAGE CORRECTIONS
-- Every product image below was verified by downloading the file and visually
-- confirming the subject matches the product title. This block runs after the
-- INSERTs so existing databases (whose rows were skipped by ON CONFLICT) and
-- fresh installs converge to the exact same, correct images. Hosts used
-- (upload.wikimedia.org, live.staticflickr.com, images.unsplash.com) all allow
-- hotlinking, so the images load directly in the browser.
-- ============================================================================
-- Originally broken / dead premium Unsplash links:
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Toaster.jpg/500px-Toaster.jpg' WHERE serial_no = 'SN-HK-003';  -- Stainless Steel Toaster
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80' WHERE serial_no = 'SN-EL-009';  -- Bluetooth Speaker
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Airfryer_Convert.jpg/500px-Airfryer_Convert.jpg' WHERE serial_no = 'SN-HK-019';  -- Air Fryer
-- Subject did not match the title (e.g. a market shown for "Smart LED Light Bulb"):
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/LED-E27-Light-Bulb-1134.jpg/500px-LED-E27-Light-Bulb-1134.jpg' WHERE serial_no = 'SN-HK-006';  -- Smart LED Light Bulb
UPDATE products SET image_url = 'https://live.staticflickr.com/1598/25298415213_78a983979e.jpg' WHERE serial_no = 'SN-HK-012';  -- Electric Kettle
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Hahn_16cm_Saucepan.jpg/500px-Hahn_16cm_Saucepan.jpg' WHERE serial_no = 'SN-HK-013';  -- Cookware Set
UPDATE products SET image_url = 'https://live.staticflickr.com/3676/12317651403_2e37f65f02_b.jpg' WHERE serial_no = 'SN-HK-023';  -- Blender
UPDATE products SET image_url = 'https://live.staticflickr.com/2089/2166195987_7c6a84ecd8.jpg' WHERE serial_no = 'SN-HK-041';  -- Espresso Machine
UPDATE products SET image_url = 'https://live.staticflickr.com/4096/4777334208_bbd8bd6c33_m.jpg' WHERE serial_no = 'SN-EL-010';  -- Gaming Mouse
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/DIY_tablet_smartphone_stand_2.jpg/500px-DIY_tablet_smartphone_stand_2.jpg' WHERE serial_no = 'SN-EL-018';  -- Smartphone Stand
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/HK_backpack_bag_XD_Design_Bobby_Urban_grey_September_2022_Px3_01.jpg/500px-HK_backpack_bag_XD_Design_Bobby_Urban_grey_September_2022_Px3_01.jpg' WHERE serial_no = 'SN-CL-011';  -- Laptop Backpack
UPDATE products SET image_url = 'https://live.staticflickr.com/3860/15023141998_647297aa8a_b.jpg' WHERE serial_no = 'SN-CL-017';  -- Women's Hoodie
UPDATE products SET image_url = 'https://live.staticflickr.com/4069/4300232142_3beb25ec8e_b.jpg' WHERE serial_no = 'SN-CL-038';  -- Knit Beanie
UPDATE products SET image_url = 'https://live.staticflickr.com/105/300297725_3937a007eb_b.jpg' WHERE serial_no = 'SN-BK-020';  -- Notebook Set
UPDATE products SET image_url = 'https://live.staticflickr.com/1699/26695449166_4d9a13ea6a_b.jpg' WHERE serial_no = 'SN-BK-048';  -- World History Book
UPDATE products SET image_url = 'https://live.staticflickr.com/6099/6292368951_3dfc07d650_b.jpg' WHERE serial_no = 'SN-BK-051';  -- Anatolian Cuisine Cookbook
UPDATE products SET image_url = 'https://live.staticflickr.com/3329/3210745877_4feb7cd118_b.jpg' WHERE serial_no = 'SN-SO-016';  -- Fitness Dumbbells Set
UPDATE products SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Tennis_Racket_and_Balls.jpg' WHERE serial_no = 'SN-SO-021';  -- Tennis Racket
UPDATE products SET image_url = 'https://live.staticflickr.com/3317/4625644446_1f16d51af8_b.jpg' WHERE serial_no = 'SN-SO-054';  -- Soccer Ball

-- Popularity figures for the new catalog (absolute values, safe to re-run)
UPDATE products SET sales_count = 95  WHERE serial_no = 'SN-EL-024';
UPDATE products SET sales_count = 110 WHERE serial_no = 'SN-EL-025';
UPDATE products SET sales_count = 25  WHERE serial_no = 'SN-EL-026';
UPDATE products SET sales_count = 18  WHERE serial_no = 'SN-EL-027';
UPDATE products SET sales_count = 30  WHERE serial_no = 'SN-EL-028';
UPDATE products SET sales_count = 22  WHERE serial_no = 'SN-EL-029';
UPDATE products SET sales_count = 15  WHERE serial_no = 'SN-EL-030';
UPDATE products SET sales_count = 75  WHERE serial_no = 'SN-EL-031';
UPDATE products SET sales_count = 60  WHERE serial_no = 'SN-EL-032';
UPDATE products SET sales_count = 45  WHERE serial_no = 'SN-EL-033';
UPDATE products SET sales_count = 65  WHERE serial_no = 'SN-CL-034';
UPDATE products SET sales_count = 90  WHERE serial_no = 'SN-CL-035';
UPDATE products SET sales_count = 40  WHERE serial_no = 'SN-CL-036';
UPDATE products SET sales_count = 85  WHERE serial_no = 'SN-CL-037';
UPDATE products SET sales_count = 70  WHERE serial_no = 'SN-CL-038';
UPDATE products SET sales_count = 35  WHERE serial_no = 'SN-CL-039';
UPDATE products SET sales_count = 12  WHERE serial_no = 'SN-CL-040';
UPDATE products SET sales_count = 28  WHERE serial_no = 'SN-HK-041';
UPDATE products SET sales_count = 20  WHERE serial_no = 'SN-HK-042';
UPDATE products SET sales_count = 32  WHERE serial_no = 'SN-HK-043';
UPDATE products SET sales_count = 88  WHERE serial_no = 'SN-HK-044';
UPDATE products SET sales_count = 55  WHERE serial_no = 'SN-HK-045';
UPDATE products SET sales_count = 26  WHERE serial_no = 'SN-HK-046';
UPDATE products SET sales_count = 48  WHERE serial_no = 'SN-BK-047';
UPDATE products SET sales_count = 22  WHERE serial_no = 'SN-BK-048';
UPDATE products SET sales_count = 38  WHERE serial_no = 'SN-BK-049';
UPDATE products SET sales_count = 52  WHERE serial_no = 'SN-BK-050';
UPDATE products SET sales_count = 30  WHERE serial_no = 'SN-BK-051';
UPDATE products SET sales_count = 16  WHERE serial_no = 'SN-SO-052';
UPDATE products SET sales_count = 42  WHERE serial_no = 'SN-SO-053';
UPDATE products SET sales_count = 60  WHERE serial_no = 'SN-SO-054';
UPDATE products SET sales_count = 24  WHERE serial_no = 'SN-SO-055';
UPDATE products SET sales_count = 33  WHERE serial_no = 'SN-SO-056';
UPDATE products SET sales_count = 58  WHERE serial_no = 'SN-SO-057';

-- Additional customers (password for all: password123)
INSERT INTO users (name, email, phone, tax_id, home_address, password, role) VALUES
('Zeynep Koc',  'zeynep.koc@example.com',  '5551000007', '12345678901', 'Bagdat Caddesi No:112 D:5, Maltepe/Istanbul',        '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Emre Ozturk', 'emre.ozturk@example.com', '5551000008', '23456789012', 'Tunali Hilmi Caddesi No:48 D:3, Cankaya/Ankara',     '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Elif Yildiz', 'elif.yildiz@example.com', '5551000009', '34567890123', 'Kibris Sehitleri Caddesi No:21 D:6, Konak/Izmir',    '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Burak Celik', 'burak.celik@example.com', '5551000010', '45678901234', 'Ataturk Bulvari No:90 Kat:4, Cankaya/Ankara',        '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Aylin Erdem', 'aylin.erdem@example.com', '5551000011', '56789012345', 'Moda Caddesi No:67 D:2, Kadikoy/Istanbul',           '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Kerem Aksoy', 'kerem.aksoy@example.com', '5551000012', '67890123456', 'Izmir Yolu Caddesi No:155 D:8, Nilufer/Bursa',       '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Melis Acar',  'melis.acar@example.com',  '5551000013', '78901234567', 'Konyaalti Bulvari No:33 D:6, Konyaalti/Antalya',     '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer'),
('Onur Polat',  'onur.polat@example.com',  '5551000014', '89012345678', 'Baglar Caddesi No:14 D:1, Besiktas/Istanbul',        '$2b$10$k1Ltj9KYJ30gqXA10N0EE.MH/d68tiNQ4Ac5NEnBEg.e5xcZd2.VG', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Backfill tax/address info for the original reviewer accounts
UPDATE users SET tax_id = '90123456789', home_address = 'Caferaga Mahallesi Moda Caddesi No:12 D:4, Kadikoy/Istanbul' WHERE email = 'ayse.reviewer@example.com'  AND tax_id IS NULL;
UPDATE users SET tax_id = '01234567891', home_address = 'Birlik Mahallesi 448. Cadde No:8 D:2, Cankaya/Ankara'        WHERE email = 'mert.reviewer@example.com'  AND tax_id IS NULL;
UPDATE users SET tax_id = '11234567892', home_address = 'Halaskargazi Caddesi No:38 D:7, Sisli/Istanbul'              WHERE email = 'selin.reviewer@example.com' AND tax_id IS NULL;
UPDATE users SET tax_id = '21234567893', home_address = 'Kordon Boyu No:101 D:4, Karsiyaka/Izmir'                     WHERE email = 'can.reviewer@example.com'   AND tax_id IS NULL;
UPDATE users SET tax_id = '31234567894', home_address = 'Bahariye Caddesi No:55 D:3, Kadikoy/Istanbul'                WHERE email = 'ece.reviewer@example.com'   AND tax_id IS NULL;
UPDATE users SET tax_id = '41234567895', home_address = 'Universite Caddesi No:27 Kat:2, Tuzla/Istanbul'              WHERE email = 'deniz.reviewer@example.com' AND tax_id IS NULL;

-- Addresses for every customer that places an order below
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Bagdat Caddesi No:112 D:5', 'Istanbul', 'Maltepe', '34844', TRUE FROM users u WHERE email = 'zeynep.koc@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Tunali Hilmi Caddesi No:48 D:3', 'Ankara', 'Cankaya', '06680', TRUE FROM users u WHERE email = 'emre.ozturk@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Kibris Sehitleri Caddesi No:21 D:6', 'Izmir', 'Konak', '35220', TRUE FROM users u WHERE email = 'elif.yildiz@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Office', 'Ataturk Bulvari No:90 Kat:4', 'Ankara', 'Cankaya', '06420', TRUE FROM users u WHERE email = 'burak.celik@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Office');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Moda Caddesi No:67 D:2', 'Istanbul', 'Kadikoy', '34710', TRUE FROM users u WHERE email = 'aylin.erdem@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Izmir Yolu Caddesi No:155 D:8', 'Bursa', 'Nilufer', '16110', TRUE FROM users u WHERE email = 'kerem.aksoy@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Konyaalti Bulvari No:33 D:6', 'Antalya', 'Konyaalti', '07050', TRUE FROM users u WHERE email = 'melis.acar@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Baglar Caddesi No:14 D:1', 'Istanbul', 'Besiktas', '34353', TRUE FROM users u WHERE email = 'onur.polat@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Halaskargazi Caddesi No:38 D:7', 'Istanbul', 'Sisli', '34371', TRUE FROM users u WHERE email = 'selin.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Kordon Boyu No:101 D:4', 'Izmir', 'Karsiyaka', '35600', TRUE FROM users u WHERE email = 'can.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Home', 'Bahariye Caddesi No:55 D:3', 'Istanbul', 'Kadikoy', '34714', TRUE FROM users u WHERE email = 'ece.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Home');
INSERT INTO addresses (user_id, title, full_address, city, district, postal_code, is_default)
SELECT id, 'Office', 'Universite Caddesi No:27 Kat:2', 'Istanbul', 'Tuzla', '34956', TRUE FROM users u WHERE email = 'deniz.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id AND a.title = 'Office');

-- Orders across every status. Each order is identified by (user, total) so the
-- block is a no-op when re-run, and item prices always sum to the order total.
INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 239.98, a.id, a.id, 'delivered', NOW() - INTERVAL '21 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'zeynep.koc@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 239.98) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 49.99, a.id, a.id, 'processing', NOW() - INTERVAL '1 day'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'zeynep.koc@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 49.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 114.99, a.id, a.id, 'delivered', NOW() - INTERVAL '15 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'emre.ozturk@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 114.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 223.97, a.id, a.id, 'delivered', NOW() - INTERVAL '12 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'elif.yildiz@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 223.97) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 89.98, a.id, a.id, 'in-transit', NOW() - INTERVAL '3 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'burak.celik@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 89.98) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 14.99, a.id, a.id, 'delivered', NOW() - INTERVAL '10 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'burak.celik@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 14.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 129.99, a.id, a.id, 'delivered', NOW() - INTERVAL '9 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'aylin.erdem@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 129.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 899.99, a.id, a.id, 'delivered', NOW() - INTERVAL '25 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'kerem.aksoy@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 899.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 21.99, a.id, a.id, 'cancelled', NOW() - INTERVAL '6 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'melis.acar@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 21.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 72.98, a.id, a.id, 'delivered', NOW() - INTERVAL '8 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'onur.polat@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 72.98) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 249.99, a.id, a.id, 'delivered', NOW() - INTERVAL '11 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'ayse.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 249.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 69.98, a.id, a.id, 'delivered', NOW() - INTERVAL '14 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'mert.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 69.98) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 649.99, a.id, a.id, 'delivered', NOW() - INTERVAL '5 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'selin.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 649.99) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 159.98, a.id, a.id, 'delivered', NOW() - INTERVAL '7 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'can.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 159.98) LIMIT 1;

INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
SELECT u.id, 79.99, a.id, a.id, 'delivered', NOW() - INTERVAL '10 days'
FROM users u JOIN addresses a ON a.user_id = u.id AND a.is_default
WHERE u.email = 'ece.reviewer@example.com'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total_amount = 79.99) LIMIT 1;

-- Order items (price_at_purchase matches the catalog price; sums equal order totals)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 199.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-024'
WHERE u.email = 'zeynep.koc@example.com' AND o.total_amount = 239.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 39.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-031'
WHERE u.email = 'zeynep.koc@example.com' AND o.total_amount = 239.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 49.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-CL-039'
WHERE u.email = 'zeynep.koc@example.com' AND o.total_amount = 49.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 69.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-032'
WHERE u.email = 'emre.ozturk@example.com' AND o.total_amount = 114.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 45.00 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-010'
WHERE u.email = 'emre.ozturk@example.com' AND o.total_amount = 114.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 189.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-HK-041'
WHERE u.email = 'elif.yildiz@example.com' AND o.total_amount = 223.97
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 2, 16.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-HK-044'
WHERE u.email = 'elif.yildiz@example.com' AND o.total_amount = 223.97
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 24.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-SO-053'
WHERE u.email = 'burak.celik@example.com' AND o.total_amount = 89.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 64.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-SO-056'
WHERE u.email = 'burak.celik@example.com' AND o.total_amount = 89.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 14.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-CL-037'
WHERE u.email = 'burak.celik@example.com' AND o.total_amount = 14.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 129.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-033'
WHERE u.email = 'aylin.erdem@example.com' AND o.total_amount = 129.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 899.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-026'
WHERE u.email = 'kerem.aksoy@example.com' AND o.total_amount = 899.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 21.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-HK-046'
WHERE u.email = 'melis.acar@example.com' AND o.total_amount = 21.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 59.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-CL-034'
WHERE u.email = 'onur.polat@example.com' AND o.total_amount = 72.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 12.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-CL-038'
WHERE u.email = 'onur.polat@example.com' AND o.total_amount = 72.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 249.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-HK-042'
WHERE u.email = 'ayse.reviewer@example.com' AND o.total_amount = 249.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 39.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-BK-049'
WHERE u.email = 'mert.reviewer@example.com' AND o.total_amount = 69.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 29.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-CL-035'
WHERE u.email = 'mert.reviewer@example.com' AND o.total_amount = 69.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 649.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-EL-027'
WHERE u.email = 'selin.reviewer@example.com' AND o.total_amount = 649.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 139.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-SO-052'
WHERE u.email = 'can.reviewer@example.com' AND o.total_amount = 159.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 19.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-SO-054'
WHERE u.email = 'can.reviewer@example.com' AND o.total_amount = 159.98
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
SELECT o.id, p.id, 1, 79.99 FROM orders o JOIN users u ON u.id = o.user_id JOIN products p ON p.serial_no = 'SN-HK-043'
WHERE u.email = 'ece.reviewer@example.com' AND o.total_amount = 79.99
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

-- Approved reviews — every reviewer below has a delivered order containing the product
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Step and sleep tracking are spot on, and the battery really lasts a full week.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-024' AND u.email = 'zeynep.koc@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Charges my phone three times over before it needs a recharge itself.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-031' AND u.email = 'zeynep.koc@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Crystal clear microphone and the surround sound gives a real edge in games.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-032' AND u.email = 'emre.ozturk@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Buttons feel responsive and precise; the RGB software could be simpler though.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-010' AND u.email = 'emre.ozturk@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Pulls a rich espresso shot with great crema, just like a cafe machine.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-HK-041' AND u.email = 'elif.yildiz@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Lovely warm scent and a long burn time, though a bit strong for small rooms.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-HK-044' AND u.email = 'elif.yildiz@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'The warm backlight makes reading at night so comfortable, and the battery goes on for weeks.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-033' AND u.email = 'aylin.erdem@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Boots in seconds and handles heavy multitasking in complete silence.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-EL-026' AND u.email = 'kerem.aksoy@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Fits true to size and the denim feels sturdy without being stiff.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-CL-034' AND u.email = 'onur.polat@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Kept me warm through the whole winter and does not itch at all.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-CL-038' AND u.email = 'onur.polat@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Maps the whole flat accurately and picks up pet hair impressively well.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-HK-042' AND u.email = 'ayse.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Clear explanations with practical examples, ideal for intermediate developers.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-BK-049' AND u.email = 'mert.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Slim profile but still fits ten cards and folded banknotes comfortably.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-CL-035' AND u.email = 'mert.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Great touch and flight, and it holds air pressure well after weeks of use.', 'approved'
FROM products p, users u WHERE p.serial_no = 'SN-SO-054' AND u.email = 'can.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Pending reviews — left unapproved on purpose so the Product Manager
-- moderation flow has real material during the demo
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Image quality is stunning in daylight; autofocus hunts a little indoors.', 'pending'
FROM products p, users u WHERE p.serial_no = 'SN-EL-027' AND u.email = 'selin.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 5, 'Setup took ten minutes and it stayed completely dry through heavy rain.', 'pending'
FROM products p, users u WHERE p.serial_no = 'SN-SO-052' AND u.email = 'can.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO reviews (product_id, user_id, rating, comment, status)
SELECT p.id, u.id, 4, 'Elegant matte finish and it survived the dishwasher with no issues so far.', 'pending'
FROM products p, users u WHERE p.serial_no = 'SN-HK-043' AND u.email = 'ece.reviewer@example.com'
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Wishlist items — give the Sales Manager discount-notification demo real targets
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'zeynep.koc@example.com' AND p.serial_no = 'SN-EL-030'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'zeynep.koc@example.com' AND p.serial_no = 'SN-EL-029'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'emre.ozturk@example.com' AND p.serial_no = 'SN-EL-026'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'emre.ozturk@example.com' AND p.serial_no = 'SN-SO-055'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'elif.yildiz@example.com' AND p.serial_no = 'SN-CL-039'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'elif.yildiz@example.com' AND p.serial_no = 'SN-HK-045'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'aylin.erdem@example.com' AND p.serial_no = 'SN-EL-024'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'aylin.erdem@example.com' AND p.serial_no = 'SN-BK-051'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'onur.polat@example.com' AND p.serial_no = 'SN-SO-021'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'melis.acar@example.com' AND p.serial_no = 'SN-EL-030'
ON CONFLICT (user_id, product_id) DO NOTHING;
INSERT INTO wishlist_items (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.email = 'deniz.reviewer@example.com' AND p.serial_no = 'SN-HK-041'
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Return requests: one already resolved, one pending for the Sales Manager demo.
-- Both reference delivered orders placed within the 30-day return window.
INSERT INTO return_requests (order_id, order_item_id, user_id, product_id, quantity, reason, status, resolved_at)
SELECT o.id, oi.id, u.id, p.id, oi.quantity, 'Color looked different than the product photos.', 'approved', NOW() - INTERVAL '2 days'
FROM users u
JOIN orders o ON o.user_id = u.id AND o.total_amount = 14.99
JOIN products p ON p.serial_no = 'SN-CL-037'
JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
WHERE u.email = 'burak.celik@example.com'
ON CONFLICT (order_item_id) DO NOTHING;

INSERT INTO return_requests (order_id, order_item_id, user_id, product_id, quantity, reason, status)
SELECT o.id, oi.id, u.id, p.id, oi.quantity, 'Scent is too strong for a small room, would like to return both.', 'pending'
FROM users u
JOIN orders o ON o.user_id = u.id AND o.total_amount = 223.97
JOIN products p ON p.serial_no = 'SN-HK-044'
JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
WHERE u.email = 'elif.yildiz@example.com'
ON CONFLICT (order_item_id) DO NOTHING;


-- ============================================================================
-- DEMO PRODUCT PROFESSIONALIZATION
-- The three placeholder "Demo ..." products are renamed in place (keeping their
-- id, so existing order history stays intact) into real catalog products with
-- proper SKUs. Idempotent: after the rename the old serials no longer exist.
-- ============================================================================
UPDATE products SET
  serial_no = 'SN-EL-058',
  name = 'ProBook 15 Business Laptop',
  model = 'PB-1550',
  description = '15.6-inch business laptop with a Full HD anti-glare display, Intel Core i7, 16 GB RAM, a 512 GB NVMe SSD, and a fingerprint reader for secure sign-in.',
  category = 'Electronics', status = 'active',
  image_url = 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80'
WHERE serial_no = 'SN-DEMO-001';

UPDATE products SET
  serial_no = 'SN-EL-059',
  name = 'SoundStage Studio Headphones',
  model = 'SS-700',
  description = 'Closed-back over-ear studio headphones with 40 mm drivers, a detachable cable, and plush replaceable memory-foam ear pads for long listening sessions.',
  category = 'Electronics', status = 'active',
  image_url = 'https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=500&q=80'
WHERE serial_no = 'SN-DEMO-002';

UPDATE products SET
  serial_no = 'SN-EL-060',
  name = 'Mechanical RGB Keyboard',
  model = 'MK-RGB87',
  description = '87-key tenkeyless mechanical keyboard with hot-swappable tactile switches, per-key RGB lighting, a durable aluminum top plate, and a detachable USB-C cable.',
  category = 'Electronics', status = 'active',
  image_url = 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80'
WHERE serial_no = 'SN-DEMO-003';

-- For fresh databases (which never had the demo rows), create the same three
-- products so every install has an identical catalog. No-op where they exist.
INSERT INTO products (name, model, serial_no, description, stock, price, warranty, distributor, status, category, image_url, sales_count) VALUES
('ProBook 15 Business Laptop','PB-1550','SN-EL-058','15.6-inch business laptop with a Full HD anti-glare display, Intel Core i7, 16 GB RAM, a 512 GB NVMe SSD, and a fingerprint reader for secure sign-in.',25,899.99,'2 Years','GadgetCo','active','Electronics','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80',20),
('SoundStage Studio Headphones','SS-700','SN-EL-059','Closed-back over-ear studio headphones with 40 mm drivers, a detachable cable, and plush replaceable memory-foam ear pads for long listening sessions.',100,149.99,'2 Years','TechAudio Inc','active','Electronics','https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=500&q=80',40),
('Mechanical RGB Keyboard','MK-RGB87','SN-EL-060','87-key tenkeyless mechanical keyboard with hot-swappable tactile switches, per-key RGB lighting, a durable aluminum top plate, and a detachable USB-C cable.',15,79.99,'2 Years','GameTech','active','Electronics','https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80',35)
ON CONFLICT (serial_no) DO NOTHING;

-- ============================================================================
-- EXTRA REVIEWS (with auto-generated backing purchases)
-- For each (customer, product, rating, comment, status) below, the block makes
-- sure the customer actually has a DELIVERED order containing that product --
-- mirroring the app rule that only buyers of a delivered order may review --
-- then inserts the review. Fully idempotent and consistent.
-- ============================================================================
DO $$
DECLARE
  rec   RECORD;
  v_user  INT;
  v_prod  INT;
  v_price NUMERIC;
  v_order INT;
  v_addr  INT;
BEGIN
  CREATE TEMP TABLE _hist(user_id INT PRIMARY KEY, order_id INT) ON COMMIT DROP;

  FOR rec IN
    SELECT * FROM (VALUES
      ('zeynep.koc@example.com','SN-EL-007',5,'Picture is razor sharp and the built-in apps load instantly.','approved'),
      ('emre.ozturk@example.com','SN-EL-022',4,'Comfortable keys and the wireless connection never drops.','approved'),
      ('elif.yildiz@example.com','SN-EL-025',5,'Noise cancellation is excellent for the price and they pair instantly.','approved'),
      ('burak.celik@example.com','SN-EL-028',4,'Great screen for reading and streaming, battery easily lasts a day.','approved'),
      ('kerem.aksoy@example.com','SN-EL-029',5,'Colours are vivid and 144Hz makes everything feel buttery smooth.','approved'),
      ('aylin.erdem@example.com','SN-EL-030',4,'Stable in light wind and the 4K footage is impressively clear.','approved'),
      ('deniz.reviewer@example.com','SN-BK-014',5,'Could not put it down, the world-building is fantastic.','approved'),
      ('mert.reviewer@example.com','SN-BK-047',5,'Practical advice that I actually applied the same week.','approved'),
      ('selin.reviewer@example.com','SN-BK-048',5,'Dense but very readable, and the maps really help.','approved'),
      ('can.reviewer@example.com','SN-BK-050',5,'My niece adores the illustrations, a beautiful book.','approved'),
      ('ece.reviewer@example.com','SN-BK-051',4,'Authentic recipes that actually work, with clear instructions.','approved'),
      ('onur.polat@example.com','SN-CL-008',4,'Soft organic cotton and the fit is true to size.','approved'),
      ('zeynep.koc@example.com','SN-CL-017',5,'Warm, soft, and the fit is really flattering. Love it.','approved'),
      ('emre.ozturk@example.com','SN-CL-036',4,'Polarisation genuinely cuts glare and the frame feels sturdy.','approved'),
      ('aylin.erdem@example.com','SN-CL-039',5,'Lovely lightweight fabric and the hidden pockets are a nice touch.','approved'),
      ('kerem.aksoy@example.com','SN-CL-040',5,'Looks far more expensive than it is and keeps perfect time.','approved'),
      ('burak.celik@example.com','SN-HK-003',4,'Toasts evenly and the wide slots fit thick sourdough.','approved'),
      ('melis.acar@example.com','SN-HK-012',5,'Boils fast and the auto shut-off gives real peace of mind.','approved'),
      ('onur.polat@example.com','SN-HK-013',5,'Heats evenly and nothing sticks, an excellent set.','approved'),
      ('deniz.reviewer@example.com','SN-HK-015',4,'The adjustable brightness is perfect for late-night work.','approved'),
      ('ayse.reviewer@example.com','SN-HK-023',5,'Crushes ice without a struggle, smoothies come out perfect.','approved'),
      ('mert.reviewer@example.com','SN-HK-045',5,'My neck pain is gone and it stays cool through the night.','approved'),
      ('can.reviewer@example.com','SN-SO-005',5,'Great grip and cushioning, it does not slip during practice.','approved'),
      ('ece.reviewer@example.com','SN-SO-016',4,'Solid build and the adjustable plates save a lot of space.','approved'),
      ('onur.polat@example.com','SN-SO-053',5,'Great grip indoors and out, and it holds air really well.','approved'),
      ('aylin.erdem@example.com','SN-SO-056',5,'Carries 45L comfortably and the rain cover is a lifesaver.','approved'),
      ('emre.ozturk@example.com','SN-SO-057',5,'Kept my water cold for a full day hike with no leaks.','approved'),
      ('elif.yildiz@example.com','SN-EL-059',4,'Rich, balanced sound and the ear pads are very comfortable.','approved'),
      ('kerem.aksoy@example.com','SN-EL-060',5,'The tactile switches feel amazing and the RGB is gorgeous.','approved'),
      ('burak.celik@example.com','SN-EL-058',4,'Fast, light, and the battery comfortably lasts a workday.','approved'),
      -- pending (left for the Product Manager moderation queue)
      ('ayse.reviewer@example.com','SN-BK-020',4,'Thick paper that does not bleed through, great value set.','pending'),
      ('elif.yildiz@example.com','SN-CL-037',4,'Good stitching and the strap adjusts easily.','pending'),
      ('selin.reviewer@example.com','SN-HK-046',4,'Truly silent and it looks elegant on the wall.','pending'),
      ('kerem.aksoy@example.com','SN-SO-055',4,'Smooth bearings and a sturdy deck for the price.','pending'),
      ('melis.acar@example.com','SN-EL-018',4,'Sturdy and adjustable, holds my phone at a perfect angle.','pending')
    ) AS t(email, serial, rating, comment, status)
  LOOP
    SELECT id INTO v_user FROM users WHERE email = rec.email;
    SELECT id, price INTO v_prod, v_price FROM products WHERE serial_no = rec.serial;
    IF v_user IS NULL OR v_prod IS NULL THEN CONTINUE; END IF;

    -- already reviewed?  skip entirely (keeps re-runs from creating extra orders)
    IF EXISTS (SELECT 1 FROM reviews WHERE user_id = v_user AND product_id = v_prod) THEN
      CONTINUE;
    END IF;

    -- make sure a delivered purchase of this product exists for the user
    IF NOT EXISTS (
      SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = v_user AND oi.product_id = v_prod AND o.status = 'delivered'
    ) THEN
      SELECT order_id INTO v_order FROM _hist WHERE user_id = v_user;
      IF v_order IS NULL THEN
        SELECT id INTO v_addr FROM addresses WHERE user_id = v_user ORDER BY is_default DESC, id LIMIT 1;
        INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
        VALUES (v_user, 0, v_addr, v_addr, 'delivered', NOW() - INTERVAL '20 days')
        RETURNING id INTO v_order;
        INSERT INTO _hist(user_id, order_id) VALUES (v_user, v_order);
      END IF;
      INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
      VALUES (v_order, v_prod, 1, v_price);
      UPDATE orders SET total_amount = total_amount + v_price WHERE id = v_order;
    END IF;

    INSERT INTO reviews (product_id, user_id, rating, comment, status)
    VALUES (v_prod, v_user, rec.rating, rec.comment, rec.status)
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END LOOP;
END $$;
-- ============================================================================
-- PURCHASE BACKFILL FOR ALL REVIEWS
-- Guarantees every review (including the original seed reviews) is backed by a
-- delivered order for that customer+product, matching the app's review rule.
-- Idempotent: only acts on reviews that still lack a delivered purchase.
-- ============================================================================
DO $$
DECLARE
  rec RECORD;
  v_order INT;
  v_addr INT;
  v_price NUMERIC;
BEGIN
  CREATE TEMP TABLE _bf(user_id INT PRIMARY KEY, order_id INT) ON COMMIT DROP;
  FOR rec IN
    SELECT r.user_id, r.product_id
    FROM reviews r
    WHERE NOT EXISTS (
      SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = r.user_id AND oi.product_id = r.product_id AND o.status = 'delivered')
    ORDER BY r.user_id, r.product_id
  LOOP
    SELECT price INTO v_price FROM products WHERE id = rec.product_id;
    SELECT order_id INTO v_order FROM _bf WHERE user_id = rec.user_id;
    IF v_order IS NULL THEN
      SELECT id INTO v_addr FROM addresses WHERE user_id = rec.user_id ORDER BY is_default DESC, id LIMIT 1;
      INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id, status, created_at)
      VALUES (rec.user_id, 0, v_addr, v_addr, 'delivered', NOW() - INTERVAL '25 days')
      RETURNING id INTO v_order;
      INSERT INTO _bf(user_id, order_id) VALUES (rec.user_id, v_order);
    END IF;
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (v_order, rec.product_id, 1, v_price);
    UPDATE orders SET total_amount = total_amount + v_price WHERE id = v_order;
  END LOOP;
END $$;
