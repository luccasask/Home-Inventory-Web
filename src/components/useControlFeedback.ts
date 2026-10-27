import type { DragEvent, MouseEvent, PointerEvent } from 'react';
import { bounce } from './motion';

function controlAt(target: EventTarget) {
  return target instanceof Element ? target.closest<HTMLElement>('button, a') : null;
}

function feedback(control: HTMLElement | null) {
  if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.closest('[inert]')) return;
  // Animate the control wrapper so an icon's selected/hover lift stays intact.
  const card = control.matches('.inventory-card, .add-card');
  bounce(control, card ? control.closest('.inventory-list--grid') ? 'grid' : 'list' : 'icon');
}

/** Shared feedback for every enabled control, including modal and Add tiles. */
export function useControlFeedback() {
  return {
    onPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
      if (!event.isPrimary || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      feedback(controlAt(event.target));
    },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (event.detail === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) feedback(controlAt(event.target));
    },
    onContextMenuCapture(event: MouseEvent<HTMLDivElement>) {
      if (controlAt(event.target)) event.preventDefault();
    },
    onDragStartCapture(event: DragEvent<HTMLDivElement>) {
      if (controlAt(event.target)) event.preventDefault();
    },
  };
}
