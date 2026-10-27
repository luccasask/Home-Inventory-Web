import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentLabel, type InventoryItem, type ItemType } from '../src/domain/inventory.ts';

function records(...types: ItemType[]): InventoryItem[] {
  return types.map((type, index) => ({ id: String(index), publicId: String(index), parentId: null, type, name: 'Test', icon: 'box' }));
}

test('content labels use Swedish singular and plural for each actual type', () => {
  assert.equal(contentLabel(records('LOCATION')), '1 plats');
  assert.equal(contentLabel(records('LOCATION', 'LOCATION')), '2 platser');
  assert.equal(contentLabel(records('STORAGE')), '1 förvaring');
  assert.equal(contentLabel(records('STORAGE', 'STORAGE')), '2 förvaringar');
  assert.equal(contentLabel(records('OBJECT')), '1 föremål');
  assert.equal(contentLabel(records('OBJECT', 'OBJECT')), '2 föremål');
});

test('mixed and empty contents are described accurately in a stable type order', () => {
  assert.equal(contentLabel(records('OBJECT', 'STORAGE', 'OBJECT', 'LOCATION')), '1 plats · 1 förvaring · 2 föremål');
  assert.equal(contentLabel([]), '0 föremål');
});
