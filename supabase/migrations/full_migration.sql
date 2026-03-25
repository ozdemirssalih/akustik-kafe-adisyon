-- ============================================
-- AKUSTİK KAFE ADİSYON - FULL MIGRATION
-- Birleşik: 001 + 002 + 003
-- ============================================

-- ============================================
-- 001_initial_schema.sql
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'waiter');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'waiter',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLES (Masalar)
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status table_status NOT NULL DEFAULT 'available',
    position_x INTEGER,
    position_y INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDERS
CREATE TYPE order_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'split');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
    waiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'open',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method payment_method,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDER_ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_orders_opened_at ON orders(opened_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tables policies
CREATE POLICY "Everyone can view tables"
    ON tables FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tables"
    ON tables FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Authenticated users can update tables"
    ON tables FOR UPDATE
    TO authenticated
    USING (true);

-- Categories policies
CREATE POLICY "Everyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products policies
CREATE POLICY "Everyone can view products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies
CREATE POLICY "Users can view orders"
    ON orders FOR SELECT
    USING (true);

CREATE POLICY "Waiters can create orders"
    ON orders FOR INSERT
    WITH CHECK (
        auth.uid() = waiter_id
    );

CREATE POLICY "Waiters can update own orders"
    ON orders FOR UPDATE
    USING (
        auth.uid() = waiter_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'cashier')
        )
    );

-- Order items policies
CREATE POLICY "Users can view order items"
    ON order_items FOR SELECT
    USING (true);

CREATE POLICY "Users can manage order items for open orders"
    ON order_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.status = 'open'
            AND (orders.waiter_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cashier')))
        )
    );

-- ============================================
-- 002_seed_data.sql
-- ============================================

INSERT INTO categories (name, display_order, is_active) VALUES
    ('İçecekler', 1, true),
    ('Kahveler', 2, true),
    ('Yiyecekler', 3, true),
    ('Tatlılar', 4, true);

-- İçecekler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Su', '0.5L Su', 15.00, true, 1 FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Ayran', 'Ev yapımı ayran', 25.00, true, 2 FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Kola', '330ml', 35.00, true, 3 FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Fanta', '330ml', 35.00, true, 4 FROM categories WHERE name = 'İçecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Çay', 'Demlik çay', 20.00, true, 5 FROM categories WHERE name = 'İçecekler';

-- Kahveler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Americano', 'Sıcak/Soğuk', 45.00, true, 1 FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Latte', 'Sıcak/Soğuk', 50.00, true, 2 FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Cappuccino', 'Sıcak', 50.00, true, 3 FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Filtre Kahve', 'V60 Pour Over', 40.00, true, 4 FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Türk Kahvesi', 'Sade/Şekerli/Orta', 35.00, true, 5 FROM categories WHERE name = 'Kahveler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Espresso', 'Single/Double', 35.00, true, 6 FROM categories WHERE name = 'Kahveler';

-- Yiyecekler
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Croissant', 'Tereyağlı', 35.00, true, 1 FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Tost', 'Kaşarlı/Karışık', 40.00, true, 2 FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Sandviç', 'Tavuk/Ton Balıklı', 55.00, true, 3 FROM categories WHERE name = 'Yiyecekler';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Waffle', 'Çikolata/Meyve Soslu', 60.00, true, 4 FROM categories WHERE name = 'Yiyecekler';

-- Tatlılar
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Cheesecake', 'Klasik', 65.00, true, 1 FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Brownie', 'Çikolatalı', 55.00, true, 2 FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Magnolia', 'Çilekli/Muzlu', 60.00, true, 3 FROM categories WHERE name = 'Tatlılar';

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT id, 'Tiramisu', 'İtalyan tatlısı', 70.00, true, 4 FROM categories WHERE name = 'Tatlılar';

-- Masalar
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
-- 003_payments_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  cash_amount DECIMAL(10,2) DEFAULT 0,
  card_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE payments IS 'Stores payment transaction records for orders';
