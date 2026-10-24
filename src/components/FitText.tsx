import { useLayoutEffect, useRef } from 'react';

/** Keep the original font size when possible; otherwise fit the complete title on one line. */
export function FitText({ children, className = '' }: { children: string; className?: string }) {
  const container = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = container.current;
    const label = text.current;
    if (!box || !label) return;
    let disposed = false;
    let frame = 0;

    const fit = () => {
      if (disposed) return;
      const maximum = parseFloat(getComputedStyle(box).fontSize);
      label.style.fontSize = `${maximum}px`;
      // Preserve an intrinsic width at the original size, so flex layout does not
      // progressively shrink the container as the fitted text becomes smaller.
      box.style.setProperty('--natural-width', `${label.getBoundingClientRect().width}px`);
      const width = box.getBoundingClientRect().width;
      if (width <= 0) return;
      if (label.getBoundingClientRect().width <= width) return;

      let low = 1;
      let high = maximum;
      for (let step = 0; step < 12; step++) {
        const middle = (low + high) / 2;
        label.style.fontSize = `${middle}px`;
        if (label.getBoundingClientRect().width <= width) low = middle;
        else high = middle;
      }
      label.style.fontSize = `${Math.floor(low * 10) / 10}px`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    void document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', schedule);
    };
  }, [children]);

  return <span ref={container} className={`fit-text ${className}`}><span ref={text} className="fit-text-content">{children}</span></span>;
}
