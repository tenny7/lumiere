-- =============================================
-- LUMIÈRE — Newsletter subscribers & contact messages
-- =============================================
-- Both are written from server routes using the service-role client, so RLS is
-- enabled with admin-only access (no public policies needed).

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_handled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL USING (is_admin());

CREATE POLICY "Staff can read contact messages"
  ON contact_messages FOR SELECT USING (is_staff());
CREATE POLICY "Admin can manage contact messages"
  ON contact_messages FOR ALL USING (is_admin());
