BEGIN;

-- A confirmed user can use the app with full item access. Membership is
-- administered outside the client; members cannot invite or promote others.
CREATE TABLE public.inventory_members (
  inventory_id uuid NOT NULL REFERENCES public.inventories(id) ON DELETE CASCADE,
  invited_email text NOT NULL CHECK (invited_email=lower(btrim(invited_email)) AND length(invited_email) BETWEEN 3 AND 320),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (inventory_id,invited_email),
  UNIQUE (inventory_id,user_id)
);
ALTER TABLE public.inventory_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_members FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.can_manage_inventory(p_inventory uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.inventories n WHERE n.id=p_inventory AND n.owner_id=auth.uid())
    OR EXISTS (SELECT 1 FROM public.inventory_members m
      JOIN auth.users u ON u.id=m.user_id
      WHERE m.inventory_id=p_inventory AND m.user_id=auth.uid()
        AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL)
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_inventory(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_inventory(uuid) TO authenticated;

-- Bind a pending invitation once to the verified account ID. No user_metadata
-- or unverified email claim is trusted. Deleting the account removes the grant.
CREATE FUNCTION public.bind_inventory_membership() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE public.inventory_members m SET user_id=NEW.id
    WHERE m.user_id IS NULL AND m.invited_email=lower(btrim(NEW.email))
      AND NOT EXISTS(SELECT 1 FROM public.inventory_members existing
        WHERE existing.inventory_id=m.inventory_id AND existing.user_id=NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bind_inventory_membership() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER bind_inventory_membership AFTER INSERT OR UPDATE OF email,email_confirmed_at,deleted_at
ON auth.users FOR EACH ROW EXECUTE FUNCTION public.bind_inventory_membership();

CREATE POLICY shared_inventory_read ON public.inventories FOR SELECT TO authenticated
  USING (public.can_manage_inventory(id));
CREATE POLICY shared_items ON public.items FOR ALL TO authenticated
  USING (public.can_manage_inventory(inventory_id))
  WITH CHECK (public.can_manage_inventory(inventory_id));
CREATE POLICY shared_tags_read ON public.tags FOR SELECT TO authenticated
  USING (public.can_manage_inventory(inventory_id));
CREATE POLICY shared_item_tags ON public.item_tags FOR ALL TO authenticated
  USING (public.can_manage_inventory(inventory_id))
  WITH CHECK (public.can_manage_inventory(inventory_id));

-- Keep the existing mutation implementations, validation, revision checks and
-- hierarchy protections; extend only their authorization check.
DO $migration$
DECLARE signature text; definition text;
  old_guard text := 'IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.inventories WHERE id=p_inventory AND owner_id=auth.uid()) THEN';
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.web_save_item(uuid,uuid,bigint,text,text,bigint,text)',
    'public.web_save_tagged_item(uuid,uuid,bigint,text,text,bigint,text,bigint)',
    'public.web_delete_item(uuid,uuid,bigint)'
  ] LOOP
    definition := pg_get_functiondef(signature::regprocedure);
    IF position(old_guard IN definition)=0 THEN
      RAISE EXCEPTION 'Unexpected authorization implementation: %',signature;
    END IF;
    EXECUTE replace(replace(definition,old_guard,
      'IF NOT public.can_manage_inventory(p_inventory) THEN'),'Owner access required','Inventory access required');
  END LOOP;
END;
$migration$;

NOTIFY pgrst,'reload schema';
COMMIT;
