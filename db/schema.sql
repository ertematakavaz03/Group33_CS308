CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,      
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