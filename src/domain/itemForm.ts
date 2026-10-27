import { ancestorsOf, type InventoryItem, type ItemType } from './inventory.ts';

export interface ItemDraft { name: string; type: ItemType; place: string; description: string; tagId: string }
export interface PlacementChoice { value: string; label: string }

export function draftFor(item?: InventoryItem, initialParent?: InventoryItem | null): ItemDraft {
  return { name: item?.name ?? '', type: item?.type ?? 'OBJECT', place: item ? item.parentId ?? 'home' : initialParent === null ? 'home' : initialParent?.id ?? '', description: item?.description ?? '', tagId: item?.tag?.id ?? '' };
}

export function placementChoices(items: readonly InventoryItem[], edited?: InventoryItem, _initialParent?: InventoryItem | null, type: ItemType = edited?.type ?? 'OBJECT'): PlacementChoice[] {
  const candidates = items.filter(item => item.type !== 'OBJECT' && (type !== 'LOCATION' || item.type === 'LOCATION') && item.id !== edited?.id
    && (!edited || !ancestorsOf(items, item).some(parent => parent.id === edited.id)));
  const choices = candidates.map(item => ({ value: item.id,
    label: [...ancestorsOf(items, item).map(parent => parent.name), item.name].join(' → '),
  })).sort((a, b) => a.label.localeCompare(b.label, 'sv'));
  choices.unshift({ value: 'home', label: 'Mitt hem' });
  return choices;
}

export function draftIsComplete(draft: ItemDraft, choices: readonly PlacementChoice[]): boolean {
  return Boolean(draft.name.trim()) && ['LOCATION', 'STORAGE', 'OBJECT'].includes(draft.type)
    && draft.name.trim().length <= 120 && choices.some(choice => choice.value === draft.place);
}
