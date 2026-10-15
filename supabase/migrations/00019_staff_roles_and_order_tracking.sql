-- Limited staff roles + reliable stock and coupon accounting.
-- Idempotent: safe to re-run. Run after 00018.

-- ── 1. Limited staff roles ──────────────────────────────────────────────────
-- Mirrors lib/permissions.ts:
--   inventory_manager: manage products, categories, product images, variants
--   sales_agent:       moderate reviews, handle support conversations
-- (Order actions go through server routes that check the role in code.)

CREATE OR REPLACE FUNCTION public.has_any_role(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = ANY (roles)
  );
$$;
REVOKE ALL ON FUNCTION public.has_any_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO authenticated, service_role;

DROP POLICY IF EXISTS "Inventory can manage products" ON public.products;
CREATE POLICY "Inventory can manage products" ON public.products
  FOR ALL USING (public.has_any_role(ARRAY['inventory_manager']))
  WITH CHECK (public.has_any_role(ARRAY['inventory_manager']));

DROP POLICY IF EXISTS "Inventory can manage categories" ON public.categories;
CREATE POLICY "Inventory can manage categories" ON public.categories
  FOR ALL USING (public.has_any_role(ARRAY['inventory_manager']))
  WITH CHECK (public.has_any_role(ARRAY['inventory_manager']));

DROP POLICY IF EXISTS "Inventory can manage product images" ON public.product_images;
CREATE POLICY "Inventory can manage product images" ON public.product_images
  FOR ALL USING (public.has_any_role(ARRAY['inventory_manager']))
  WITH CHECK (public.has_any_role(ARRAY['inventory_manager']));

DROP POLICY IF EXISTS "Inventory can manage variants" ON public.product_variants;
CREATE POLICY "Inventory can manage variants" ON public.product_variants
  FOR ALL USING (public.has_any_role(ARRAY['inventory_manager']))
  WITH CHECK (public.has_any_role(ARRAY['inventory_manager']));

DROP POLICY IF EXISTS "Sales can manage reviews" ON public.reviews;
CREATE POLICY "Sales can manage reviews" ON public.reviews
  FOR ALL USING (public.has_any_role(ARRAY['sales_agent']))
  WITH CHECK (public.has_any_role(ARRAY['sales_agent']));

DROP POLICY IF EXISTS "Sales manage support messages" ON public.support_messages;
CREATE POLICY "Sales manage support messages" ON public.support_messages
  FOR ALL USING (public.has_any_role(ARRAY['sales_agent']))
  WITH CHECK (public.has_any_role(ARRAY['sales_agent']));

-- ── 2. Stock: deduct once on payment, restore once on cancel/refund ────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;

-- Backfill: stock was taken whenever a payment succeeded (MoMo success or
-- Mark Paid); nothing has ever been put back.
UPDATE public.orders o
SET stock_deducted = true
WHERE stock_deducted = false
  AND EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.order_id = o.id AND p.status = 'successful'
  );

CREATE OR REPLACE FUNCTION public.increment_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_product_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_variant_stock(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_variant_id;
$$;

-- Server only (see 00018).
REVOKE EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_variant_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_variant_stock(uuid, integer) TO service_role;

-- ── 3. Coupons: count a use when the order is placed, not at checkout start ─
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_redeemed boolean NOT NULL DEFAULT false;

-- Backfill: until now every order with a coupon counted a use when created.
UPDATE public.orders
SET coupon_redeemed = true
WHERE coupon_id IS NOT NULL AND coupon_redeemed = false;
