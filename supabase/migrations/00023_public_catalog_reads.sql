-- Signed-out visitors could not load products, categories or reviews.
--
-- 00019 added staff policies that call has_any_role() and revoked EXECUTE on
-- that function from anon. The policies had no TO clause, so they applied to
-- every role, anon included. Postgres checks EXECUTE on each function in a
-- table's policies before reading any row, so every anon read of products,
-- categories or reviews failed with "permission denied for function
-- has_any_role". The storefront reads these as the visitor, so a signed-out
-- shopper saw no products or photos. Signed-in customers were unaffected.
--
-- Scoping the staff policies to authenticated takes them out of anon queries.
-- The public read policies from 00001 still apply to everyone, and staff
-- access is unchanged. Idempotent: safe to re-run. Run after 00019.

ALTER POLICY "Inventory can manage products" ON public.products TO authenticated;
ALTER POLICY "Inventory can manage categories" ON public.categories TO authenticated;
ALTER POLICY "Inventory can manage product images" ON public.product_images TO authenticated;
ALTER POLICY "Inventory can manage variants" ON public.product_variants TO authenticated;
ALTER POLICY "Sales can manage reviews" ON public.reviews TO authenticated;
ALTER POLICY "Sales manage support messages" ON public.support_messages TO authenticated;
