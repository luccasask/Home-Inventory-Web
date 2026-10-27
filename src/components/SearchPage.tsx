import { useLayoutEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { InventoryItem, ItemType } from '../domain/inventory';
import { searchInventory } from '../domain/search';
import { InventoryCard } from './InventoryCard';
import type { ViewMode } from './Navigation';

export function SearchPage({ items, loading, error, viewMode, active, onRetry, search, transition, onTransitionEnd, scrollPositions }: {
  items: readonly InventoryItem[]; loading: boolean; error: string; viewMode: ViewMode;
  active: boolean; onRetry: () => void;
  search: string; transition: string; onTransitionEnd: () => void;
  scrollPositions: Map<string, number>;
}) {
  const [, setParams] = useSearchParams();
  // Keep the departing search page's query stable while it slides out.
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const query = params.get('q') ?? '';
  const submitted = Boolean(query.trim());
  const rawType = params.get('type');
  const type = ['LOCATION', 'STORAGE', 'OBJECT'].includes(rawType ?? '') ? rawType as ItemType : null;
  const input = useRef<HTMLInputElement>(null);
  const resultArea = useRef<HTMLDivElement>(null);
  const restoringScroll = useRef(false);
  const pointerScroll = useRef<{ key: string; top: number } | null>(null);
  const results = useMemo(() => searchInventory(items, query, type), [items, query, type]);
  const scrollKey = JSON.stringify([query, type, viewMode]);
  useLayoutEffect(() => {
    // Do not overwrite a saved position while the old layout fades out or the
    // new layout is hidden. Restore once its result cards are in place.
    if (!active || !submitted || loading || !['idle', 'in'].includes(transition)) return;
    const area = resultArea.current;
    if (!area) return;
    const top = scrollPositions.get(scrollKey) ?? 0;
    restoringScroll.current = true;
    const restore = () => area.scrollTo(0, top);
    restore();
    // FitText and browser Back can settle after the first layout pass. Keep
    // their intermediate scroll events out of the saved user position.
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      restore();
      secondFrame = requestAnimationFrame(() => { restore(); restoringScroll.current = false; });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      restoringScroll.current = false;
    };
  }, [active, submitted, loading, scrollKey, scrollPositions, transition, results.length]);
  const summary = `Din sökning ”${query}” gav ${results.length} resultat`;
  const updateQuery = (value: string) => {
    const next = new URLSearchParams(params);
    // Keep spaces and the caret intact while typing; ranking normalizes the query.
    if (value) next.set('q', value.slice(0, 120)); else next.delete('q');
    setParams(next, { replace: true });
  };

  return <section className="search-page" aria-label="Sök i inventariet">
    <h1 className="sr-only">Sök i inventariet</h1>
    <header className="search-header">
      <form className="search-form" role="search" onSubmit={event => {
        event.preventDefault();
        input.current?.blur();
      }}>
        <button className="search-submit" type="button" aria-label="Sök" title="Sök" onClick={() => input.current?.focus({ preventScroll: true })}><Search aria-hidden="true" /></button>
        <input ref={active ? input : null} type="search" value={query} onChange={event => updateQuery(event.target.value)}
          placeholder="..." aria-label="Sök efter föremål, förvaring eller plats" maxLength={120} enterKeyHint="search" autoComplete="off" />
        {query && <button className="search-clear" type="button" aria-label="Rensa sökningen" onClick={() => {
          updateQuery('');
          input.current?.focus({ preventScroll: true });
        }}><X aria-hidden="true" /></button>}
      </form>
      <p className="search-summary" role={active ? 'status' : undefined}>
        {submitted ? loading ? 'Hämtar ditt inventarium…' : error ? 'Sökningen kunde inte slutföras' : summary : 'sök efter föremål.'}
      </p>
      <div className="header-rule" />
    </header>
    <div ref={active ? resultArea : null} className={`inventory-content inventory-content--${viewMode} search-results view-transition--${transition}`} aria-busy={loading}
      onPointerDownCapture={event => {
        // Browser focus may scroll a clicked card. Remember the position the
        // user actually chose it from, before that default focus adjustment.
        pointerScroll.current = event.isPrimary && event.button === 0 && event.target instanceof Element
          && event.target.closest('a.inventory-card') ? { key: scrollKey, top: event.currentTarget.scrollTop } : null;
      }}
      onClickCapture={event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
          || !(event.target instanceof Element) || !event.target.closest('a.inventory-card')) return;
        const saved = event.detail > 0 && pointerScroll.current?.key === scrollKey ? pointerScroll.current.top : event.currentTarget.scrollTop;
        scrollPositions.set(scrollKey, saved);
        pointerScroll.current = null;
      }}
      onScroll={event => {
        if (active && submitted && !loading && transition === 'idle' && !restoringScroll.current) scrollPositions.set(scrollKey, event.currentTarget.scrollTop);
      }}
      inert={!active || !submitted || transition !== 'idle'} hidden={!submitted}
      onAnimationEnd={event => { if (active && event.target === event.currentTarget) onTransitionEnd(); }}>
      {error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={onRetry}>Försök igen</button></div>
        : loading && !items.length ? <p className="empty-state">Hämtar innehåll…</p>
        : <div className={`inventory-list inventory-list--${viewMode}`} aria-label="Sökresultat">
          {results.map(item => <InventoryCard key={item.id} item={item} items={items} searchReturn={`/search${search}`} showSearchPath={viewMode === 'list'} />)}
          {!results.length && <p className="search-empty">Inga träffar. Prova ett annat sökord eller ändra typfiltret.</p>}
        </div>}
    </div>
  </section>;
}
