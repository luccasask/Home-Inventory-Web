import { Archive, Armchair, BedDouble, BookOpen, Box, BriefcaseBusiness, Car, CookingPot,
  DoorOpen, Drill, Hammer, House, Lamp, MapPin, Package, Shirt, Sofa, Utensils, Wrench,
  Bath, Cpu, Dumbbell, Gamepad2, Gift, Music, PawPrint, PencilRuler, Plane, Sprout, type LucideIcon } from 'lucide-react';
import { BrushCleaning } from './BrushCleaning';

// Bundle supported graphics; Supabase tags store icon names rather than assets.
const icons: Record<string, LucideIcon> = {
  bath: Bath, cpu: Cpu, dumbbell: Dumbbell, 'gamepad-2': Gamepad2, gift: Gift, music: Music,
  'paw-print': PawPrint, 'pencil-ruler': PencilRuler, plane: Plane, sprout: Sprout, 'brush-cleaning': BrushCleaning,
  archive: Archive, armchair: Armchair, 'bed-double': BedDouble, 'book-open': BookOpen,
  box: Box, 'briefcase-business': BriefcaseBusiness, car: Car, 'cooking-pot': CookingPot,
  'door-open': DoorOpen, drill: Drill, hammer: Hammer, house: House, lamp: Lamp,
  'map-pin': MapPin, package: Package, shirt: Shirt, sofa: Sofa, utensils: Utensils, wrench: Wrench,
};

export function InventoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Box;
  return <Icon className={className} aria-hidden="true" />;
}
