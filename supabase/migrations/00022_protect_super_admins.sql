-- Super admin accounts can only be changed by super admins.
--
-- Already enforced by 00016 (guard_profile_privileges): only admins change
-- roles, only a super admin grants or removes super admin, and nobody changes
-- their own role. So sales agents, inventory managers and customers can't
-- touch any role, and admins can't touch a super admin's role.
--
-- Gap closed here: the "Admin can manage profiles" policy lets any admin
-- update or delete ANY profile row. An admin could still delete a super
-- admin's profile (removing them), block them from support messaging, or
-- edit their account details, all from the browser console. This trigger
-- refuses any change to, or deletion of, a super admin's profile unless the
-- signed-in user making it is a super admin. A super admin can still edit
-- their own profile (their own role stays locked by 00016).
--
-- As in 00016, server code using the service role key and the SQL Editor
-- have no end user (auth.uid() is null) and are trusted. The Eagle admin
-- (00020) has a stricter rule on top: nobody can change it from the website.
--
-- Fully qualified names + empty search_path (see 00013). Idempotent.

CREATE OR REPLACE FUNCTION public.guard_super_admin_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  actor_role text;
BEGIN
  -- Not a super admin's row, the person editing their own row, or a trusted
  -- caller (server code / SQL Editor): nothing to check here.
  IF actor IS NULL OR OLD.role::text <> 'super_admin' OR OLD.id = actor THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT p.role::text INTO actor_role
  FROM public.profiles p
  WHERE p.id = actor;

  IF actor_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Only a super admin can change or remove a super admin''s account.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_super_admin_profiles ON public.profiles;
CREATE TRIGGER guard_super_admin_profiles
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_super_admin_profiles();
