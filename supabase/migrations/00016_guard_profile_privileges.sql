-- SECURITY FIX: stop customers from granting themselves admin.
--
-- The "Users can update own profile" policy lets a signed-in user update every
-- column of their own row, including `role` and `support_blocked`. With the
-- public anon key, any customer could set their own role to 'super_admin' (or
-- lift their own messaging block) from the browser console.
--
-- This BEFORE UPDATE trigger allows changes to role / support_blocked /
-- support_blocked_at only when the acting user is an admin, and adds lockout
-- guards:
--   * nobody can change their own role (prevents an admin removing their own
--     access by mistake; another admin must do it)
--   * only a super_admin can grant or remove the super_admin role
-- Server-side code using the service role key, and the SQL editor, have no
-- end-user (auth.uid() is null) and are trusted.
--
-- Fully qualified names + empty search_path: the function never depends on the
-- caller's search_path (see 00013).

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  actor_role text;
BEGIN
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.support_blocked IS NOT DISTINCT FROM OLD.support_blocked
     AND NEW.support_blocked_at IS NOT DISTINCT FROM OLD.support_blocked_at THEN
    RETURN NEW;
  END IF;

  SELECT p.role::text INTO actor_role
  FROM public.profiles p
  WHERE p.id = actor;

  IF actor_role IS NULL OR actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admins can change roles or messaging access'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.id = actor THEN
      RAISE EXCEPTION 'You cannot change your own role. Ask another admin.'
        USING ERRCODE = '42501';
    END IF;

    IF (OLD.role::text = 'super_admin' OR NEW.role::text = 'super_admin')
       AND actor_role <> 'super_admin' THEN
      RAISE EXCEPTION 'Only a super admin can grant or remove super admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileges ON public.profiles;
CREATE TRIGGER guard_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();
