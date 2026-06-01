-- =============================================
-- LUMIÈRE / Ajabu Lighting — Admin activity log
-- =============================================
-- A single audit feed of actions across the admin dashboard. Captured with
-- AFTER triggers so it records changes no matter where they originate
-- (client-side Supabase calls, server routes, etc.). The acting user is taken
-- from auth.uid() (the logged-in admin); service-role actions show as "System".

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL,            -- insert | update | delete
  entity_type TEXT NOT NULL,       -- table name (products, orders, ...)
  entity_id TEXT,
  summary TEXT NOT NULL,           -- human-readable line for the feed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- Staff can read the feed; rows are written by the SECURITY DEFINER trigger only.
DROP POLICY IF EXISTS "Staff can read activity log" ON activity_log;
CREATE POLICY "Staff can read activity log" ON activity_log FOR SELECT USING (is_staff());

-- Generic logger -----------------------------------------------------------
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_actor_name TEXT;
  rec RECORD;
  v_data JSONB;
  v_verb TEXT;
  v_summary TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN rec := OLD; ELSE rec := NEW; END IF;
  v_data := to_jsonb(rec);
  v_verb := CASE TG_OP
              WHEN 'INSERT' THEN 'created'
              WHEN 'UPDATE' THEN 'updated'
              WHEN 'DELETE' THEN 'deleted'
            END;

  SELECT full_name INTO v_actor_name FROM profiles WHERE id = v_actor;

  v_summary := CASE TG_TABLE_NAME
    WHEN 'products'         THEN 'Product "' || COALESCE(v_data->>'name','') || '" ' || v_verb
    WHEN 'coupons'          THEN 'Coupon "' || COALESCE(v_data->>'code','') || '" ' || v_verb
    WHEN 'categories'       THEN 'Category "' || COALESCE(v_data->>'name','') || '" ' || v_verb
    WHEN 'store_settings'   THEN 'Setting "' || COALESCE(v_data->>'key','') || '" updated'
    WHEN 'orders'           THEN CASE WHEN TG_OP = 'INSERT'
                                      THEN 'New order ' || COALESCE(v_data->>'order_number','')
                                      ELSE 'Order ' || COALESCE(v_data->>'order_number','') || ' → ' || COALESCE(v_data->>'status','') END
    WHEN 'profiles'         THEN 'Role of ' || COALESCE(v_data->>'email','') || ' set to ' || COALESCE(v_data->>'role','')
    WHEN 'crm_deals'        THEN 'Deal "' || COALESCE(v_data->>'title','') || '" ' || v_verb
    WHEN 'crm_tasks'        THEN 'Task "' || COALESCE(v_data->>'title','') || '" ' || v_verb
    WHEN 'crm_contacts'     THEN 'Contact "' || COALESCE(v_data->>'full_name','') || '" ' || v_verb
    WHEN 'crm_interactions' THEN COALESCE(NULLIF(v_data->>'subject',''), initcap(COALESCE(v_data->>'type','note')) || ' logged')
    ELSE initcap(TG_TABLE_NAME) || ' ' || v_verb
  END;

  INSERT INTO activity_log (actor_id, actor_name, action, entity_type, entity_id, summary)
  VALUES (v_actor, COALESCE(v_actor_name, 'System'), lower(TG_OP), TG_TABLE_NAME, COALESCE(v_data->>'id',''), v_summary);

  RETURN rec;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers (idempotent) --------------------------------------------
-- Products: log create/delete always; update only for meaningful edits
-- (NOT bare stock decrements that happen on every sale).
DROP TRIGGER IF EXISTS log_products ON products;
CREATE TRIGGER log_products
  AFTER INSERT OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_activity();
DROP TRIGGER IF EXISTS log_products_update ON products;
CREATE TRIGGER log_products_update
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name
     OR OLD.base_price IS DISTINCT FROM NEW.base_price
     OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
     OR OLD.is_active IS DISTINCT FROM NEW.is_active
     OR OLD.is_featured IS DISTINCT FROM NEW.is_featured)
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_coupons ON coupons;
CREATE TRIGGER log_coupons
  AFTER INSERT OR UPDATE OR DELETE ON coupons
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_categories ON categories;
CREATE TRIGGER log_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Settings: only when a value actually changes (the form upserts every key).
DROP TRIGGER IF EXISTS log_settings ON store_settings;
CREATE TRIGGER log_settings
  AFTER INSERT ON store_settings
  FOR EACH ROW EXECUTE FUNCTION log_activity();
DROP TRIGGER IF EXISTS log_settings_update ON store_settings;
CREATE TRIGGER log_settings_update
  AFTER UPDATE ON store_settings
  FOR EACH ROW WHEN (OLD.value IS DISTINCT FROM NEW.value)
  EXECUTE FUNCTION log_activity();

-- Orders: new orders + status changes only.
DROP TRIGGER IF EXISTS log_orders_new ON orders;
CREATE TRIGGER log_orders_new
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION log_activity();
DROP TRIGGER IF EXISTS log_orders_status ON orders;
CREATE TRIGGER log_orders_status
  AFTER UPDATE ON orders
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_activity();

-- Profiles: role changes only.
DROP TRIGGER IF EXISTS log_profiles_role ON profiles;
CREATE TRIGGER log_profiles_role
  AFTER UPDATE ON profiles
  FOR EACH ROW WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_activity();

-- CRM.
DROP TRIGGER IF EXISTS log_crm_deals ON crm_deals;
CREATE TRIGGER log_crm_deals
  AFTER INSERT OR UPDATE OR DELETE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_crm_tasks ON crm_tasks;
CREATE TRIGGER log_crm_tasks
  AFTER INSERT OR UPDATE OR DELETE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Contacts: create/delete only (they get auto-updated on every order).
DROP TRIGGER IF EXISTS log_crm_contacts ON crm_contacts;
CREATE TRIGGER log_crm_contacts
  AFTER INSERT OR DELETE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_crm_interactions ON crm_interactions;
CREATE TRIGGER log_crm_interactions
  AFTER INSERT ON crm_interactions
  FOR EACH ROW EXECUTE FUNCTION log_activity();
