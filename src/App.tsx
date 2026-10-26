import { useCallback, useEffect, useRef, useState } from 'react';
import { House, PackagePlus, Plus, RefreshCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ancestorsOf, childrenOf, routeFor, type InventoryItem } from './domain/inventory';
import { loadInventory } from './services/inventoryRepository';
import { InventoryCard } from './components/InventoryCard';
import { InventoryIcon } from './components/InventoryIcon';
import { BottomNavigation, ContextToolbar, type ViewMode } from './components/Navigation';
import { FitText } from './components/FitText';

export default function App() {
  const [items, setItems] = useState<readonly InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return localStorage.getItem('inventory-view') === 'grid' ? 'grid' : 'list'; }
    catch { return 'list'; }
  });
  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem('inventory-view', mode); } catch { /* The view still works without storage. */ }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus('Sidans länk har kopierats.');
    } catch { setStatus('Länken kunde inte kopieras. Kopiera adressen från adressfältet.'); }
  };
  const location = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const activeRequest = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await loadInventory(controller.signal);
      if (controller.signal.aborted) return;
      setItems(result);
      setStatus('Innehållet är uppdaterat från Supabase.');
    } catch (cause) {
      if (controller.signal.aborted) return;
      const message = cause instanceof Error ? cause.message : 'Innehållet kunde inte hämtas. Försök igen.';
      setError(message);
      setStatus(message);
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); return () => activeRequest.current?.abort(); }, [refresh]);
  useEffect(() => {
    list.current?.scrollTo(0, 0);
    if (firstRender.current) firstRender.current = false;
    else heading.current?.focus();
  }, [location.pathname]);

  const segments = location.pathname.split('/').filter(Boolean);
  const current = items.find(item => item.publicId === segments[1] && routeFor(item) === location.pathname);
  const isHome = location.pathname === '/';
  const missing = !isHome && !current;
  const children = childrenOf(items, current?.id ?? null);
  const ancestors = current ? ancestorsOf(items, current) : [];
  const parent = ancestors.at(-1);
  const parentRoute = parent ? routeFor(parent) : '/';
  const title = missing && !loading && !error ? 'Hittades inte' : current?.name ?? 'Mitt hem';
  const count = children.length;
  const pathNames = [...ancestors.map(item => item.name), current?.name].filter(Boolean);
  if (current?.parentId === null) pathNames.unshift('Mitt hem');
  const summary = isHome ? `Hem | ${count} förvaringar` : `${pathNames.join(' → ')} | ${current?.type === 'OBJECT' ? 'Föremål' : `${count} förvaringar`}`;

  useEffect(() => { document.title = `${title} · Heminventering`; }, [title]);

  return (
    <div className="app-shell">
      <main className={`inventory-panel inventory-panel--${viewMode}`} id="main-content">
        <header className="inventory-header">
          <button className={`refresh-button ${loading ? 'is-loading' : ''}`} onClick={() => void refresh()} disabled={loading} aria-label="Uppdatera innehållet" title="Uppdatera"><RefreshCcw /></button>
          <h1 ref={heading} tabIndex={-1}>{current ? <InventoryIcon name={current.icon} /> : <House aria-hidden="true" />}<FitText>{title}</FitText></h1>
          {!missing && <p className="hierarchy-summary">{loading && items.length === 0 ? 'Hämtar ditt inventarium…' : error ? 'Anslutningen kunde inte slutföras' : summary}</p>}
          <div className="header-rule" />
        </header>

        <div className={`inventory-content inventory-content--${viewMode}`} ref={list} aria-busy={loading}>
          {error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={() => void refresh()}>Försök igen</button></div>
            : loading && items.length === 0 ? <p className="empty-state">Hämtar innehåll…</p>
            : missing ? <div className="empty-state"><p>Platsen saknas eller är inte tillgänglig.</p><Link to="/">Till Mitt hem</Link></div>
            : <>
              <div className={`inventory-list inventory-list--${viewMode}`} aria-label={`Innehåll i ${title}`}>
                {children.map(item => <InventoryCard key={item.id} item={item} items={items} />)}
                {current?.type !== 'OBJECT' && <button className="add-card" disabled title="Lägg till ingår inte i denna version" aria-label="Lägg till — ingår inte i denna version">{viewMode === 'grid' ? <><span>Lägg till…</span><PackagePlus aria-hidden="true" /></> : <Plus aria-hidden="true" />}</button>}
              </div>
              {current?.description && <p className="item-description">{current.description}</p>}
              {children.length === 0 && current?.type !== 'OBJECT' && <p className="demo-empty">{isHome ? 'Ditt inventarium är tomt.' : 'Förvaringen är tom.'}</p>}
            </>}
        </div>

        <ContextToolbar atHome={isHome} parentRoute={parentRoute} viewMode={viewMode} onViewChange={changeView} onCopy={() => void copyLink()} />
      </main>
      <BottomNavigation />
      <span className="sr-only">{loading ? 'Ansluter till Supabase…' : error ? 'Supabase · Ingen anslutning' : 'Supabase · Endast läsning'}</span>
      <span role="status" className="sr-only">{status}</span>
    </div>
  );
}
