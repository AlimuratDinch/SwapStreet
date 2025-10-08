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
('Classic White T-Shirt', 'Soft cotton t-shirt perfect for everyday wear. Size M.', 'Used', 15.99, 'https://sewguide.com/wp-content/uploads/2025/02/CLOTHES.jpg', 1),
('Denim Jeans', 'Slim-fit blue jeans with stretch for comfort.', 'Like New', 29.99, 'https://sewguide.com/wp-content/uploads/2025/03/types-of-clothing-names.jpg', 2),
('Leather Belt', 'Brown leather belt with adjustable buckle.', 'New', 19.99, 'https://promova.com/content/items_of_clothing_2a8d8968a1.png', 3),
('Canvas Backpack', 'Durable portable backpack for daily use.', 'Used', 25.00, 'https://i.etsystatic.com/9735236/r/il/fbb6a2/5040643698/il_570xN.5040643698_8n4h.jpg', 4),
('Discounted Hoodie', 'Cozy fleece hoodie on sale. Warm and casual.', 'New', 22.50, 'https://www.easypacelearning.com/design/images/content/clothesvocabulary.jpg', 5),
('Striped Blouse', 'Lightweight striped blouse for office or outings. Size S.', 'Like New', 18.99, 'https://theeleganceedit.com/wp-content/uploads/2024/02/Casual-Capsule-Wardrobe.webp', 1),
('Cargo Pants', 'Practical cargo pants with multiple pockets.', 'Used', 27.50, 'https://www.shutterstock.com/image-vector/fashion-clothes-set-garment-accessory-260nw-2155232397.jpg', 2),
('Sunglasses', 'Polarized sunglasses for sun protection.', 'New', 14.99, 'https://mrmrsenglish.com/wp-content/uploads/2024/07/Mens-Clothes-and-Accessories-1-810x424.png.webp', 3),
('Messenger Bag', 'Compact portable messenger bag in black.', 'Used', 30.00, 'https://mrmrsenglish.com/wp-content/uploads/2025/06/Clothing-Items-Names-in-English-with-their-Pictures-1-810x424.png.webp', 4),
('Sale Polo Shirt', 'Breathable polo shirt at a reduced price.', 'New', 12.99, 'http://mrmrsenglish.com/wp-content/uploads/2025/06/Clothing-items-names-in-English-with-their-pictures.png.webp', 5),
('Knit Sweater', 'Warm knit sweater in neutral tones.', 'Like New', 24.99, 'https://www.studiosuits.com/cdn/shop/articles/accessorize_01_1100x.jpg?v=1724841582', 1),
('Chino Shorts', 'Casual chino shorts for summer.', 'Used', 17.50, 'https://www.topsandbottomsusa.com/cdn/shop/files/mob_banner_pellepelle_db7d2235-5d1c-44ab-a29d-d776f39148fc.webp?v=1759785050', 2),
('Wristwatch', 'Stylish analog wristwatch with leather strap.', 'New', 49.99, 'https://d3n78nkjl8tizo.cloudfront.net/stitch-fix/image/upload/f_auto,q_auto/v1758303582/landing-pages/pages/US/gateway/FY26-Q1-Gateway/Gateway_FY26Q1_hero_mob_01.jpg', 3),
('Tote Bag', 'Spacious portable tote bag made from canvas.', 'Like New', 22.00, 'https://d3n78nkjl8tizo.cloudfront.net/stitch-fix/image/upload/f_auto,q_auto/v1759517448/landing-pages/pages/US/men/FY26-Q1-Men-Fall/1_M_hero_2.jpg', 4),
('Discounted Jacket', 'Lightweight jacket on sale.', 'New', 39.99, 'https://www.topsandbottomsusa.com/cdn/shop/files/0001_topsandbottoms_1757983799_3722560242959246389_207748995_1459226e-ae7b-49fb-9899-4d1454346447.jpg?v=1759174733', 5),
('Crop Top', 'Trendy crop top in black.', 'Used', 14.50, 'https://m.media-amazon.com/images/I/51gwSOxeblL._UY1000_.jpg', 1),
('Sweatpants', 'Relaxed sweatpants for lounging or workouts.', 'Like New', 19.99, 'https://i5.walmartimages.com/asr/b5b17775-59d0-4a08-af15-3406c80b36db.9c508d0bd24268456c2904dacd9e9660.jpeg', 2),
('Scarf', 'Soft wool scarf for added warmth.', 'New', 12.99, 'https://www.tillys.com/on/demandware.static/-/Library-Sites-AutobahnSharedLibrary/default/dw44805f2d/images/homepage/landing/home-tile-the-wild-collective-mobile-09-29-25.jpg', 3),
('Laptop Sleeve', 'Protective portable sleeve for laptops.', 'Used', 15.00, 'https://thenormalbrand.com/cdn/shop/files/Multicolumn-Template_A_4c292f2f-aaef-45f2-9da2-022ae7f31692.jpg?v=1759197569', 4),
('Sale Skirt', 'Flowy skirt at a discount.', 'New', 18.99, 'https://d3n78nkjl8tizo.cloudfront.net/stitch-fix/image/upload/f_auto,q_auto/v1759517448/landing-pages/pages/US/men/FY26-Q1-Men-Fall/1_M_hero_1.jpg', 5);
