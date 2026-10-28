import type { InventoryItem } from './inventory.ts';

export type SortMode = 'recent' | 'tag' | 'alphabetical';
export const sortModes: readonly SortMode[] = ['recent', 'tag', 'alphabetical'];
export const sortLabels: Record<SortMode, string> = {
  recent: 'Nyligen tillagda', tag: 'Tagg', alphabetical: 'A–Ö',
};
export function nextSortMode(mode: SortMode): SortMode {
  return sortModes[(sortModes.indexOf(mode) + 1) % sortModes.length];
}

const collator = new Intl.Collator('sv', { sensitivity: 'base', numeric: true });
export function sortInventory(items: readonly InventoryItem[], mode: SortMode): InventoryItem[] {
  return [...items].sort((a, b) => {
    // Database IDs are increasing bigint identities, including for newly saved items.
    if (mode === 'recent') {
      const left = BigInt(a.id), right = BigInt(b.id);
      return left > right ? -1 : left < right ? 1 : 0;
    }
    if (mode === 'tag') {
      if (Boolean(a.tag) !== Boolean(b.tag)) return a.tag ? -1 : 1;
      const category = collator.compare(a.tag?.name ?? '', b.tag?.name ?? '');
      if (category) return category;
    }
    return collator.compare(a.name, b.name) || collator.compare(a.id, b.id);
  });
}
