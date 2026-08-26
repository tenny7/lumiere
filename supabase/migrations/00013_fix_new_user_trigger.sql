-- Fix "Database error saving a new user" on signup.
--
-- handle_new_user() is a SECURITY DEFINER trigger on auth.users. When it was
-- re-created in the SQL editor (00011) it lost a locked search_path, so the
-- unqualified `profiles` reference could fail to resolve at trigger time and the
-- whole signup rolled back. Recreate it with an explicit empty search_path and
-- a schema-qualified table (Supabase best practice) so it always resolves.
-- The existing on_auth_user_created trigger already points to this function by
-- name, so replacing the function is enough.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  RETURN NEW;
END;
$$;
