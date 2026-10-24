-- Smaller copies of product photos, for faster pages.
--
-- Photos were uploaded as-is: mostly 1,000-1,500px PNGs of 0.5-1.9 MB, shown
-- at about 300px in a product card. The All Lights page downloaded about
-- 16 MB of photos. The upload route now also stores WebP copies at a few
-- widths and a tiny blurred preview (lib/images/variants.ts). These columns
-- record them. All are optional: the storefront uses the original `url` when
-- they are empty. scripts/optimize-product-images.mjs fills them for photos
-- uploaded before this migration.
-- Idempotent: safe to re-run.

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS blur_data_url text,
  ADD COLUMN IF NOT EXISTS variants jsonb;

COMMENT ON COLUMN public.product_images.variants IS
  'WebP copies, narrowest first: [{"width": 480, "url": "...", "bytes": 12345}, ...]';

-- Let the API see the new columns straight away.
NOTIFY pgrst, 'reload schema';
