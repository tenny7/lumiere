-- Realtime "new order" signal for admins, keyed off payments.
-- An order row is created at "Continue to Payment" (before the customer
-- commits), so it can't signal a placed order. A payment row exists only once
-- the order is placed (COD / MoMo transfer) or paid (MoMo API), so admins
-- listen to payments instead. RLS still applies: staff read all payments.
-- Idempotent: ignore if the table is already in the publication.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE payments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
