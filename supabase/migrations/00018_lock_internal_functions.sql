-- SECURITY FIX: internal stock/coupon functions were callable by anyone.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and these are
-- SECURITY DEFINER, so any visitor holding the public anon key could call
--   decrement_product_stock / decrement_variant_stock  -> zero any stock
--   increment_coupon_uses                              -> exhaust any coupon
-- through the REST API. Only the server (service role) calls them, so revoke
-- everyone else. Idempotent: safe to re-run.

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(uuid) TO service_role;
