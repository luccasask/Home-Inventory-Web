import { routeFor, type InventoryItem } from './inventory.ts';

export type SwipeDirection = 'left' | 'right';
export interface SwipeTarget { path: string; panel: boolean }

export function swipeTarget(path: string, items: readonly InventoryItem[], direction: SwipeDirection, searchReturn?: unknown): SwipeTarget | null {
  if (path.startsWith('/add/')) {
    const edited = items.find(item => item.publicId === path.slice('/add/'.length));
    return direction === 'right' && edited ? { path: routeFor(edited), panel: false } : null;
  }
  if (path === '/add') return direction === 'right' ? { path: '/search', panel: true } : null;
  if (path === '/search') return { path: direction === 'right' ? '/' : '/add', panel: true };
  if (path === '/') return direction === 'left' ? { path: '/search', panel: true } : null;
  const current = items.find(item => routeFor(item) === path);
  if (!current) return null;
  if (direction === 'left') return { path: '/search', panel: true };
  // Only result links carry this origin; ordinary child links start fresh.
  if (typeof searchReturn === 'string' && (searchReturn === '/search' || searchReturn.startsWith('/search?'))) {
    return { path: searchReturn, panel: false };
  }
  if (current.parentId === null) return { path: '/', panel: false };
  const parent = items.find(item => item.id === current.parentId);
  return parent ? { path: routeFor(parent), panel: false } : null;
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
