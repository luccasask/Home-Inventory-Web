import { Archive, Armchair, BedDouble, BookOpen, Box, BriefcaseBusiness, Car, CookingPot,
  DoorOpen, Drill, Hammer, House, Lamp, MapPin, Package, Shirt, Sofa, Utensils, Wrench,
  type LucideIcon } from 'lucide-react';

// Bundle only supported icons. No icon catalog or icon assets are stored in Supabase.
const icons: Record<string, LucideIcon> = {
  archive: Archive, armchair: Armchair, 'bed-double': BedDouble, 'book-open': BookOpen,
  box: Box, 'briefcase-business': BriefcaseBusiness, car: Car, 'cooking-pot': CookingPot,
  'door-open': DoorOpen, drill: Drill, hammer: Hammer, house: House, lamp: Lamp,
  'map-pin': MapPin, package: Package, shirt: Shirt, sofa: Sofa, utensils: Utensils, wrench: Wrench,
};

export function InventoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Box;
  return <Icon className={className} aria-hidden="true" />;
}
