-- =============================================
-- LUMIÈRE — Storage buckets
-- =============================================
-- Creates the public bucket used for product imagery. Uploads happen via the
-- service-role admin client (which bypasses RLS), but we still scope write
-- access to admins and allow public read so getPublicUrl() works.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read access to product images
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admins can upload product images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admins can update product images
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

-- Admins can delete product images
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());
