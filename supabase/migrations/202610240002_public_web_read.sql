-- Owner explicitly approved no-login, public reading of this inventory.
-- This does not expose other inventories, tags, access mappings, auth data or writes.
BEGIN;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT (id, public_id, inventory_id, type, name, description, parent_id, manual_icon)
  ON TABLE public.items TO anon;
CREATE POLICY public_web_items_read ON public.items FOR SELECT TO anon
  USING (inventory_id = 'd40234ba-1daa-493a-958e-8c763f8d7e3b'::uuid);
NOTIFY pgrst, 'reload schema';
COMMIT;
