export function isIOSSafari(userAgent: string, maxTouchPoints: number): boolean {
  const ios = /iP(?:hone|ad|od)/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return ios && /Safari\//.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

export function shouldGuardSafariEdge({ x, y, width, page, touchCount, zoom, pageScrollable }: {
  x: number; y: number; width: number;
  page: { left: number; right: number; top: number; bottom: number };
  touchCount: number; zoom: number; pageScrollable: boolean;
}): boolean {
  if (touchCount !== 1 || zoom !== 1 || pageScrollable || width <= 0) return false;
  const edge = x >= 0 && x <= 20 || x >= width - 20 && x <= width;
  // Own only the non-scrolling gutter. Content, controls and native vertical
  // scrolling keep their existing touch handling.
  return edge && (x < page.left || x > page.right) && y >= page.top && y < page.bottom;
}
