-- Online / last-seen presence.
--
-- Each signed-in browser calls touch_presence() about once a minute while the
-- tab is open; a user counts as "online" if seen in the last 2 minutes.
-- A heartbeat table (not Realtime Presence) is used so that only staff can see
-- who is online: Realtime presence state is shared with everyone on a channel.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read presence" ON public.user_presence;
CREATE POLICY "Staff read presence" ON public.user_presence
  FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "Users read own presence" ON public.user_presence;
CREATE POLICY "Users read own presence" ON public.user_presence
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT/UPDATE policies: rows are written only through touch_presence(),
-- which stamps the caller's own row with the server clock.
CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.user_presence (user_id, last_seen_at)
  SELECT auth.uid(), now()
  WHERE auth.uid() IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at;
$$;

REVOKE ALL ON FUNCTION public.touch_presence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;

-- For the customer support chat: is anyone from the store team around?
-- Returns only true/false, never who.
CREATE OR REPLACE FUNCTION public.support_team_online()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_presence up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE p.role <> 'customer'
      AND up.last_seen_at > now() - interval '2 minutes'
  );
$$;

REVOKE ALL ON FUNCTION public.support_team_online() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_team_online() TO authenticated;
