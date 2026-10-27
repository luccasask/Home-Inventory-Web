import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageDirection } from '../src/domain/navigation.ts';

test('all six main-panel changes follow menu order rather than growing history indices', () => {
  const panels = ['/', '/search', '/add'];
  for (let from = 0; from < panels.length; from++) for (let to = 0; to < panels.length; to++) {
    if (from === to) continue;
    assert.equal(pageDirection({ from: panels[from], to: panels[to], viaPanelMenu: true,
      back: false, previousIndex: 5, nextIndex: 6 }), to > from ? 'forward' : 'back');
  }
});
test('opening a search result still moves forward into the item', () => {
  assert.equal(pageDirection({ from: '/search', to: '/item/example', viaPanelMenu: false,
    back: false, previousIndex: 5, nextIndex: 6 }), 'forward');
});
test('parent navigation and browser Back/Forward preserve their directions', () => {
  const base = { from: '/item/example', to: '/storage/parent', viaPanelMenu: false, previousIndex: 5 };
  assert.equal(pageDirection({ ...base, back: true, nextIndex: 6 }), 'back');
  assert.equal(pageDirection({ ...base, back: false, nextIndex: 4 }), 'back');
  assert.equal(pageDirection({ ...base, back: false, nextIndex: 6 }), 'forward');
});
test('going to Home from inside an inventory branch keeps the parent direction', () => {
  assert.equal(pageDirection({ from: '/item/example', to: '/', viaPanelMenu: true,
    back: true, previousIndex: 5, nextIndex: 6 }), 'back');
});
