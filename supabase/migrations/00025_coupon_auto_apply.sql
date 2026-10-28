-- Coupons that apply themselves at checkout.
--
-- With auto_apply on, checkout gives a signed-in customer the coupon without
-- typing the code, while it is active, in date, under Max Uses and above any
-- minimum order. Each customer can use an automatic coupon once, so Max Uses
-- of 100 means the first 100 customers. Enforced in app/api/coupons/auto,
-- app/api/coupons/validate and app/api/orders/create (lib/utils/coupon.ts).
-- Idempotent: safe to re-run.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS auto_apply boolean NOT NULL DEFAULT false;

-- Let the API see the new column straight away.
NOTIFY pgrst, 'reload schema';
