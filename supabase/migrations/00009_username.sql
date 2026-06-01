-- =============================================
-- Ajabu Lighting — usernames (short display name)
-- =============================================
-- Emails are long; add an optional username used for display across the app.
-- Login still uses email. Activity log prefers the username for the actor label.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
-- Unique when set (multiple NULLs allowed).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles (lower(username)) WHERE username IS NOT NULL;

-- Re-create the activity logger so the actor shows username (then full_name).
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

  SELECT COALESCE(username, full_name) INTO v_actor_name FROM profiles WHERE id = v_actor;

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
