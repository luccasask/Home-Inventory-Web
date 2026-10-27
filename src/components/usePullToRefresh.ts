import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { canStartPull, PullRefreshTracker, type PullState } from '../domain/pullRefresh';

const idle: PullState & { refreshing: boolean } = { distance: 0, claimed: false, ready: false, refreshing: false };

/** Only supplements installed apps; Safari's ordinary browser gesture stays native. */
export function usePullToRefresh(container: RefObject<HTMLElement | null>, navigationKey: string, enabled: boolean) {
  const [state, setState] = useState(idle);
  const tracker = useRef(new PullRefreshTracker());
  const gesture = useRef<{ id: number; claimed: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  useLayoutEffect(() => { tracker.current.cancel(); gesture.current = null; setState(idle); }, [navigationKey, enabled]);

  useEffect(() => {
    const element = container.current;
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!element || !installed || !enabled) return;
    let reloading = false;
    let reloadTimer = 0;
    document.documentElement.classList.add('has-pull-refresh');
    const cancel = () => {
      tracker.current.cancel(); gesture.current = null;
      if (!reloading) setState(idle);
    };
    const start = (event: TouchEvent) => {
      cancel();
      suppressClickUntil.current = 0;
      const target = event.target;
      const touch = event.touches[0];
      const page = element.querySelector('.inventory-page:not([aria-hidden="true"])');
      const area = page?.querySelector('.inventory-content');
      const viewport = window.visualViewport;
      if (reloading || !touch || !(target instanceof Element) || !canStartPull({
        touches: event.touches.length, contentTop: area?.scrollTop ?? 0, documentTop: document.scrollingElement?.scrollTop ?? 0,
        zoom: viewport?.scale ?? 1, keyboardOpen: Boolean(viewport && viewport.height < window.innerHeight - 2),
        blocked: Boolean(element.closest('[hidden]') || document.querySelector('dialog[open]') || !page?.contains(target)
          || target.closest('input, textarea, select, button, nav, [inert], [contenteditable="true"]')
          || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')),
      })) return;
      tracker.current.start(touch.identifier, touch.clientX, touch.clientY, true);
      gesture.current = { id: touch.identifier, claimed: false };
    };
    const move = (event: TouchEvent) => {
      const current = gesture.current;
      if (!current) return;
      if (event.touches.length !== 1 || !event.cancelable) { cancel(); return; }
      const touch = Array.from(event.touches).find(t => t.identifier === current.id);
      if (!touch) { cancel(); return; }
      const next = tracker.current.move(touch.identifier, touch.clientX, touch.clientY);
      if (!next.claimed) return;
      current.claimed = true;
      event.preventDefault();
      setState({ ...next, refreshing: false });
    };
    const end = (event: TouchEvent) => {
      const current = gesture.current;
      if (!current) return;
      const touch = Array.from(event.changedTouches).find(t => t.identifier === current.id);
      if (!touch) return;
      if (tracker.current.move(touch.identifier, touch.clientX, touch.clientY).claimed) current.claimed = true;
      const ready = tracker.current.finish(current.id);
      gesture.current = null;
      if (current.claimed) {
        if (event.cancelable) event.preventDefault();
        suppressClickUntil.current = Date.now() + 700;
      }
      if (ready) {
        reloading = true;
        setState({ distance: 60, claimed: false, ready: false, refreshing: true });
        reloadTimer = window.setTimeout(() => window.location.reload(), 120);
      } else setState(idle);
    };
    const click = (event: MouseEvent) => {
      if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    const visibility = () => { if (document.visibilityState === 'hidden') cancel(); };
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', end, { passive: false });
    element.addEventListener('touchcancel', cancel);
    element.addEventListener('click', click, true);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(reloadTimer); reloading = false; cancel();
      document.documentElement.classList.remove('has-pull-refresh');
      element.removeEventListener('touchstart', start); element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end); element.removeEventListener('touchcancel', cancel);
      element.removeEventListener('click', click, true); document.removeEventListener('visibilitychange', visibility);
    };
  }, [container, enabled, navigationKey]);
  return state;
}
