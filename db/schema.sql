CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,      
    tax_id VARCHAR(50),
    home_address TEXT,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_no VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    stock INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    warranty VARCHAR(100),
    distributor VARCHAR(255),
    shop_owner_id INT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    category VARCHAR(255),
    image_url TEXT,
    sales_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
);

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

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id INT REFERENCES addresses(id) ON DELETE SET NULL,
    billing_address_id INT REFERENCES addresses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS return_requests (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    UNIQUE(order_item_id)
);

-- Saved payment cards. The full card number is stored AES-256-GCM encrypted
-- (see server/utils/cardCrypto.js). CVV is NEVER stored (PCI-DSS).
CREATE TABLE IF NOT EXISTS payment_cards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cardholder_name VARCHAR(255) NOT NULL,
    card_number_encrypted TEXT NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    card_brand VARCHAR(20),
    expiry_month INT NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_address TEXT;

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD CONSTRAINT fk_category FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE SET NULL;
