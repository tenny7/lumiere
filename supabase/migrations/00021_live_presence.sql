-- Live online status (green dots, "N online", the support chat indicator).
--
-- 00017 kept one "last seen" time per user, refreshed every minute, so people
-- stayed green for up to 2 minutes after leaving. Now every open browser tab
-- is a session row:
--   * opening the site creates a session, and staff pages hear about it at
--     once (Realtime postgres_changes; RLS: only staff receive other users'
--     rows, as with user_presence);
--   * closing the tab marks the session left (leave_presence(), sent as the
--     page unloads), so the person goes offline within seconds;
--   * a tab that disappears without a goodbye (crash, phone asleep, no signal)
--     stops its 30-second heartbeat and expires after 90 seconds.
-- Someone is online while any of their sessions is open. A session that left
-- in the last 5 seconds still counts, so a page reload (old tab leaves, new
-- one arrives) doesn't flicker to offline. user_presence keeps "last seen".
--
-- Fully qualified names + empty search_path (see 00013). Idempotent.

CREATE TABLE IF NOT EXISTS public.presence_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

CREATE INDEX IF NOT EXISTS presence_sessions_user_id_idx
  ON public.presence_sessions (user_id);

ALTER TABLE public.presence_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read presence sessions" ON public.presence_sessions;
CREATE POLICY "Staff read presence sessions" ON public.presence_sessions
  FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "Users read own presence sessions" ON public.presence_sessions;
CREATE POLICY "Users read own presence sessions" ON public.presence_sessions
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: rows change only through the functions
-- below, which act on the caller's own sessions with the server clock.

-- Heartbeat from an open tab (on load, every 30s, and when it comes back).
CREATE OR REPLACE FUNCTION public.touch_presence(p_session uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR p_session IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.presence_sessions AS s (id, user_id, last_seen_at, left_at)
  VALUES (p_session, uid, now(), NULL)
  ON CONFLICT (id) DO UPDATE
    SET last_seen_at = now(), left_at = NULL
    WHERE s.user_id = uid;

  INSERT INTO public.user_presence (user_id, last_seen_at)
  VALUES (uid, now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at;

  -- Housekeeping: drop this user's sessions that ended over an hour ago.
  DELETE FROM public.presence_sessions
  WHERE user_id = uid
    AND id <> p_session
    AND coalesce(left_at, last_seen_at) < now() - interval '1 hour';
END;
$$;

-- Goodbye from a closing tab.
CREATE OR REPLACE FUNCTION public.leave_presence(p_session uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.presence_sessions
  SET left_at = now()
  WHERE id = p_session AND user_id = auth.uid() AND left_at IS NULL;

  UPDATE public.user_presence
  SET last_seen_at = now()
  WHERE user_id = auth.uid();
$$;

-- Online + last seen for a list of users, judged by the server clock.
-- SECURITY INVOKER: RLS decides what the caller sees (staff: everyone;
-- anyone else: only themselves).
CREATE OR REPLACE FUNCTION public.presence_status(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, last_seen_at timestamptz, online boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    up.user_id,
    up.last_seen_at,
    EXISTS (
      SELECT 1
      FROM public.presence_sessions ps
      WHERE ps.user_id = up.user_id
        AND ps.last_seen_at > now() - interval '90 seconds'
        AND (ps.left_at IS NULL OR ps.left_at > now() - interval '5 seconds')
    )
  FROM public.user_presence up
  WHERE up.user_id = ANY (p_user_ids);
$$;

-- Support chat indicator: same rule, still only true/false (never who).
CREATE OR REPLACE FUNCTION public.support_team_online()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.presence_sessions ps
    JOIN public.profiles p ON p.id = ps.user_id
    WHERE p.role <> 'customer'
      AND ps.last_seen_at > now() - interval '90 seconds'
      AND (ps.left_at IS NULL OR ps.left_at > now() - interval '5 seconds')
  );
$$;

REVOKE ALL ON FUNCTION public.touch_presence(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_presence(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.presence_status(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.support_team_online() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_presence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_presence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.presence_status(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.support_team_online() TO authenticated;

-- Staff pages listen for sessions opening and closing.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
