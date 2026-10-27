import type { InventoryItem, ItemType } from './inventory';
import { mapDatabaseTag } from './tags.ts';

interface ItemRow {
  id: unknown;
  public_id: unknown;
  parent_id: unknown;
  type: unknown;
  name: unknown;
  manual_icon: unknown;
  description: unknown;
  revision?: unknown;
  category?: unknown;
}

function databaseId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new Error('Databasen returnerade ett ogiltigt ID.');
  }
  return value;
}

export function mapDatabaseItem(row: ItemRow): InventoryItem {
  if (!['LOCATION', 'STORAGE', 'OBJECT'].includes(String(row.type)) || typeof row.name !== 'string'
    || typeof row.public_id !== 'string' || typeof row.description !== 'string') {
    throw new Error('Databasens föremålsformat stöds inte.');
  }
  const type = row.type as ItemType;
  const tag = row.category == null ? undefined : mapDatabaseTag(row.category);
  return {
    id: databaseId(row.id),
    publicId: row.public_id,
    parentId: row.parent_id === null ? null : databaseId(row.parent_id),
    type,
    tag,
    name: row.name,
    description: row.description,
    revision: typeof row.revision === 'string' && /^\d+$/.test(row.revision) ? row.revision : undefined,
    icon: tag?.icon ?? (typeof row.manual_icon === 'string' && row.manual_icon ? row.manual_icon
      : type === 'LOCATION' ? 'map-pin' : type === 'STORAGE' ? 'package' : 'box'),
  };
}

/** Never silently display orphaned rows as root-level items. */
export function validateHierarchy(items: readonly InventoryItem[]) {
  const byId = new Map(items.map(item => [item.id, item]));
  if (byId.size !== items.length) throw new Error('Dubbla ID:n i databasens svar.');
  for (const item of items) {
    const seen = new Set([item.id]);
    let parent = item.parentId;
    while (parent !== null) {
      const ancestor = byId.get(parent);
      if (!ancestor || seen.has(parent)) throw new Error('Hierarkin kunde inte läsas fullständigt. Uppdatera och försök igen.');
      seen.add(parent);
      parent = ancestor.parentId;
    }
  }
}
