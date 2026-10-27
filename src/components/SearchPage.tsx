import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [draft, setDraft] = useState(query);
  const input = useRef<HTMLInputElement>(null);
  const resultArea = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchInventory(items, query, type), [items, query, type]);
  useEffect(() => { setDraft(query); }, [query]);
  useEffect(() => { if (active) resultArea.current?.scrollTo(0, 0); }, [query, type, active]);
  const summary = `Din sökning ”${query}” gav ${results.length} resultat`;

  return <section className={`search-page${submitted ? ' search-page--results' : ''}`} aria-label="Sök i inventariet">
    <h1 className="sr-only">Sök i inventariet</h1>
    <header className="search-header">
      <form className="search-form" role="search" onSubmit={event => {
        event.preventDefault();
        const next = new URLSearchParams(params);
        const value = draft.trim().slice(0, 120);
        if (value) next.set('q', value); else next.delete('q');
        setParams(next, { replace: true });
        input.current?.blur();
      }}>
        <button className="search-submit" type="submit" aria-label="Sök" title="Sök"><Search aria-hidden="true" /></button>
        <input ref={active ? input : null} type="search" value={draft} onChange={event => setDraft(event.target.value)}
          placeholder="Sök…" aria-label="Sök efter föremål, förvaring eller plats" maxLength={120} enterKeyHint="search" autoComplete="off" />
        {draft && <button className="search-clear" type="button" aria-label="Rensa sökningen" onClick={() => {
          setDraft('');
          const next = new URLSearchParams(params); next.delete('q'); setParams(next, { replace: true });
          input.current?.focus({ preventScroll: true });
        }}><X aria-hidden="true" /></button>}
      </form>
      <p className="search-summary" role={active ? 'status' : undefined}>
        {submitted ? loading ? 'Hämtar ditt inventarium…' : error ? 'Sökningen kunde inte slutföras' : summary : '\u00a0'}
      </p>
      <div className="header-rule" />
    </header>
    <div ref={active ? resultArea : null} className={`inventory-content inventory-content--${viewMode} search-results view-transition--${transition}`} aria-busy={loading}
      inert={!active || !submitted || transition !== 'idle'} hidden={!submitted}
      onAnimationEnd={event => { if (active && event.target === event.currentTarget) onTransitionEnd(); }}>
      {error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={onRetry}>Försök igen</button></div>
        : loading && !items.length ? <p className="empty-state">Hämtar innehåll…</p>
        : <div className={`inventory-list inventory-list--${viewMode}`} aria-label="Sökresultat">
          {results.map(item => <InventoryCard key={item.id} item={item} items={items} />)}
          {!results.length && <p className="search-empty">Inga träffar. Prova ett annat sökord eller ändra typfiltret.</p>}
        </div>}
    </div>
  </section>;
}
