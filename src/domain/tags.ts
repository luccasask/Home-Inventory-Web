export interface InventoryTag { id: string; name: string; icon: string }

export function mapDatabaseTag(value: unknown): InventoryTag {
  const row = value as { id?: unknown; name?: unknown; icon_name?: unknown } | null;
  if (!row || typeof row.id !== 'string' || !/^[1-9]\d*$/.test(row.id)
    || typeof row.name !== 'string' || typeof row.icon_name !== 'string' || !row.icon_name) {
    throw new Error('Databasens taggformat stöds inte.');
  }
  return { id: row.id, name: row.name, icon: row.icon_name };
}
