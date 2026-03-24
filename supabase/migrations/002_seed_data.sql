-- ============================================
-- AKUSTİK KAFE - SEED DATA
-- ============================================

-- ============================================
-- 1. CATEGORIES
-- ============================================

INSERT INTO categories (name, display_order, is_active) VALUES
    ('İçecekler', 1, true),
    ('Kahveler', 2, true),
    ('Yiyecekler', 3, true),
    ('Tatlılar', 4, true);

-- ============================================
-- 2. PRODUCTS
-- ============================================

-- İçecekler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Su',
    '0.5L Su',
    15.00,
    true,
    1
FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Ayran',
    'Ev yapımı ayran',
    25.00,
    true,
    2
FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Kola',
    '330ml',
    35.00,
    true,
    3
FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Fanta',
    '330ml',
    35.00,
    true,
    4
FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Çay',
    'Demlik çay',
    20.00,
    true,
    5
FROM categories WHERE name = 'İçecekler';

-- Kahveler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Americano',
    'Sıcak/Soğuk',
    45.00,
    true,
    1
FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Latte',
    'Sıcak/Soğuk',
    50.00,
    true,
    2
FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Cappuccino',
    'Sıcak',
    50.00,
    true,
    3
FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Filtre Kahve',
    'V60 Pour Over',
    40.00,
    true,
    4
FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Türk Kahvesi',
    'Sade/Şekerli/Orta',
    35.00,
    true,
    5
FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Espresso',
    'Single/Double',
    35.00,
    true,
    6
FROM categories WHERE name = 'Kahveler';

-- Yiyecekler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Croissant',
    'Tereyağlı',
    35.00,
    true,
    1
FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Tost',
    'Kaşarlı/Karışık',
    40.00,
    true,
    2
FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Sandviç',
    'Tavuk/Ton Balıklı',
    55.00,
    true,
    3
FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Waffle',
    'Çikolata/Meyve Soslu',
    60.00,
    true,
    4
FROM categories WHERE name = 'Yiyecekler';

-- Tatlılar
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Cheesecake',
    'Klasik',
    65.00,
    true,
    1
FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Brownie',
    'Çikolatalı',
    55.00,
    true,
    2
FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Magnolia',
    'Çilekli/Muzlu',
    60.00,
    true,
    3
FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT
    id,
    'Tiramisu',
    'İtalyan tatlısı',
    70.00,
    true,
    4
FROM categories WHERE name = 'Tatlılar';

-- ============================================
-- 3. TABLES (Masalar)
-- ============================================

INSERT INTO tables (table_number, capacity, status) VALUES
    ('1', 2, 'available'),
    ('2', 2, 'available'),
    ('3', 4, 'available'),
    ('4', 4, 'available'),
    ('5', 4, 'available'),
    ('6', 6, 'available'),
    ('7', 2, 'available'),
    ('8', 2, 'available'),
    ('9', 4, 'available'),
    ('10', 6, 'available');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SEED DATA INSERTED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Data inserted:';
    RAISE NOTICE '  - 4 categories';
    RAISE NOTICE '  - 22 products';
    RAISE NOTICE '  - 10 tables';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Create your first admin user';
    RAISE NOTICE '========================================';
END $$;
