-- Support messaging: per-order conversation threads between admin and customer.
-- Two-way; admin messages also trigger an email (handled in the app layer).

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_order ON support_messages(order_id, created_at);
CREATE INDEX idx_support_messages_unread ON support_messages(order_id) WHERE read_at IS NULL;

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read messages on their own orders.
CREATE POLICY "Customers read own order messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = support_messages.order_id AND o.customer_id = auth.uid()
    )
  );

-- Customers can send (as 'customer') on their own orders.
CREATE POLICY "Customers send on own orders" ON support_messages
  FOR INSERT WITH CHECK (
    sender_role = 'customer'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = support_messages.order_id AND o.customer_id = auth.uid()
    )
  );

-- Customers can mark messages on their own orders as read.
CREATE POLICY "Customers update own order messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = support_messages.order_id AND o.customer_id = auth.uid()
    )
  );

-- Admins have full access.
CREATE POLICY "Admin manage support messages" ON support_messages
  FOR ALL USING (is_admin());
