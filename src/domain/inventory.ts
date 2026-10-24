export type ItemType = 'LOCATION' | 'STORAGE' | 'OBJECT';

/** IDs are strings so PostgreSQL bigint IDs will not lose precision. */
export interface InventoryItem {
  id: string;
  publicId: string;
  parentId: string | null;
  type: ItemType;
  name: string;
  icon: string;
  description?: string;
}

export function childrenOf(items: readonly InventoryItem[], parentId: string | null) {
  return items.filter(item => item.parentId === parentId);
}

export function ancestorsOf(items: readonly InventoryItem[], item: InventoryItem) {
  const ancestors: InventoryItem[] = [];
  const visited = new Set([item.id]);
  let parentId = item.parentId;
  while (parentId !== null) {
    const parent = items.find(candidate => candidate.id === parentId);
    if (!parent || visited.has(parent.id)) break;
    ancestors.unshift(parent);
    visited.add(parent.id);
    parentId = parent.parentId;
  }
  return ancestors;
}

export function routeFor(item: InventoryItem) {
  return `/${item.type === 'LOCATION' ? 'location' : item.type === 'STORAGE' ? 'storage' : 'item'}/${item.publicId}`;
}
