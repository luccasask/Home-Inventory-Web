import { useLayoutEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { SwipeTracker, type SwipeDirection } from '../domain/swipe';

export function useSwipeNavigation(navigationKey: string, onSwipe: (direction: SwipeDirection) => void) {
  const tracker = useRef(new SwipeTracker());
  const suppressClickUntil = useRef(0);
  useLayoutEffect(() => { tracker.current.cancel(); }, [navigationKey]);

  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      suppressClickUntil.current = 0;
      if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType) || event.button !== 0
        || !(event.target instanceof Element)
        || event.target.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="slider"]')) {
        tracker.current.cancel(); return;
      }
      tracker.current.start(event.pointerId, event.clientX, event.clientY);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (!tracker.current.move(event.pointerId, event.clientX, event.clientY)) return;
      // Only capture after a clear horizontal intent. Vertical scrolling and
      // pinch zoom remain native, and a tap still reaches the original link.
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      if (event.cancelable) event.preventDefault();
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      const result = tracker.current.finish(event.pointerId, event.clientX, event.clientY, event.currentTarget.clientWidth);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (result.dragged) suppressClickUntil.current = Date.now() + 600;
      if (result.direction) onSwipe(result.direction);
    },
    onPointerCancel() { tracker.current.cancel(); },
    onLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
      // Transferring implicit capture from a touched child also bubbles here.
      if (event.target === event.currentTarget) tracker.current.cancel();
    },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      // A dragged card must not open when the finger lifts, even at a panel's
      // boundary. A new pointer-down clears this guard for the next normal tap.
      if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
        suppressClickUntil.current = 0;
        event.preventDefault(); event.stopPropagation();
      }
    },
  };
}
