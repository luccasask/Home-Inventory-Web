import {test} from 'node:test';
import assert from 'node:assert/strict';
import { canStartPull, PullRefreshTracker, PULL_REFRESH_THRESHOLD } from '../src/domain/pullRefresh.ts';

test('refresh only starts at the top, with one finger, no keyboard, no zoom and no blocked controls', () => {
  const valid = { touches: 1, contentTop: 0, documentTop: 0, zoom: 1, keyboardOpen: false, blocked: false };
  assert.equal(canStartPull(valid), true);
  for (const change of [{touches:2}, {contentTop:40}, {documentTop:50}, {zoom:1.2}, {keyboardOpen:true}, {blocked:true}]) {
    assert.equal(canStartPull({...valid,...change}), false);
  }
});

test('only an eligible downward drag past the threshold refreshes, and only once', () => {
  const tracker = new PullRefreshTracker();
  tracker.start(1, 100, 100, false);
  assert.equal(tracker.move(1, 100, 400).claimed, false);
  assert.equal(tracker.finish(1), false);
  tracker.start(1, 100, 100, true);
  assert.equal(tracker.move(1, 102, 100 + PULL_REFRESH_THRESHOLD).ready, true);
  assert.equal(tracker.finish(1), true);
  assert.equal(tracker.finish(1), false);
});
test('taps, horizontal navigation, upward scrolling and diagonal gestures do not refresh', () => {
  for (const [dx, dy] of [[2,3], [100,8], [0,-40], [50,55]]) {
    const tracker = new PullRefreshTracker();
    tracker.start(1,100,100,true);
    assert.equal(tracker.move(1,100+dx,100+dy).claimed,false);
    assert.equal(tracker.finish(1),false);
  }
});
test('releasing early, pulling back, another touch or cancellation cannot accidentally refresh', () => {
  const tracker = new PullRefreshTracker();
  tracker.start(1,100,100,true);
  assert.equal(tracker.move(1,100,180).claimed,true);
  assert.equal(tracker.finish(1),false);
  tracker.start(1,100,100,true);
  tracker.move(1,100,400);
  assert.equal(tracker.move(1,100,120).ready,false);
  assert.equal(tracker.finish(1),false);
  tracker.start(1,100,100,true);
  assert.equal(tracker.move(2,100,400).claimed,false);
  tracker.cancel();
  assert.equal(tracker.finish(1),false);
});
test('a gesture cancelled by horizontal intent cannot become a refresh, and the visual pull is bounded', () => {
  const tracker = new PullRefreshTracker();
  tracker.start(1,100,100,true);
  tracker.move(1,180,105);
  assert.equal(tracker.move(1,180,400).claimed,false);
  tracker.start(2,100,100,true);
  assert.equal(tracker.move(2,100,1000).distance,80);
});
