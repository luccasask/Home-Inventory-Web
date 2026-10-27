export const PULL_REFRESH_THRESHOLD = 150;
export interface PullState { distance: number; claimed: boolean; ready: boolean }
const idle: PullState = { distance: 0, claimed: false, ready: false };

export function canStartPull({ touches, contentTop, documentTop, zoom, keyboardOpen, blocked }: {
  touches: number; contentTop: number; documentTop: number; zoom: number; keyboardOpen: boolean; blocked: boolean;
}) {
  return touches === 1 && contentTop <= 1 && documentTop <= 1 && Math.abs(zoom - 1) <= .01 && !keyboardOpen && !blocked;
}

/** Vertical intent stays separate from taps, scrolling and horizontal navigation. */
export class PullRefreshTracker {
  private touch: { id: number; x: number; y: number; claimed: boolean; ready: boolean } | null = null;
  start(id: number, x: number, y: number, eligible: boolean) {
    this.touch = eligible ? { id, x, y, claimed: false, ready: false } : null;
  }
  cancel() { this.touch = null; }
  move(id: number, x: number, y: number): PullState {
    const touch = this.touch;
    if (!touch || touch.id !== id) return idle;
    const dx = Math.abs(x - touch.x), dy = y - touch.y;
    if (!touch.claimed) {
      if (dy < -8 || (dx > 10 && dx >= Math.abs(dy))) { this.cancel(); return idle; }
      if (dy < 10) return idle;
      if (dy <= dx * 1.5) { this.cancel(); return idle; }
      touch.claimed = true;
    }
    touch.ready = dy >= PULL_REFRESH_THRESHOLD;
    return { distance: Math.min(80, Math.max(0, dy) * .4), claimed: true, ready: touch.ready };
  }
  finish(id: number): boolean {
    const ready = this.touch?.id === id && this.touch.claimed && this.touch.ready;
    this.cancel(); return Boolean(ready);
  }
}
