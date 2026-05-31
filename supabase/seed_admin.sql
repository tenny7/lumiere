-- =============================================
-- Seed Admin User for Lumiere
-- =============================================
-- Run this AFTER setting up Supabase Auth.
--
-- Option 1: Create the user via Supabase Dashboard > Authentication > Users > Add User
--   Email: admin@lumiere.com
--   Password: LumiereAdmin2026!
--   Then run the UPDATE below to set role to admin.
--
-- Option 2: If using Supabase CLI with local dev:
--   The trigger auto-creates a profile on signup.
--   After creating the user, update the role:

-- After creating the admin user through Supabase Auth (Dashboard or CLI),
-- run this to promote them to admin:
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@lumiere.com';

-- Alternatively, if you know the user's UUID after creation:
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid-here';
