import { useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { InventoryItem, ItemType } from '../domain/inventory';
import { searchInventory } from '../domain/search';
import { InventoryCard } from './InventoryCard';
import type { ViewMode } from './Navigation';

export function SearchPage({ items, loading, error, viewMode, active, onRetry, search, transition, onTransitionEnd }: {
  items: readonly InventoryItem[]; loading: boolean; error: string; viewMode: ViewMode;
  active: boolean; onRetry: () => void;
  search: string; transition: string; onTransitionEnd: () => void;
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
  const results = useMemo(() => searchInventory(items, query, type), [items, query, type]);
  useEffect(() => { if (active) resultArea.current?.scrollTo(0, 0); }, [query, type, active]);
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
      inert={!active || !submitted || transition !== 'idle'} hidden={!submitted}
      onAnimationEnd={event => { if (active && event.target === event.currentTarget) onTransitionEnd(); }}>
      {error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={onRetry}>Försök igen</button></div>
        : loading && !items.length ? <p className="empty-state">Hämtar innehåll…</p>
        : <div className={`inventory-list inventory-list--${viewMode}`} aria-label="Sökresultat">
          {results.map(item => <InventoryCard key={item.id} item={item} items={items} searchReturn={`/search${search}`} />)}
          {!results.length && <p className="search-empty">Inga träffar. Prova ett annat sökord eller ändra typfiltret.</p>}
        </div>}
    </div>
  </section>;
}
