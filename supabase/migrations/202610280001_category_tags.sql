BEGIN;
ALTER TABLE public.tags ADD COLUMN web_category boolean NOT NULL DEFAULT false;
ALTER TABLE public.items ADD COLUMN category_tag_id bigint;
ALTER TABLE public.items ADD CONSTRAINT items_category_tag_fk FOREIGN KEY(inventory_id,category_tag_id)
  REFERENCES public.tags(inventory_id,id) ON DELETE RESTRICT;
CREATE INDEX items_category_tag_idx ON public.items(inventory_id,category_tag_id) WHERE category_tag_id IS NOT NULL;
GRANT SELECT(id,inventory_id,name,icon_name,web_category) ON public.tags TO authenticated;
GRANT SELECT(category_tag_id) ON public.items TO authenticated;
GRANT INSERT(category_tag_id) ON public.items TO authenticated;
GRANT UPDATE(category_tag_id) ON public.items TO authenticated;

CREATE FUNCTION public.web_category_guard() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.category_tag_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.tags t
    WHERE t.inventory_id=NEW.inventory_id AND t.id=NEW.category_tag_id AND t.web_category) THEN
    RAISE EXCEPTION 'Invalid category tag' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.web_category_guard() FROM PUBLIC, anon;
CREATE TRIGGER items_category_guard BEFORE INSERT OR UPDATE OF category_tag_id ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.web_category_guard();

-- The new atomic Save function is below; the old function remains for older clients.

CREATE FUNCTION public.web_save_tagged_item(p_inventory uuid, p_public_id uuid,
  p_expected_revision bigint, p_name text, p_type text, p_parent bigint, p_description text, p_category bigint)
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
        OR saved.parent_id IS DISTINCT FROM p_parent OR saved.description IS DISTINCT FROM coalesce(p_description,'')
        OR saved.category_tag_id IS DISTINCT FROM p_category THEN
        RAISE EXCEPTION 'Conflicting creation request' USING ERRCODE='40001';
      END IF;
    ELSE
      INSERT INTO public.items(public_id,inventory_id,type,name,description,parent_id,category_tag_id)
        VALUES(p_public_id,p_inventory,p_type,btrim(p_name),coalesce(p_description,''),p_parent,p_category) RETURNING * INTO saved;
    END IF;
  ELSE
    IF NOT FOUND OR saved.revision<>p_expected_revision THEN
      RAISE EXCEPTION 'Item changed or was removed' USING ERRCODE='40001';
    END IF;
    UPDATE public.items SET name=btrim(p_name),type=p_type,parent_id=p_parent,description=coalesce(p_description,''),category_tag_id=p_category
      WHERE inventory_id=p_inventory AND public_id=p_public_id RETURNING * INTO saved;
  END IF;
  RETURN jsonb_build_object('id',saved.id::text,'public_id',saved.public_id,'parent_id',saved.parent_id::text,
    'type',saved.type,'name',saved.name,'description',saved.description,'manual_icon',saved.manual_icon,'revision',saved.revision::text,'category',(SELECT jsonb_build_object('id',t.id::text,'name',t.name,'icon_name',t.icon_name) FROM public.tags t WHERE t.inventory_id=saved.inventory_id AND t.id=saved.category_tag_id));
END $$;

REVOKE ALL ON FUNCTION public.web_save_tagged_item(uuid,uuid,bigint,text,text,bigint,text,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.web_save_tagged_item(uuid,uuid,bigint,text,text,bigint,text,bigint) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
