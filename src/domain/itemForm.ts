import { ancestorsOf, type InventoryItem, type ItemType } from './inventory.ts';

export interface ItemDraft { name: string; type: ItemType; place: string; description: string }
export interface PlacementChoice { value: string; label: string }

export function draftFor(item?: InventoryItem, initialParent?: InventoryItem | null): ItemDraft {
  return { name: item?.name ?? '', type: item?.type ?? 'OBJECT', place: item ? item.parentId ?? '' : initialParent?.id ?? '', description: item?.description ?? '' };
}

export function placementChoices(items: readonly InventoryItem[], edited?: InventoryItem, initialParent?: InventoryItem | null): PlacementChoice[] {
  const candidates = items.filter(item => item.type === 'LOCATION' && item.id !== edited?.id
    && (!edited || !ancestorsOf(items, item).some(parent => parent.id === edited.id)));
  // An existing storage placement must remain selected, rather than silently
  // moving an object out of its container when its other fields are edited.
  const currentParent = edited ? items.find(item => item.id === edited.parentId)
    : items.find(item => item.id === initialParent?.id && item.type !== 'OBJECT');
  if (currentParent && !candidates.some(item => item.id === currentParent.id)) candidates.push(currentParent);
  const choices = candidates.map(item => ({ value: item.id,
    label: [...ancestorsOf(items, item).map(parent => parent.name), item.name].join(' → '),
  })).sort((a, b) => a.label.localeCompare(b.label, 'sv'));
  if (edited?.parentId === null || (!edited && initialParent === null)) choices.unshift({ value: '', label: 'Mitt hem' });
  return choices;
}

export function draftIsComplete(draft: ItemDraft, choices: readonly PlacementChoice[]): boolean {
  return Boolean(draft.name.trim()) && ['LOCATION', 'STORAGE', 'OBJECT'].includes(draft.type)
    && choices.some(choice => choice.value === draft.place);
}
