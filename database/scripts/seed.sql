-- Seed the database with initial data

-- Clear existing data
TRUNCATE items, categories RESTART IDENTITY;

-- Insert categories
INSERT INTO categories (name) VALUES
('Tops'),
('Bottoms'),
('Accessories'),
('Portables'),
('Sale');

-- Insert items
INSERT INTO items (title, description, condition, price, image_url, category_id) VALUES
('Classic White T-Shirt', 'Soft cotton t-shirt perfect for everyday wear. Size M.', 'Used', 15.99, '/images/clothes_login_page.png', 1),
('Denim Jeans', 'Slim-fit blue jeans with stretch for comfort.', 'Like New', 29.99, '/images/clothes_login_page.png', 2),
('Leather Belt', 'Brown leather belt with adjustable buckle.', 'New', 19.99, '/images/clothes_login_page.png', 3),
('Canvas Backpack', 'Durable portable backpack for daily use.', 'Used', 25.00, '/images/clothes_login_page.png', 4),
('Discounted Hoodie', 'Cozy fleece hoodie on sale. Warm and casual.', 'New', 22.50, '/images/clothes_login_page.png', 5),
('Striped Blouse', 'Lightweight striped blouse for office or outings. Size S.', 'Like New', 18.99, '/images/clothes_login_page.png', 1),
('Cargo Pants', 'Practical cargo pants with multiple pockets.', 'Used', 27.50, '/images/clothes_login_page.png', 2),
('Sunglasses', 'Polarized sunglasses for sun protection.', 'New', 14.99, '/images/clothes_login_page.png', 3),
('Messenger Bag', 'Compact portable messenger bag in black.', 'Used', 30.00, '/images/clothes_login_page.png', 4),
('Sale Polo Shirt', 'Breathable polo shirt at a reduced price.', 'New', 12.99, '/images/clothes_login_page.png', 5),
('Knit Sweater', 'Warm knit sweater in neutral tones.', 'Like New', 24.99, '/images/clothes_login_page.png', 1),
('Chino Shorts', 'Casual chino shorts for summer.', 'Used', 17.50, '/images/clothes_login_page.png', 2),
('Wristwatch', 'Stylish analog wristwatch with leather strap.', 'New', 49.99, '/images/clothes_login_page.png', 3),
('Tote Bag', 'Spacious portable tote bag made from canvas.', 'Like New', 22.00, '/images/clothes_login_page.png', 4),
('Discounted Jacket', 'Lightweight jacket on sale.', 'New', 39.99, '/images/clothes_login_page.png', 5),
('Crop Top', 'Trendy crop top in black.', 'Used', 14.50, '/images/clothes_login_page.png', 1),
('Sweatpants', 'Relaxed sweatpants for lounging or workouts.', 'Like New', 19.99, '/images/clothes_login_page.png', 2),
('Scarf', 'Soft wool scarf for added warmth.', 'New', 12.99, '/images/clothes_login_page.png', 3),
('Laptop Sleeve', 'Protective portable sleeve for laptops.', 'Used', 15.00, '/images/clothes_login_page.png', 4),
('Sale Skirt', 'Flowy skirt at a discount.', 'New', 18.99, '/images/clothes_login_page.png', 5);