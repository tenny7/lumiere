-- Eagle admin: the site maintainer's account (website, codebase, database).
--
-- An Eagle admin is a super admin that nobody can demote, block or delete
-- from the website. That covers other admins and super admins in the browser,
-- and the server's own code using the service role key. Only the database
-- owner (Supabase SQL Editor or a migration) can grant or remove it.
--
-- To mark the maintainer's account, run this once in the SQL Editor (the
-- email is kept out of this file because the repository is public):
--
--   UPDATE public.profiles
--   SET is_eagle_admin = true, role = 'super_admin'
--   WHERE lower(email) = lower('<maintainer email>');
--
-- How a website request is told apart from the SQL Editor: PostgREST sets the
-- request's JWT claims (role anon / authenticated / service_role) for each
-- transaction. The SQL Editor and migrations have none. After a request ends
-- the setting can read back as '' on a reused connection, hence the nullif.
--
-- Fully qualified names + empty search_path, as in 00013 and 00016.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_eagle_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_eagle_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  api_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
BEGIN
  -- SQL Editor / migrations: the database owner can do anything.
  IF api_role IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_eagle_admin THEN
      RAISE EXCEPTION 'The Eagle admin account can''t be deleted from the website.'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_eagle_admin THEN
      RAISE EXCEPTION 'Eagle admin can only be granted in the database.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.is_eagle_admin IS DISTINCT FROM OLD.is_eagle_admin THEN
    RAISE EXCEPTION 'Eagle admin can only be granted or removed in the database.'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.is_eagle_admin
     AND (NEW.role IS DISTINCT FROM OLD.role
          OR NEW.support_blocked IS DISTINCT FROM OLD.support_blocked
          OR NEW.support_blocked_at IS DISTINCT FROM OLD.support_blocked_at) THEN
    RAISE EXCEPTION 'This is the Eagle admin (site maintainer). Their access can''t be changed from the website.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_eagle_admin ON public.profiles;
CREATE TRIGGER guard_eagle_admin
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_eagle_admin();
