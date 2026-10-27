import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SwipeTracker, swipeDirection, swipeTarget } from '../src/domain/swipe.ts';
import type { InventoryItem } from '../src/domain/inventory.ts';

const place: InventoryItem = { id: '1', publicId: 'place', parentId: null, type: 'LOCATION', name: 'Kök', icon: 'map-pin' };
const box: InventoryItem = { ...place, id: '2', publicId: 'box', parentId: '1', type: 'STORAGE', name: 'Låda' };
const item: InventoryItem = { ...place, id: '3', publicId: 'item', parentId: '2', type: 'OBJECT', name: 'Sax' };
const items = [place, box, item];

test('left swipes retain forward panel navigation without wrapping', () => {
  assert.deepEqual(swipeTarget('/', items, 'left'), { path: '/search', panel: true });
  assert.deepEqual(swipeTarget('/search', items, 'left'), { path: '/add', panel: true });
  assert.equal(swipeTarget('/add', items, 'left'), null);
  assert.deepEqual(swipeTarget('/item/item', items, 'left'), { path: '/search', panel: true });
});
test('ordinary right swipes follow parents and the previous main panel', () => {
  assert.deepEqual(swipeTarget('/item/item', items, 'right'), { path: '/storage/box', panel: false });
  assert.deepEqual(swipeTarget('/storage/box', items, 'right'), { path: '/location/place', panel: false });
  assert.deepEqual(swipeTarget('/location/place', items, 'right'), { path: '/', panel: false });
  assert.deepEqual(swipeTarget('/search', items, 'right'), { path: '/', panel: true });
  assert.deepEqual(swipeTarget('/add', items, 'right'), { path: '/search', panel: true });
  assert.equal(swipeTarget('/', items, 'right'), null);
});
test('only result entries return to their captured search, including its complete query and filter', () => {
  const source = '/search?q=k%C3%B6k&type=STORAGE';
  for (const path of ['/item/item', '/storage/box', '/location/place']) {
    assert.deepEqual(swipeTarget(path, items, 'right', source), { path: source, panel: false });
  }
  assert.deepEqual(swipeTarget('/item/item', items, 'left', source), { path: '/search', panel: true });
  // A normal child entry has no origin and therefore follows its real parent.
  assert.deepEqual(swipeTarget('/item/item', items, 'right'), { path: '/storage/box', panel: false });
});
test('editors return to the edited record and unrelated panels ignore search origins', () => {
  assert.deepEqual(swipeTarget('/add/item', items, 'right', '/search?q=sax'), { path: '/item/item', panel: false });
  assert.deepEqual(swipeTarget('/add', items, 'right', '/search?q=sax'), { path: '/search', panel: true });
  assert.equal(swipeTarget('/add/item', items, 'left'), null);
});

test('invalid search origins and missing records cannot open unrelated destinations', () => {
  for (const source of [undefined, null, 3, '//example.com', 'https://example.com', '/searching', '/search/other']) {
    assert.deepEqual(swipeTarget('/item/item', items, 'right', source), { path: '/storage/box', panel: false });
  }
  assert.equal(swipeTarget('/item/missing', [], 'right', '/search?q=sax'), null);
  assert.equal(swipeTarget('/item/item', [item], 'right'), null);
  assert.equal(swipeTarget('/item/missing', items, 'left'), null);
});
test('taps, short drags and vertical or diagonal scrolling do not trigger swipes', () => {
  for (const [dx, dy] of [[0, 0], [25, 0], [100, 100], [20, 150]]) assert.equal(swipeDirection(dx, dy, 430), null);
  assert.equal(swipeDirection(90, 10, 430), 'right');
  assert.equal(swipeDirection(-90, 10, 430), 'left');
});
test('distance adapts to the screen but is bounded for large displays', () => {
  assert.equal(swipeDirection(55, 0, 320), null);
  assert.equal(swipeDirection(56, 0, 320), 'right');
  assert.equal(swipeDirection(96, 0, 1200), 'right');
});
test('vertical intent stays cancelled even if the finger later moves sideways', () => {
  const tracker = new SwipeTracker(); tracker.start(1, 100, 100);
  assert.equal(tracker.move(1, 105, 140), false);
  assert.deepEqual(tracker.finish(1, 250, 145, 430), { direction: null, dragged: false });
});
test('a horizontal gesture completes once and marks its synthetic click for suppression', () => {
  const tracker = new SwipeTracker(); tracker.start(1, 100, 100);
  assert.equal(tracker.move(1, 125, 103), true);
  assert.deepEqual(tracker.finish(1, 220, 110, 430), { direction: 'right', dragged: true });
  assert.deepEqual(tracker.finish(1, 220, 110, 430), { direction: null, dragged: false });
});
test('cancellation and other pointer IDs cannot complete a gesture', () => {
  const tracker = new SwipeTracker(); tracker.start(1, 100, 100);
  assert.deepEqual(tracker.finish(2, 250, 100, 430), { direction: null, dragged: false });
  tracker.cancel();
  assert.deepEqual(tracker.finish(1, 250, 100, 430), { direction: null, dragged: false });
});
test('an insufficient horizontal drag is suppressed as a click without navigating', () => {
  const tracker = new SwipeTracker(); tracker.start(1, 100, 100); tracker.move(1, 120, 100);
  assert.deepEqual(tracker.finish(1, 130, 100, 430), { direction: null, dragged: true });
});
