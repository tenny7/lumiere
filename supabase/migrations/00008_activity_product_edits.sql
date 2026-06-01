-- =============================================
-- Ajabu Lighting — broaden product-edit activity logging
-- =============================================
-- The original product UPDATE trigger only logged when name/price/active/
-- featured changed, so editing a description, specs, SKU, category, etc. via
-- the admin form was not recorded. Broaden it to log any meaningful admin edit
-- while still ignoring bare stock_quantity changes (which happen on every sale).

DROP TRIGGER IF EXISTS log_products_update ON products;
CREATE TRIGGER log_products_update
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (
    OLD.name IS DISTINCT FROM NEW.name
    OR OLD.slug IS DISTINCT FROM NEW.slug
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.long_description IS DISTINCT FROM NEW.long_description
    OR OLD.base_price IS DISTINCT FROM NEW.base_price
    OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
    OR OLD.cost_price IS DISTINCT FROM NEW.cost_price
    OR OLD.sku IS DISTINCT FROM NEW.sku
    OR OLD.category_id IS DISTINCT FROM NEW.category_id
    OR OLD.is_active IS DISTINCT FROM NEW.is_active
    OR OLD.is_featured IS DISTINCT FROM NEW.is_featured
    OR OLD.metadata IS DISTINCT FROM NEW.metadata
    OR OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold
  )
  EXECUTE FUNCTION log_activity();
