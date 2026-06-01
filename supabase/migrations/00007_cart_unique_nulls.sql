-- =============================================
-- Ajabu Lighting — De-duplicate cart rows for variant-less items
-- =============================================
-- The cart_items unique constraint UNIQUE(profile_id, product_id, variant_id)
-- does NOT prevent duplicates when variant_id IS NULL, because SQL treats NULLs
-- as distinct. So adding the same (non-variant) product twice — or merging a
-- guest cart — created TWO rows instead of updating one, and the upsert's
-- ON CONFLICT never matched. Postgres 15+ supports NULLS NOT DISTINCT, which
-- makes the constraint treat NULL variants as equal so upserts dedupe correctly.

-- 1. Collapse any existing duplicates (keep the earliest row per group).
DELETE FROM cart_items a
USING cart_items b
WHERE a.ctid < b.ctid
  AND a.profile_id = b.profile_id
  AND a.product_id = b.product_id
  AND a.variant_id IS NOT DISTINCT FROM b.variant_id;

-- 2. Replace the old unique constraint with a NULLS NOT DISTINCT version.
ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_profile_id_product_id_variant_id_key;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_profile_product_variant_key
  UNIQUE NULLS NOT DISTINCT (profile_id, product_id, variant_id);
