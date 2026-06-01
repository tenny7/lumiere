-- =============================================
-- LUMIÈRE — Currency default fix + order tracking
-- =============================================

-- 1. Currency: store operates in a single, admin-configurable currency (RWF).
--    Fix the products default (was GHS in the live DB) and normalise existing rows.
ALTER TABLE products ALTER COLUMN currency SET DEFAULT 'RWF';
UPDATE products SET currency = 'RWF' WHERE currency IS DISTINCT FROM 'RWF';

-- Ensure the configurable store currency setting exists (admin can change it).
INSERT INTO store_settings (key, value)
VALUES ('store_currency', '"RWF"')
ON CONFLICT (key) DO NOTHING;

-- Fix the bad seed value (some installs seeded GHS). Only touches the known bad value.
UPDATE store_settings SET value = '"RWF"'
WHERE key = 'store_currency' AND value = '"GHS"'::jsonb;

-- 2. Order tracking: courier tracking number + carrier (+ optional URL),
--    surfaced to the customer and included in the shipping email.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
