import { mapDatabaseItem, validateHierarchy } from '../domain/databaseItems';
import type { InventoryItem } from '../domain/inventory';
import { configurationError, inventoryId, supabase } from './supabase';

export async function loadInventory(signal: AbortSignal): Promise<readonly InventoryItem[]> {
  if (!supabase) throw new Error(configurationError ?? 'Databasanslutningen är inte klar.');
  const request = new AbortController();
  const cancel = () => request.abort();
  if (signal.aborted) cancel();
  else signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 20_000);
  const items: InventoryItem[] = [];
  const pageSize = 500;
  try {
    for (let offset = 0; ; offset += pageSize) {
      // Cast bigint values on the server before JSON serialization to retain all digits.
      const { data, error } = await supabase.from('items')
        .select('id::text,public_id,parent_id::text,type,name,manual_icon,description')
        .eq('inventory_id', inventoryId)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)
        .abortSignal(request.signal);
      if (error) throw new Error('Innehållet kunde inte hämtas från Supabase. Kontrollera anslutningen och försök igen.');
      items.push(...(data ?? []).map(mapDatabaseItem));
      if (!data || data.length < pageSize) break;
    }
    validateHierarchy(items);
    return items;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
