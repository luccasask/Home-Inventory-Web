import { routeFor, type InventoryItem } from './inventory.ts';

export type SwipeDirection = 'left' | 'right';
export type SwipeTarget = { path: string; panel: boolean } | { historyDelta: -1 };

export function swipeTarget(path: string, items: readonly InventoryItem[], direction: SwipeDirection, historyIndex = 0): SwipeTarget | null {
  // React Router stores the app history index. Back restores the complete URL,
  // including a search query/filter, without pushing another history entry.
  if (direction === 'right') return Number.isSafeInteger(historyIndex) && historyIndex > 0 ? { historyDelta: -1 } : null;
  if (path.startsWith('/add')) return null;
  if (path === '/search') return { path: '/add', panel: true };
  if (path === '/' || items.some(item => routeFor(item) === path)) return { path: '/search', panel: true };
  return null;
}

export function swipeDirection(dx: number, dy: number, width: number): SwipeDirection | null {
  const threshold = Math.min(96, Math.max(56, width * .16));
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.4) return null;
  return dx > 0 ? 'right' : 'left';
}

/** One primary gesture; a vertical intent permanently cancels this attempt. */
export class SwipeTracker {
  private touch: { id: number; x: number; y: number; horizontal: boolean } | null = null;
  start(id: number, x: number, y: number) { this.touch = { id, x, y, horizontal: false }; }
  cancel() { this.touch = null; }
  move(id: number, x: number, y: number): boolean {
    const touch = this.touch;
    if (!touch || touch.id !== id) return false;
    const dx = Math.abs(x - touch.x);
    const dy = Math.abs(y - touch.y);
    if (!touch.horizontal && dy > 12 && dy >= dx) { this.cancel(); return false; }
    if (dx >= 12 && dx > dy * 1.4) touch.horizontal = true;
    return touch.horizontal;
  }
  finish(id: number, x: number, y: number, width: number): { direction: SwipeDirection | null; dragged: boolean } {
    this.move(id, x, y);
    const touch = this.touch;
    if (!touch || touch.id !== id) return { direction: null, dragged: false };
    this.cancel();
    return { direction: touch.horizontal ? swipeDirection(x - touch.x, y - touch.y, width) : null, dragged: touch.horizontal };
  }
}
