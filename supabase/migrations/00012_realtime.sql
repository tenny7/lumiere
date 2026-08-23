-- Enable Supabase Realtime (postgres_changes) for admin notifications:
-- new orders, new reviews, and new support messages. RLS still applies — only
-- admins (is_admin) receive these via their SELECT policies.
-- Idempotent: ignore if a table is already in the publication.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
