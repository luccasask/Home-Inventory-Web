-- Run once as the administrator after 202610280001_category_tags.sql.
-- Reuses matching legacy tag identities and preserves all legacy item_tags.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('d40234ba-1daa-493a-958e-8c763f8d7e3b',0));
INSERT INTO public.tags(inventory_id,name,normalized_name,icon_name,specificity,web_category)
SELECT 'd40234ba-1daa-493a-958e-8c763f8d7e3b'::uuid,label,lower(label),icon,20,true FROM (VALUES
  ('Elektronik','cpu'),
  ('Musik & ljud','music'),
  ('Verktyg','wrench'),
  ('Städ & tvätt','brush-cleaning'),
  ('Kök & mat','utensils'),
  ('Kontor & studier','pencil-ruler'),
  ('Kläder','shirt'),
  ('Hygien & hälsa','bath'),
  ('Möbler','sofa'),
  ('Inredning','lamp'),
  ('Sport & fritid','dumbbell'),
  ('Spel & hobby','gamepad-2'),
  ('Böcker & media','book-open'),
  ('Trädgård & växter','sprout'),
  ('Hushåll','house'),
  ('Resor & transport','plane'),
  ('Husdjur','paw-print'),
  ('Högtider & fest','gift'),
  ('Övrigt','box'),
  ('Plats','map-pin'),
  ('Rum','house'),
  ('Förvaring','package'),
  ('Föremål','box')
) AS categories(label,icon)
ON CONFLICT(inventory_id,normalized_name) DO UPDATE
SET name=EXCLUDED.name,icon_name=EXCLUDED.icon_name,web_category=true;

-- One-time classification of currently existing OBJECT records only.
-- Metadata, hierarchy, public IDs, manual icons and older detail tags are preserved.
WITH choices(name,category) AS (VALUES
  ('Löparskor','Sport & fritid'),('Vinterkängor','Kläder'),('Reservnycklar','Hushåll'),
  ('Potatisskalare','Kök & mat'),('Korkskruv','Kök & mat'),('Tallrikar','Kök & mat'),
  ('Kaffemuggar','Kök & mat'),('Digital köksvåg','Kök & mat'),('Fjärrkontroll','Elektronik'),
  ('Spelkonsol','Spel & hobby'),('HDMI-kabel','Elektronik'),('Kortlek','Spel & hobby'),
  ('Sovmask','Hygien & hälsa'),('Telefonladdare','Elektronik'),('Vintermössa','Kläder'),
  ('Pass','Resor & transport'),('Hammare','Verktyg'),('Skruvmejsel','Verktyg'),('Måttband','Verktyg'),
  ('USB-C-kabel','Elektronik'),('Laptopladdare','Elektronik'),('Cykelpump','Sport & fritid'),
  ('Kastrull','Kök & mat'),('Gaffel','Kök & mat'),('Kniv','Kök & mat'),('Glas','Kök & mat'),
  ('Skärbräda','Kök & mat'),('Sked','Kök & mat'),('Pizzaslicer','Kök & mat'),('Rivjärn','Kök & mat'),
  ('Tekopp','Kök & mat'),('Nintendo Switch','Spel & hobby')
)
UPDATE public.items i SET category_tag_id=t.id
FROM public.tags t
WHERE i.inventory_id='d40234ba-1daa-493a-958e-8c763f8d7e3b'::uuid
  AND i.type='OBJECT' AND i.category_tag_id IS NULL
  AND t.inventory_id=i.inventory_id AND t.web_category
  AND t.name=coalesce((SELECT c.category FROM choices c WHERE c.name=i.name),'Övrigt');
COMMIT;
