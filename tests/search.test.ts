import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchInventory } from '../src/domain/search.ts';
import type { InventoryItem } from '../src/domain/inventory.ts';

function item(id: string, name: string, extra: Partial<InventoryItem> = {}): InventoryItem {
  return { id, publicId: `public-${id}`, parentId: null, type: 'OBJECT', name, icon: 'box', ...extra };
}
const items = [item('1', 'Kastrull'), item('2', 'Stor kastrull'), item('3', 'Kastrullock'),
  item('4', 'Matlåda', { description: 'Används tillsammans med kastrull' }),
  item('5', 'Kök', { type: 'LOCATION' }), item('6', 'Kökslåda', { type: 'STORAGE', parentId: '5' }),
  item('7', 'Kastrull', { parentId: '6' }), item('8', 'Våg', { parentId: '6' })];

test('ranks exact names ahead of prefixes, substrings, and description matches across parents', () => {
  assert.deepEqual(searchInventory(items, '  KASTRULL ').map(i => i.id), ['1', '7', '3', '2', '4']);
});
test('filters types without changing relative relevance or requiring shared parents', () => {
  assert.deepEqual(searchInventory(items, 'kök', 'LOCATION').map(i => i.id), ['5']);
  assert.deepEqual(searchInventory(items, 'kök', 'STORAGE').map(i => i.id), ['6']);
  assert.deepEqual(searchInventory(items, 'kök', 'OBJECT').map(i => i.id), ['7', '8']);
});
test('supports small spelling mistakes and swapped adjacent letters without fuzzing short queries', () => {
  assert.equal(searchInventory(items, 'kastrul')[0].name, 'Kastrull');
  assert.equal(searchInventory(items, 'kasturll')[0].name, 'Kastrull');
  assert.deepEqual(searchInventory(items, 'xy'), []);
});
test('keeps Swedish letters distinct and handles empty or punctuation-only input', () => {
  assert.deepEqual(searchInventory(items, 'vag'), []);
  assert.equal(searchInventory(items, 'VÅG')[0].name, 'Våg');
  assert.deepEqual(searchInventory(items, '   '), items);
  assert.deepEqual(searchInventory(items, '', 'STORAGE').map(i => i.id), ['6']);
  assert.deepEqual(searchInventory(items, '???'), []);
});
test('requires all query terms and uses stable sorting for equal matches', () => {
  assert.deepEqual(searchInventory(items, 'kastrull stor').map(i => i.id), ['2']);
  assert.deepEqual(searchInventory([...items].reverse(), 'kastrull').map(i => i.id), searchInventory(items, 'kastrull').map(i => i.id));
});
