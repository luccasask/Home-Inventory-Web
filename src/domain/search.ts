import { ancestorsOf, type InventoryItem, type ItemType } from './inventory.ts';

const collator = new Intl.Collator('sv', { sensitivity: 'base', numeric: true });
function normalize(text: string) {
  return text.normalize('NFKC').toLocaleLowerCase('sv-SE').trim().replace(/\s+/g, ' ');
}
function words(text: string) { return text.match(/[\p{L}\p{N}]+/gu) ?? []; }

/** Adjacent transpositions count as one typo (e.g. kasturll -> kastrull). */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
      rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
}

export function searchInventory(items: readonly InventoryItem[], query: string, type: ItemType | null = null): InventoryItem[] {
  const needle = normalize(query);
  if (!needle) return items.filter(item => !type || item.type === type);
  const terms = words(needle);
  if (!terms.length) return [];
  return items.flatMap(item => {
    if (type && item.type !== type) return [];
    const name = normalize(item.name);
    const description = normalize(item.description ?? '');
    let rank = Infinity;
    if (name === needle) rank = 0;
    else if (name.startsWith(needle)) rank = 1;
    else if (name.includes(needle)) rank = 2;
    else if (terms.every(term => name.includes(term))) rank = 3;
    else if (terms.every(term => `${name} ${description}`.includes(term))) rank = 4;
    else {
      const path = normalize(ancestorsOf(items, item).map(parent => parent.name).join(' '));
      if (terms.every(term => `${name} ${description} ${path}`.includes(term))) rank = 5;
      else {
        const candidates = words(name);
        // Very short queries must match literally, to avoid unrelated results.
        if (terms.every(term => candidates.some(word => {
          if (word.includes(term)) return true;
          const allowance = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0;
          return allowance > 0 && Math.abs(term.length - word.length) <= allowance && distance(term, word) <= allowance;
        }))) rank = 6;
      }
    }
    return Number.isFinite(rank) ? [{ item, rank }] : [];
  }).sort((a, b) => a.rank - b.rank || collator.compare(a.item.name, b.item.name) || a.item.id.localeCompare(b.item.id))
    .map(result => result.item);
}
