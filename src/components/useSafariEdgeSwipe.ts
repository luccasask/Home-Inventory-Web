import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { isIOSSafari, shouldGuardSafariEdge } from '../domain/safariEdge';
import { SwipeTracker, type SwipeDirection } from '../domain/swipe';

/** Claim Safari's edge gesture only in the empty margin outside page content. */
export function useSafariEdgeSwipe(container: RefObject<HTMLElement | null>, navigationKey: string,
  onSwipe: (direction: SwipeDirection) => void, onTap: () => void) {
  const callbacks = useRef({ onSwipe, onTap });
  const tracker = useRef(new SwipeTracker());
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  useLayoutEffect(() => { callbacks.current = { onSwipe, onTap }; });
  useLayoutEffect(() => { tracker.current.cancel(); gesture.current = null; }, [navigationKey]);

  useEffect(() => {
    const element = container.current;
    if (!element || !isIOSSafari(navigator.userAgent, navigator.maxTouchPoints)) return;
    const cancel = () => { tracker.current.cancel(); gesture.current = null; };
    const start = (event: TouchEvent) => {
      cancel();
      const touch = event.touches[0];
      const page = element.querySelector('.page-transition');
      if (!touch || !page || !event.cancelable || !(event.target instanceof Element)
        || event.target.closest('a, button, input, textarea, select, nav, dialog, [contenteditable="true"]')) return;
      const bounds = page.getBoundingClientRect();
      const toolbar = element.querySelector('.context-toolbar');
      const viewport = window.visualViewport;
      if (viewport && viewport.height < window.innerHeight - 2) return; // On-screen keyboard.
      if (!shouldGuardSafariEdge({ x: touch.clientX, y: touch.clientY, width: window.innerWidth,
        page: { left: bounds.left, right: bounds.right, top: bounds.top,
          bottom: toolbar?.getBoundingClientRect().top ?? bounds.bottom },
        touchCount: event.touches.length, zoom: viewport?.scale ?? 1,
        pageScrollable: (document.scrollingElement?.scrollHeight ?? 0) > window.innerHeight + 1 })) return;
      // Safari decides on browser navigation at touchstart, before pointermove.
      event.preventDefault();
      gesture.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
      tracker.current.start(touch.identifier, touch.clientX, touch.clientY);
    };
    const move = (event: TouchEvent) => {
      if (!gesture.current) return;
      if (event.touches.length !== 1) { cancel(); return; }
      const touch = Array.from(event.touches).find(t => t.identifier === gesture.current?.id);
      if (!touch) { cancel(); return; }
      if (event.cancelable) event.preventDefault();
      tracker.current.move(touch.identifier, touch.clientX, touch.clientY);
    };
    const end = (event: TouchEvent) => {
      const current = gesture.current;
      if (!current) return;
      const touch = Array.from(event.changedTouches).find(t => t.identifier === current.id);
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      const result = tracker.current.finish(touch.identifier, touch.clientX, touch.clientY, element.clientWidth);
      gesture.current = null;
      if (result.direction) callbacks.current.onSwipe(result.direction);
      else if (Math.abs(touch.clientX - current.x) < 12 && Math.abs(touch.clientY - current.y) < 12) callbacks.current.onTap();
    };
    element.addEventListener('touchstart', start, { passive: false });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', end, { passive: false });
    element.addEventListener('touchcancel', cancel);
    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', cancel);
      cancel();
    };
  }, [container]);
}
