-- Stage before deployment. Owner assignment and removal of public reads are a
-- separate activation step, after the owner's email login has been verified.
BEGIN;
ALTER TABLE public.items ADD COLUMN revision bigint NOT NULL DEFAULT 0 CHECK(revision >= 0);
CREATE FUNCTION public.web_item_revision() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$
BEGIN
  NEW.revision := OLD.revision + 1;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.web_item_revision() FROM PUBLIC;
CREATE TRIGGER items_revision BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.web_item_revision();

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT(id, owner_id) ON public.inventories TO authenticated;
GRANT SELECT(id, public_id, inventory_id, type, name, description, parent_id, manual_icon, revision) ON public.items TO authenticated;
GRANT INSERT(public_id, inventory_id, type, name, description, parent_id) ON public.items TO authenticated;
GRANT UPDATE(type, name, description, parent_id) ON public.items TO authenticated;
GRANT DELETE ON public.items TO authenticated;
GRANT USAGE ON SEQUENCE public.items_id_seq TO authenticated;

-- Invoker functions retain the existing owner RLS policies and hierarchy guard.
CREATE FUNCTION public.web_save_item(p_inventory uuid, p_public_id uuid,
  p_expected_revision bigint, p_name text, p_type text, p_parent bigint, p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public AS $$
DECLARE saved public.items%ROWTYPE; words integer;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.inventories WHERE id=p_inventory AND owner_id=auth.uid()) THEN
    RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_inventory::text,0));
  SELECT count(*) INTO words FROM regexp_split_to_table(coalesce(p_description,''), '\s+') token WHERE token ~ '[[:alnum:]]';
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 120 OR words>200 OR p_type IS NULL OR p_type NOT IN('LOCATION','STORAGE','OBJECT') THEN
    RAISE EXCEPTION 'Invalid item fields' USING ERRCODE='23514';
  END IF;
  SELECT * INTO saved FROM public.items WHERE inventory_id=p_inventory AND public_id=p_public_id FOR UPDATE;
  IF p_expected_revision IS NULL THEN
    IF FOUND THEN
      -- A repeated creation request after a lost network response is idempotent.
      IF saved.name IS DISTINCT FROM btrim(p_name) OR saved.type IS DISTINCT FROM p_type
        OR saved.parent_id IS DISTINCT FROM p_parent OR saved.description IS DISTINCT FROM coalesce(p_description,'') THEN
        RAISE EXCEPTION 'Conflicting creation request' USING ERRCODE='40001';
      END IF;
    ELSE
      INSERT INTO public.items(public_id,inventory_id,type,name,description,parent_id)
        VALUES(p_public_id,p_inventory,p_type,btrim(p_name),coalesce(p_description,''),p_parent) RETURNING * INTO saved;
    END IF;
  ELSE
    IF NOT FOUND OR saved.revision<>p_expected_revision THEN
      RAISE EXCEPTION 'Item changed or was removed' USING ERRCODE='40001';
    END IF;
    UPDATE public.items SET name=btrim(p_name),type=p_type,parent_id=p_parent,description=coalesce(p_description,'')
      WHERE inventory_id=p_inventory AND public_id=p_public_id RETURNING * INTO saved;
  END IF;
  RETURN jsonb_build_object('id',saved.id::text,'public_id',saved.public_id,'parent_id',saved.parent_id::text,
    'type',saved.type,'name',saved.name,'description',saved.description,'manual_icon',saved.manual_icon,'revision',saved.revision::text);
END $$;

CREATE FUNCTION public.web_delete_item(p_inventory uuid, p_public_id uuid, p_expected_revision bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public AS $$
DECLARE target public.items%ROWTYPE; deleted bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.inventories WHERE id=p_inventory AND owner_id=auth.uid()) THEN
    RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_inventory::text,0));
  SELECT * INTO target FROM public.items WHERE inventory_id=p_inventory AND public_id=p_public_id FOR UPDATE;
  -- Retrying an already completed deletion is harmless.
  IF NOT FOUND THEN RETURN 0; END IF;
  IF p_expected_revision IS NULL OR target.revision<>p_expected_revision THEN
    RAISE EXCEPTION 'Item changed' USING ERRCODE='40001';
  END IF;
  SET CONSTRAINTS items_parent_fk DEFERRED;
  WITH RECURSIVE subtree(id) AS (
    SELECT target.id UNION SELECT i.id FROM public.items i JOIN subtree s ON i.parent_id=s.id WHERE i.inventory_id=p_inventory
  ) DELETE FROM public.items WHERE inventory_id=p_inventory AND id IN(SELECT id FROM subtree);
  GET DIAGNOSTICS deleted=ROW_COUNT;
  SET CONSTRAINTS items_parent_fk IMMEDIATE;
  RETURN deleted;
END $$;
REVOKE ALL ON FUNCTION public.web_save_item(uuid,uuid,bigint,text,text,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.web_delete_item(uuid,uuid,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.web_save_item(uuid,uuid,bigint,text,text,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.web_delete_item(uuid,uuid,bigint) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
