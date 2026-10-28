-- Requested tag/icon refresh; preserve tag identities, item fields and legacy links.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('d40234ba-1daa-493a-958e-8c763f8d7e3b',0));
UPDATE public.tags SET name='Elektronik 1', normalized_name=lower('Elektronik 1'), icon_name='plug'
WHERE inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b' AND web_category AND normalized_name=lower('Elektronik');
UPDATE public.tags SET name='Hygien & hälsa', normalized_name=lower('Hygien & hälsa'), icon_name='toothbrush-sparkles'
WHERE inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b' AND web_category AND normalized_name=lower('Hygien & hälsa');
UPDATE public.tags SET name='Kök 2', normalized_name=lower('Kök 2'), icon_name='utensils'
WHERE inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b' AND web_category AND normalized_name=lower('Kök & mat');
UPDATE public.tags SET name='Förvaring 1', normalized_name=lower('Förvaring 1'), icon_name='package'
WHERE inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b' AND web_category AND normalized_name=lower('Förvaring');
UPDATE public.tags SET name='Verktyg', normalized_name=lower('Verktyg'), icon_name='hammer'
WHERE inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b' AND web_category AND normalized_name=lower('Verktyg');
INSERT INTO public.tags(inventory_id,name,normalized_name,icon_name,specificity,web_category)
SELECT 'd40234ba-1daa-493a-958e-8c763f8d7e3b'::uuid,label,lower(label),icon,20,true FROM (VALUES
  ('Elektronik 1','plug'),
  ('Elektronik 2','monitor'),
  ('Hygien','soap-dispenser-droplet'),
  ('Hälsa','cross'),
  ('Textiler','layers'),
  ('Hygien & hälsa','toothbrush-sparkles'),
  ('Kök 1','cooking-pot'),
  ('Kök 2','utensils'),
  ('Mat 1','apple'),
  ('Mat 2','snowflake'),
  ('Mat 3','cookie'),
  ('Förvaring 1','package'),
  ('Förvaring 2','refrigerator'),
  ('Förvaring 3','shelving-unit'),
  ('Verktyg','hammer'),
  ('Fordon','car')
) AS categories(label,icon)
ON CONFLICT(inventory_id,normalized_name) DO UPDATE
SET name=EXCLUDED.name,icon_name=EXCLUDED.icon_name,web_category=true;
COMMIT;
