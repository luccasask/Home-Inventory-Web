const activeBounces = new WeakMap<Element, Animation>();

/** Animate feedback separately from the icon's CSS hover lift. */
export function bounce(element: Element, kind: 'icon' | 'grid' | 'list' = 'icon'): Animation | null {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate) return null;
  const scales = kind === 'icon' ? [1, .72, 1.18, .96, 1]
    : kind === 'grid' ? [1, .84, 1.06, .98, 1]
    : [1, .96, 1, .99, 1];
  activeBounces.get(element)?.cancel();
  const animation = element.animate(scales.map((scale, index) => ({
    transform: `scale(${scale})`, offset: [0, .25, .58, .8, 1][index],
  })), { duration: 420, easing: 'ease-out' });
  activeBounces.set(element, animation);
  return animation;
}
