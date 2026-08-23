-- Save the phone number captured at signup (auth metadata) into profiles.phone.
-- The original handle_new_user() only copied full_name/email, so phone was lost
-- and checkout couldn't prefill it.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill phone for existing users whose profile has none but whose signup
-- metadata captured one.
UPDATE profiles p
SET phone = NULLIF(u.raw_user_meta_data->>'phone', '')
FROM auth.users u
WHERE u.id = p.id
  AND (p.phone IS NULL OR p.phone = '')
  AND NULLIF(u.raw_user_meta_data->>'phone', '') IS NOT NULL;
