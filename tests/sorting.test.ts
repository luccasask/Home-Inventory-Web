import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortInventory, nextSortMode } from '../src/domain/sorting.ts';
import type { InventoryItem } from '../src/domain/inventory.ts';

const item = (id: string, name: string, category?: string): InventoryItem => ({
  id, name, publicId: id, parentId: null, type: 'OBJECT', icon: 'box',
  tag: category ? { id: category, name: category, icon: 'tag' } : undefined,
});
test('recent sorts bigint insertion identities without losing precision or mutating input', () => {
  const items = [item('9007199254740992', 'Z'), item('9007199254740993', 'A'), item('10', 'B')];
  assert.deepEqual(sortInventory(items, 'recent').map(i => i.id), ['9007199254740993', '9007199254740992', '10']);
  assert.equal(items[0].name, 'Z');
});
test('categories stay together, alphabetize within groups, and place untagged items last', () => {
  const items = [item('1', 'A'), item('2', 'Z', 'Kök'), item('3', 'A', 'Kök'), item('4', 'B', 'Elektronik')];
  assert.deepEqual(sortInventory(items, 'tag').map(i => i.id), ['4', '3', '2', '1']);
});
test('alphabetical ordering follows Swedish with numeric names', () => {
  const items = ['Ö', 'Å', 'Z', 'Ä', 'A10', 'A2'].map((name, index) => item(String(index + 1), name));
  assert.deepEqual(sortInventory(items, 'alphabetical').map(i => i.name), ['A2', 'A10', 'Z', 'Å', 'Ä', 'Ö']);
});
test('sorting cycles through all three modes and handles empty results', () => {
  assert.equal(nextSortMode('recent'), 'tag');
  assert.equal(nextSortMode('tag'), 'alphabetical');
  assert.equal(nextSortMode('alphabetical'), 'recent');
  assert.deepEqual(sortInventory([], 'tag'), []);
});
