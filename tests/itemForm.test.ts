import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftFor, draftIsComplete, placementChoices } from '../src/domain/itemForm.ts';
import type { InventoryItem } from '../src/domain/inventory.ts';

const root: InventoryItem = { id: '9007199254740993', publicId: 'root', parentId: null, type: 'LOCATION', name: 'Hem', icon: 'map-pin' };
const box: InventoryItem = { ...root, id: '2', publicId: 'box', parentId: root.id, type: 'STORAGE', name: 'Låda' };
const object: InventoryItem = { ...root, id: '3', publicId: 'object', parentId: box.id, type: 'OBJECT', name: 'Sax', description: 'En befintlig beskrivning' };
const child: InventoryItem = { ...root, id: '4', publicId: 'child', parentId: root.id, name: 'Rum' };
const otherBox: InventoryItem = { ...box, id: '5', publicId: 'other-box', name: 'Annan låda' };
const items = [root, box, object, child, otherBox];

test('edit draft preserves all field values and string parent identities without mutating the source', () => {
  const draft = draftFor(object);
  assert.deepEqual(draft, { name: 'Sax', type: 'OBJECT', place: '2', description: 'En befintlig beskrivning' });
  draft.name = 'Ändrad';
  assert.equal(object.name, 'Sax');
  assert.equal(draftFor(box).place, root.id);
});
test('new drafts only offer existing locations and start incomplete', () => {
  const choices = placementChoices(items);
  assert.deepEqual(new Set(choices.map(choice => choice.value)), new Set([root.id, child.id]));
  assert.equal(draftIsComplete(draftFor(), choices), false);
});
test('editing preserves the actual storage parent without offering unrelated storage', () => {
  const choices = placementChoices(items, object);
  assert.equal(choices.find(choice => choice.value === box.id)?.label, 'Hem → Låda');
  assert.equal(choices.some(choice => choice.value === otherBox.id), false);
  assert.equal(draftIsComplete(draftFor(object), choices), true);
});
test('editing a root placement preserves Mitt hem and excludes self and descendants', () => {
  const choices = placementChoices(items, root);
  assert.deepEqual(choices, [{ value: '', label: 'Mitt hem' }]);
  assert.equal(draftIsComplete(draftFor(root), choices), true);
});
test('invalid parents and whitespace-only names do not mark a draft complete', () => {
  const choices = placementChoices(items, object);
  assert.equal(draftIsComplete({ ...draftFor(object), place: 'missing' }, choices), false);
  assert.equal(draftIsComplete({ ...draftFor(object), name: '   ' }, choices), false);
});
