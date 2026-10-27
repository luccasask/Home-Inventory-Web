import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Page = { path: string; index: number; render: (active: boolean) => ReactNode };

/** Keep the outgoing page visible while the new route slides in immediately. */
export function PageTransition({ path, back, children }: {
  path: string; back: boolean; children: (active: boolean) => ReactNode;
}) {
  const index: number = window.history.state?.idx ?? 0;
  const lastPage = useRef<Page>({ path, index, render: children });
  const [transition, setTransition] = useState<{
    path: string; previous: Page | null; direction: 'forward' | 'back';
  }>({ path, previous: null, direction: 'forward' });

  if (transition.path !== path) {
    setTransition({ path, previous: lastPage.current,
      direction: back || index < lastPage.current.index ? 'back' : 'forward' });
  }
  useLayoutEffect(() => { lastPage.current = { path, index, render: children }; });

  return <div className={`page-transition page-transition--${transition.direction}`}>
    {transition.previous && <div key={transition.previous.path}
      className="inventory-page page-slide--exit" inert aria-hidden="true">
      {transition.previous.render(false)}
    </div>}
    <div key={path} className={`inventory-page${transition.previous ? ' page-slide--enter' : ''}`}
      onAnimationEnd={event => {
        if (event.target !== event.currentTarget) return;
        setTransition(state => state.path === path ? { ...state, previous: null } : state);
      }}>
      {children(true)}
    </div>
  </div>;
}
