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
test('right swipes pop history on every panel instead of guessing a parent or menu neighbor', () => {
  for (const path of ['/', '/search', '/add', '/item/item', '/storage/box', '/location/place', '/add/item']) {
    assert.deepEqual(swipeTarget(path, items, 'right', 3), { historyDelta: -1 });
  }
});
test('a direct entry with no app history cannot swipe outside the app', () => {
  for (const path of ['/', '/search', '/add', '/item/item', '/storage/box', '/add/item']) {
    assert.equal(swipeTarget(path, items, 'right'), null);
    for (const index of [-1, NaN, Infinity, 1.5]) assert.equal(swipeTarget(path, items, 'right', index), null);
  }
});
test('back remains available while items load or a record is missing, without opening invalid forward routes', () => {
  assert.deepEqual(swipeTarget('/item/missing', [], 'right', 1), { historyDelta: -1 });
  assert.deepEqual(swipeTarget('/item/item', [item], 'right', 1), { historyDelta: -1 });
  assert.equal(swipeTarget('/item/missing', items, 'left'), null);
  assert.equal(swipeTarget('/add/item', items, 'left'), null);
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
