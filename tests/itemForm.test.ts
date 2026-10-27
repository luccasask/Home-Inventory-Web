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
  assert.deepEqual(draft, { name: 'Sax', type: 'OBJECT', place: '2', description: 'En befintlig beskrivning', tagId: '' });
  draft.name = 'Ändrad';
  assert.equal(object.name, 'Sax');
  assert.equal(draftFor(box).place, root.id);
});
test('new drafts offer existing locations and containers, and start incomplete', () => {
  const choices = placementChoices(items);
  assert.deepEqual(new Set(choices.map(choice => choice.value)), new Set(['home', root.id, child.id, box.id, otherBox.id]));
  assert.equal(choices.some(choice => choice.value === object.id), false);
  assert.equal(draftIsComplete(draftFor(), choices), false);
});
test('editing preserves the actual parent and allows moving into another container', () => {
  const choices = placementChoices(items, object);
  assert.equal(choices.find(choice => choice.value === box.id)?.label, 'Hem → Låda');
  assert.equal(choices.some(choice => choice.value === otherBox.id), true);
  assert.equal(draftIsComplete(draftFor(object), choices), true);
});
test('editing a root placement preserves Mitt hem and excludes self and descendants', () => {
  const choices = placementChoices(items, root);
  assert.deepEqual(choices, [{ value: 'home', label: 'Mitt hem' }]);
  assert.equal(draftIsComplete(draftFor(root), choices), true);
});
test('invalid parents and whitespace-only names do not mark a draft complete', () => {
  const choices = placementChoices(items, object);
  assert.equal(draftIsComplete({ ...draftFor(object), place: 'missing' }, choices), false);
  assert.equal(draftIsComplete({ ...draftFor(object), name: '   ' }, choices), false);
});

test('contextual add prefills the current location or storage without copying its other fields', () => {
  for (const parent of [root, box]) {
    const draft = draftFor(undefined, parent);
    const choices = placementChoices(items, undefined, parent);
    assert.deepEqual(draft, { name: '', type: 'OBJECT', place: parent.id, description: '', tagId: '' });
    assert.equal(draftIsComplete({ ...draft, name: 'Nytt föremål' }, choices), true);
    assert.equal(choices.some(choice => choice.value === otherBox.id), true);
  }
  assert.equal(placementChoices(items, undefined, box).find(choice => choice.value === box.id)?.label, 'Hem → Låda');
});

test('adding from Mitt hem selects the root while a normal Add remains unplaced', () => {
  const rootChoices = placementChoices(items, undefined, null);
  assert.deepEqual(rootChoices[0], { value: 'home', label: 'Mitt hem' });
  assert.equal(draftIsComplete({ ...draftFor(undefined, null), name: 'Ny plats' }, rootChoices), true);
  assert.equal(draftIsComplete({ ...draftFor(), name: 'Nytt föremål' }, placementChoices(items)), false);
});

test('edit placement wins over an add context and unavailable contextual storage is not offered', () => {
  assert.equal(draftFor(object, otherBox).place, box.id);
  assert.equal(placementChoices(items, object, otherBox).some(choice => choice.value === otherBox.id), true);
  assert.equal(placementChoices([root], undefined, box).some(choice => choice.value === box.id), false);
});

test('moving a container excludes itself and all descendants, while a location cannot enter storage', () => {
  const choices = placementChoices(items, box);
  assert.equal(choices.some(choice => choice.value === box.id || choice.value === object.id), false);
  assert.equal(choices.some(choice => choice.value === otherBox.id), true);
  const locationChoices = placementChoices(items, undefined, undefined, 'LOCATION');
  assert.deepEqual(new Set(locationChoices.map(choice => choice.value)), new Set(['home', root.id, child.id]));
});
