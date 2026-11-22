-- How the customer gets their order.
--
--   delivery       the store delivers to the customer's address (delivery fee)
--   pickup         the customer collects from the shop (no fee, no address)
--   self_arranged  the customer sends their own rider (no fee, no address)
--
-- Collection and own delivery are paid online before collection; checkout
-- hides Cash on Delivery for them and /api/payments/cod refuses it. Existing
-- orders were all delivered, so they default to 'delivery'. delivery_note is
-- the customer's note for their rider (who and when).
-- Idempotent: safe to re-run.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS delivery_note text;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_check
  CHECK (delivery_method IN ('delivery', 'pickup', 'self_arranged'));

-- Let the API see the new columns straight away.
NOTIFY pgrst, 'reload schema';
