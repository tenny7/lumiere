-- Admin kill switch for abusive support messaging.
-- A blocked customer can still read their threads but cannot send new messages
-- (enforced in /api/support/messages). Admins/staff are never blocked.
-- Idempotent: safe to re-run.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS support_blocked boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS support_blocked_at timestamptz;
