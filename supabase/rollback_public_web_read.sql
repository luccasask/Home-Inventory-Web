-- Disables the public web read added by 202610240002_public_web_read.sql.
-- No inventory content is deleted or changed.
BEGIN;
DROP POLICY IF EXISTS public_web_items_read ON public.items;
REVOKE SELECT (id, public_id, inventory_id, type, name, description, parent_id, manual_icon)
  ON TABLE public.items FROM anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
