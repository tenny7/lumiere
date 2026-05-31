-- =============================================
-- LUMIÈRE Ecommerce — Initial Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM (
  'customer', 'sales_agent', 'inventory_manager', 'admin', 'super_admin'
);

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

CREATE TYPE payment_provider AS ENUM (
  'momo_mtn', 'momo_vodafone', 'momo_airteltigo', 'manual'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'successful', 'failed', 'refunded'
);

CREATE TYPE coupon_type AS ENUM (
  'percentage', 'fixed_amount', 'free_shipping'
);

CREATE TYPE crm_contact_source AS ENUM (
  'website', 'walk_in', 'referral', 'social_media', 'import'
);

CREATE TYPE crm_contact_status AS ENUM (
  'lead', 'prospect', 'active_customer', 'churned', 'vip'
);

CREATE TYPE crm_interaction_type AS ENUM (
  'note', 'call', 'email', 'sms', 'meeting', 'order', 'complaint', 'follow_up'
);

CREATE TYPE crm_task_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);

CREATE TYPE crm_task_status AS ENUM (
  'todo', 'in_progress', 'done', 'cancelled'
);

CREATE TYPE crm_deal_status AS ENUM (
  'open', 'won', 'lost'
);

-- =============================================
-- PROFILES
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =============================================
-- ADDRESSES
-- =============================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'home',
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'Rwanda',
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_profile ON addresses(profile_id);

-- =============================================
-- CATEGORIES
-- =============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =============================================
-- PRODUCTS
-- =============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'RWF',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  weight DECIMAL(8,2),
  dimensions JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- =============================================
-- PRODUCT IMAGES
-- =============================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- =============================================
-- PRODUCT VARIANTS
-- =============================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- =============================================
-- COUPONS (must be before orders since orders references it)
-- =============================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  type coupon_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- =============================================
-- ORDERS
-- =============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  shipping_address JSONB NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- =============================================
-- ORDER ITEMS
-- =============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  provider_reference TEXT,
  phone_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  status payment_status NOT NULL DEFAULT 'pending',
  provider_metadata JSONB DEFAULT '{}',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(provider_reference);

-- =============================================
-- WISHLISTS
-- =============================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, product_id)
);

CREATE INDEX idx_wishlists_profile ON wishlists(profile_id);

-- =============================================
-- REVIEWS
-- =============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, profile_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);

-- =============================================
-- CART (persistent for logged-in users)
-- =============================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_profile ON cart_items(profile_id);

-- =============================================
-- CRM: CONTACTS
-- =============================================

CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source crm_contact_source NOT NULL DEFAULT 'website',
  status crm_contact_status NOT NULL DEFAULT 'lead',
  lifetime_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  assigned_agent_id UUID REFERENCES profiles(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_agent ON crm_contacts(assigned_agent_id);

-- =============================================
-- CRM: INTERACTIONS
-- =============================================

CREATE TABLE crm_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id),
  type crm_interaction_type NOT NULL,
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_interactions_contact ON crm_interactions(contact_id);
CREATE INDEX idx_crm_interactions_created ON crm_interactions(created_at DESC);

-- =============================================
-- CRM: TASKS
-- =============================================

CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority crm_task_priority NOT NULL DEFAULT 'medium',
  status crm_task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);

-- =============================================
-- CRM: PIPELINES & DEALS
-- =============================================

CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id),
  title TEXT NOT NULL,
  value DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'RWF',
  stage TEXT NOT NULL,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID REFERENCES profiles(id),
  status crm_deal_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_pipeline ON crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_status ON crm_deals(status);

-- =============================================
-- STORE SETTINGS
-- =============================================

CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STOCK DECREMENT FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM orders
  WHERE created_at::DATE = CURRENT_DATE;

  NEW.order_number := 'LUM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-create CRM contact on first order
CREATE OR REPLACE FUNCTION auto_create_crm_contact()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crm_contacts (profile_id, full_name, email, phone, source, status)
  SELECT p.id, p.full_name, p.email, p.phone, 'website', 'active_customer'
  FROM profiles p
  WHERE p.id = NEW.customer_id
  ON CONFLICT DO NOTHING;

  -- Update lifetime value
  UPDATE crm_contacts
  SET lifetime_value = lifetime_value + NEW.total,
      total_orders = total_orders + 1,
      status = CASE WHEN total_orders + 1 >= 5 THEN 'vip' ELSE status END
  WHERE profile_id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_create_crm AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION auto_create_crm_contact();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin/super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user is staff (any non-customer role)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role != 'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Staff can read all profiles" ON profiles FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage profiles" ON profiles FOR ALL USING (is_admin());

-- ADDRESSES
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage addresses" ON addresses FOR ALL USING (is_admin());

-- CATEGORIES (public read, admin write)
CREATE POLICY "Anyone can read active categories" ON categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin can manage categories" ON categories FOR ALL USING (is_admin());

-- PRODUCTS (public read active, admin full)
CREATE POLICY "Anyone can read active products" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Staff can read all products" ON products FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (is_admin());

-- PRODUCT IMAGES
CREATE POLICY "Anyone can read product images" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage product images" ON product_images FOR ALL USING (is_admin());

-- PRODUCT VARIANTS
CREATE POLICY "Anyone can read variants" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage variants" ON product_variants FOR ALL USING (is_admin());

-- ORDERS
CREATE POLICY "Customers read own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Staff can read all orders" ON orders FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage orders" ON orders FOR ALL USING (is_admin());

-- ORDER ITEMS
CREATE POLICY "Customers read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customers create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Staff can read all order items" ON order_items FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage order items" ON order_items FOR ALL USING (is_admin());

-- COUPONS
CREATE POLICY "Anyone can read active coupons" ON coupons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin can manage coupons" ON coupons FOR ALL USING (is_admin());

-- PAYMENTS
CREATE POLICY "Customers read own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Staff can read all payments" ON payments FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage payments" ON payments FOR ALL USING (is_admin());

-- WISHLISTS
CREATE POLICY "Users manage own wishlist" ON wishlists FOR ALL USING (profile_id = auth.uid());

-- REVIEWS
CREATE POLICY "Anyone can read approved reviews" ON reviews FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Users manage own reviews" ON reviews FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Admin can manage reviews" ON reviews FOR ALL USING (is_admin());

-- CART
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (profile_id = auth.uid());

-- CRM (staff only)
CREATE POLICY "Staff can read CRM contacts" ON crm_contacts FOR SELECT USING (is_staff());
CREATE POLICY "Staff can manage CRM contacts" ON crm_contacts FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage CRM interactions" ON crm_interactions FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage CRM tasks" ON crm_tasks FOR ALL USING (is_staff());
CREATE POLICY "Staff can read CRM pipelines" ON crm_pipelines FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage CRM pipelines" ON crm_pipelines FOR ALL USING (is_admin());
CREATE POLICY "Staff can manage CRM deals" ON crm_deals FOR ALL USING (is_staff());

-- STORE SETTINGS
CREATE POLICY "Anyone can read settings" ON store_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage settings" ON store_settings FOR ALL USING (is_admin());

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Chandeliers', 'chandeliers', 'Elegant chandeliers for dining rooms, foyers, and grand spaces', 1),
  ('Pendant Lights', 'pendant-lights', 'Hanging pendant lights for kitchens, islands, and accent lighting', 2),
  ('Table Lamps', 'table-lamps', 'Desk and bedside table lamps for task and ambient lighting', 3),
  ('Floor Lamps', 'floor-lamps', 'Standing floor lamps for living rooms and reading corners', 4),
  ('Wall Sconces', 'wall-sconces', 'Wall-mounted fixtures for hallways, bathrooms, and accent walls', 5),
  ('Ceiling Lights', 'ceiling-lights', 'Flush and semi-flush mount ceiling fixtures', 6),
  ('Outdoor Lighting', 'outdoor-lighting', 'Weather-resistant lights for gardens, pathways, and facades', 7),
  ('Smart Lights', 'smart-lights', 'WiFi and Bluetooth enabled smart lighting solutions', 8),
  ('LED Strips', 'led-strips', 'Flexible LED strip lights for accent and under-cabinet lighting', 9),
  ('Recessed Lighting', 'recessed-lighting', 'Built-in downlights and spotlights for clean, modern looks', 10),
  ('Track Lighting', 'track-lighting', 'Adjustable track systems for galleries and retail spaces', 11),
  ('Decorative Bulbs', 'decorative-bulbs', 'Vintage Edison bulbs and designer filament bulbs', 12);

INSERT INTO crm_pipelines (name, stages) VALUES
  ('Sales Pipeline', '[{"name": "Inquiry", "order": 1}, {"name": "Quote Sent", "order": 2}, {"name": "Negotiation", "order": 3}, {"name": "Closed Won", "order": 4}, {"name": "Closed Lost", "order": 5}]'),
  ('Interior Designer Leads', '[{"name": "Initial Contact", "order": 1}, {"name": "Project Brief", "order": 2}, {"name": "Product Selection", "order": 3}, {"name": "Bulk Order", "order": 4}, {"name": "Completed", "order": 5}]');

INSERT INTO store_settings (key, value) VALUES
  ('store_name', '"Lumière"'),
  ('store_currency', '"RWF"'),
  ('store_tax_rate', '0'),
  ('free_shipping_threshold', '150'),
  ('delivery_fee', '25'),
  ('store_phone', '"+233 XX XXX XXXX"'),
  ('store_email', '"hello@lumiere.com"'),
  ('store_address', '{"line_1": "KG 7 Ave", "city": "Kigali", "region": "Kigali", "country": "Rwanda"}');

-- =============================================
-- SEED: Sample products for the lighting store
-- =============================================

INSERT INTO products (name, slug, description, category_id, sku, base_price, sale_price, stock_quantity, is_active, is_featured, metadata) VALUES
  ('Aurora Crystal Chandelier', 'aurora-crystal-chandelier', 'A stunning crystal chandelier with cascading prisms that cast rainbow reflections across any room. Perfect for dining rooms and grand foyers.', (SELECT id FROM categories WHERE slug = 'chandeliers'), 'LUM-CH-001', 850.00, 749.00, 8, TRUE, TRUE, '{"wattage": "60W x 8", "lumens": "4800", "color_temperature": "3000K", "material": "Crystal, Brass", "diameter": "80cm", "height": "60cm"}'),
  ('Midnight Brass Pendant', 'midnight-brass-pendant', 'Sleek matte black pendant with brushed brass interior. Casts a warm, focused downlight ideal for kitchen islands.', (SELECT id FROM categories WHERE slug = 'pendant-lights'), 'LUM-PL-001', 280.00, NULL, 24, TRUE, TRUE, '{"wattage": "40W", "lumens": "600", "color_temperature": "2700K", "material": "Steel, Brass", "diameter": "30cm"}'),
  ('Nova Smart Bulb (4-pack)', 'nova-smart-bulb-4pack', '16 million color WiFi smart bulbs compatible with Google Home and Alexa. Set schedules, scenes, and control from anywhere.', (SELECT id FROM categories WHERE slug = 'smart-lights'), 'LUM-SL-001', 120.00, 99.00, 50, TRUE, TRUE, '{"wattage": "9W each", "lumens": "800 each", "color_temperature": "2700K-6500K", "connectivity": "WiFi 2.4GHz", "compatibility": "Google Home, Alexa, SmartThings"}'),
  ('Ember Floor Lamp', 'ember-floor-lamp', 'Minimalist arc floor lamp with a linen drum shade. Adjustable height with a weighted marble base for stability.', (SELECT id FROM categories WHERE slug = 'floor-lamps'), 'LUM-FL-001', 420.00, NULL, 15, TRUE, FALSE, '{"wattage": "60W", "lumens": "800", "color_temperature": "3000K", "material": "Steel, Marble, Linen", "height": "160-185cm"}'),
  ('Opal Table Lamp', 'opal-table-lamp', 'Hand-blown opal glass table lamp on a walnut base. Emits a soft, diffused glow perfect for bedside reading.', (SELECT id FROM categories WHERE slug = 'table-lamps'), 'LUM-TL-001', 195.00, NULL, 32, TRUE, FALSE, '{"wattage": "40W", "lumens": "450", "color_temperature": "2700K", "material": "Glass, Walnut", "height": "45cm"}'),
  ('Horizon LED Strip (5m)', 'horizon-led-strip-5m', 'RGBW flexible LED strip with adhesive backing. Cut-to-size with wireless remote and app control.', (SELECT id FROM categories WHERE slug = 'led-strips'), 'LUM-LS-001', 85.00, 69.00, 60, TRUE, TRUE, '{"wattage": "24W", "lumens": "1200", "color_temperature": "RGB + 4000K White", "length": "5m", "ip_rating": "IP44"}'),
  ('Terrace Solar Path Lights (6-pack)', 'terrace-solar-path-lights', 'Stainless steel solar-powered path lights. Auto on at dusk, 8-hour runtime. No wiring needed.', (SELECT id FROM categories WHERE slug = 'outdoor-lighting'), 'LUM-OL-001', 145.00, NULL, 20, TRUE, FALSE, '{"lumens": "15 each", "runtime": "8 hours", "material": "Stainless Steel", "ip_rating": "IP65", "solar_panel": "Polycrystalline"}'),
  ('Deco Sconce Pair', 'deco-sconce-pair', 'Art deco inspired wall sconces in antique gold. Sold as a pair with frosted glass shades.', (SELECT id FROM categories WHERE slug = 'wall-sconces'), 'LUM-WS-001', 310.00, 275.00, 12, TRUE, FALSE, '{"wattage": "40W x 2", "lumens": "400 each", "color_temperature": "2700K", "material": "Metal, Frosted Glass", "projection": "18cm"}'),
  ('Slim Recessed Downlight (4-pack)', 'slim-recessed-downlight-4pack', 'Ultra-thin 12cm LED recessed panels. Flicker-free with 120-degree beam angle. Easy retrofit installation.', (SELECT id FROM categories WHERE slug = 'recessed-lighting'), 'LUM-RL-001', 160.00, NULL, 40, TRUE, FALSE, '{"wattage": "12W each", "lumens": "1000 each", "color_temperature": "4000K", "cutout": "12cm", "ip_rating": "IP44"}'),
  ('Accent Track System (3-head)', 'accent-track-system-3head', 'Adjustable 3-head track lighting system. Rotate and swivel each head independently. Ideal for galleries and retail.', (SELECT id FROM categories WHERE slug = 'track-lighting'), 'LUM-TK-001', 230.00, NULL, 18, TRUE, FALSE, '{"wattage": "7W x 3", "lumens": "500 each", "color_temperature": "3000K", "track_length": "100cm", "material": "Aluminum"}'),
  ('Edison Vintage Bulb (3-pack)', 'edison-vintage-bulb-3pack', 'ST64 amber glass filament bulbs with warm 2200K glow. Perfect for exposed fixtures and pendant setups.', (SELECT id FROM categories WHERE slug = 'decorative-bulbs'), 'LUM-DB-001', 55.00, 45.00, 100, TRUE, FALSE, '{"wattage": "4W each", "lumens": "300 each", "color_temperature": "2200K", "base": "E27", "lifetime": "15000 hours"}'),
  ('Celestial Flush Mount', 'celestial-flush-mount', 'Starlight-effect flush mount ceiling light with embedded crystal points. Creates a dazzling constellation pattern.', (SELECT id FROM categories WHERE slug = 'ceiling-lights'), 'LUM-CL-001', 375.00, NULL, 10, TRUE, TRUE, '{"wattage": "36W", "lumens": "2400", "color_temperature": "4000K", "material": "Crystal, Chrome", "diameter": "50cm"}');
