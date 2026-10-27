import { mapDatabaseItem, validateHierarchy } from '../domain/databaseItems';
import type { InventoryItem } from '../domain/inventory';
import type { ItemDraft } from '../domain/itemForm';
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
        .select('id::text,public_id,parent_id::text,type,name,manual_icon,description,revision::text')
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

function mutationError(code?: string): Error {
  if (code === '40001') return new Error('Föremålet har ändrats på annat håll. Dina fält finns kvar. Öppna föremålet på nytt innan du sparar.');
  if (code === '42501' || code === 'PGRST301') return new Error('Du saknar behörighet eller behöver logga in igen.');
  if (code === '23514' || code === '23503') return new Error('Placeringen eller typen är inte tillåten. Kontrollera att föremålet inte flyttas in i sig självt och att platsen finns kvar.');
  return new Error('Ändringen kunde inte bekräftas. Kontrollera anslutningen och försök igen.');
}

export async function saveInventoryItem(publicId: string, draft: ItemDraft, original?: InventoryItem): Promise<InventoryItem> {
  if (!supabase) throw new Error(configurationError ?? 'Anslutningen saknas.');
  const { data, error } = await supabase.rpc('web_save_item', {
    p_inventory: inventoryId, p_public_id: publicId, p_expected_revision: original?.revision ?? null,
    p_name: draft.name.trim(), p_type: draft.type, p_parent: draft.place === 'home' ? null : draft.place,
    p_description: draft.description,
  });
  if (error) throw mutationError(error.code);
  return mapDatabaseItem(data);
}

export async function deleteInventoryItem(item: InventoryItem): Promise<void> {
  if (!supabase) throw new Error(configurationError ?? 'Anslutningen saknas.');
  const { error } = await supabase.rpc('web_delete_item', {
    p_inventory: inventoryId, p_public_id: item.publicId, p_expected_revision: item.revision,
  });
  if (error) throw mutationError(error.code);
}
