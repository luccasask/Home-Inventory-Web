import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapDatabaseItem, validateHierarchy } from '../src/domain/databaseItems.ts';

const row = { id: '9007199254740993', public_id: '00000000-0000-4000-8000-000000000001', parent_id: null,
  type: 'LOCATION', name: 'Hem', manual_icon: null, description: '' };

test('retains bigint identities above the JavaScript safe integer range', () => {
  assert.equal(mapDatabaseItem(row).id, '9007199254740993');
  assert.throws(() => mapDatabaseItem({ ...row, id: Number(row.id) }), /ogiltigt ID/);
});

test('preserves public identity, parent, description and manual icon', () => {
  const item = mapDatabaseItem({ ...row, parent_id: '9007199254740992', description: 'Befintlig beskrivning', manual_icon: 'archive' });
  assert.equal(item.parentId, '9007199254740992');
  assert.equal(item.publicId, row.public_id);
  assert.equal(item.description, 'Befintlig beskrivning');
  assert.equal(item.icon, 'archive');
});

test('rejects partial hierarchies, duplicate identities and cycles', () => {
  const root = mapDatabaseItem(row);
  const child = mapDatabaseItem({ ...row, id: '2', parent_id: root.id });
  assert.doesNotThrow(() => validateHierarchy([root, child]));
  assert.throws(() => validateHierarchy([child]), /Hierarkin/);
  assert.throws(() => validateHierarchy([root, root]), /Dubbla/);
  assert.throws(() => validateHierarchy([{ ...root, parentId: child.id }, child]), /Hierarkin/);
});

test('rejects unsupported database types', () => {
  assert.throws(() => mapDatabaseItem({ ...row, type: 'UNEXPECTED' }), /stöds inte/);
});
