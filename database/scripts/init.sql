-- Create all the required tables for the application
-- scripts/init.sql
-- Note: EF Core migrations will create the tables, this is just for reference

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    condition VARCHAR(50),
    price DECIMAL(10, 2),
    image_url VARCHAR(512),
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial categories (will be inserted after EF migrations run)
-- These INSERT statements will fail if data already exists, which is fine
DO $$
BEGIN
    -- Only insert if categories table is empty
    IF NOT EXISTS (SELECT 1 FROM categories LIMIT 1) THEN
        INSERT INTO categories (name) VALUES
        ('Tops'),
        ('Bottoms'),
        ('Accessories'),
        ('Portables'),
        ('Sale');
    END IF;
END $$;