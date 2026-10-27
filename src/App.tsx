import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, House, LockKeyhole, PackagePlus, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ancestorsOf, childrenOf, contentLabel, routeFor, type InventoryItem } from './domain/inventory';
import { loadInventory } from './services/inventoryRepository';
import { InventoryCard } from './components/InventoryCard';
import { InventoryIcon } from './components/InventoryIcon';
import { InventoryBreadcrumbs } from './components/InventoryBreadcrumbs';
import { BottomNavigation, ContextToolbar, SearchToolbar, type ViewMode } from './components/Navigation';
import { FitText } from './components/FitText';
import { PageTransition } from './components/PageTransition';
import { SearchPage } from './components/SearchPage';
import { AddPage, AddSavePanel } from './components/AddPage';
import { isAddPath } from './domain/navigation';
import { swipeTarget } from './domain/swipe';
import { useSwipeNavigation } from './components/useSwipeNavigation';
import { useControlFeedback } from './components/useControlFeedback';
import { useSafariEdgeSwipe } from './components/useSafariEdgeSwipe';
import type { SwipeDirection } from './domain/swipe';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const controlFeedback = useControlFeedback();
  const isSearch = location.pathname === '/search';
  const isAdd = isAddPath(location.pathname);
  const editId = location.pathname.startsWith('/add/') ? location.pathname.slice('/add/'.length) : null;
  const [addReady, setAddReady] = useState(false);
  const [lastHomePath, setLastHomePath] = useState('/');
  const [items, setItems] = useState<readonly InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [copyNotice, setCopyNotice] = useState<{ text: string; error: boolean } | null>(null);
  const searchScrollPositions = useRef(new Map<string, number>());
  const mainPanel = useRef<HTMLElement>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return localStorage.getItem('inventory-view') === 'grid' ? 'grid' : 'list'; }
    catch { return 'list'; }
  });
  const [requestedView, setRequestedView] = useState<ViewMode>(viewMode);
  const [viewTransition, setViewTransition] = useState<'idle' | 'out' | 'hidden' | 'in'>('idle');
  const changeView = (mode: ViewMode) => {
    setRequestedView(mode);
    if (isSearch && !new URLSearchParams(location.search).get('q')?.trim()) setViewMode(mode);
  };
  useEffect(() => {
    if (viewTransition === 'idle' && requestedView !== viewMode) setViewTransition('out');
  }, [requestedView, viewMode, viewTransition]);
  useEffect(() => {
    // Panels without visible results cannot finish a grid/list animation.
    // Settle it when entering the add form or clearing the live query.
    if (isAdd || (isSearch && !new URLSearchParams(location.search).get('q')?.trim())) {
      setViewMode(requestedView);
      setViewTransition('idle');
    }
  }, [isAdd, isSearch, location.search, requestedView, viewTransition]);
  useEffect(() => {
    try { localStorage.setItem('inventory-view', viewMode); } catch { /* The view still works without storage. */ }
  }, [viewMode]);
  useEffect(() => {
    if (viewTransition !== 'hidden') return;
    // Keep the new layout invisible until ResizeObserver and FitText have settled.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setViewTransition('in'));
    });
    return () => cancelAnimationFrame(frame);
  }, [viewTransition]);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyNotice({ text: 'Länk kopierad', error: false });
    } catch { setCopyNotice({ text: 'Länken kunde inte kopieras. Kopiera adressen från adressfältet.', error: true }); }
  };
  useEffect(() => {
    if (!copyNotice) return;
    const timer = window.setTimeout(() => setCopyNotice(null), copyNotice.error ? 5000 : 2800);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);
  const heading = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const activeRequest = useRef<AbortController | null>(null);
  const lastRefresh = useRef(0);
  const refresh = useCallback(async (background = false) => {
    if (background && (activeRequest.current || Date.now() - lastRefresh.current < 5000)) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    if (!background) { setLoading(true); setError(''); }
    try {
      const result = await loadInventory(controller.signal);
      if (controller.signal.aborted) return;
      setItems(result);
      lastRefresh.current = Date.now(); setError('');
      setStatus('Innehållet är uppdaterat från Supabase.');
    } catch (cause) {
      if (controller.signal.aborted) return;
      const message = cause instanceof Error ? cause.message : 'Innehållet kunde inte hämtas. Försök igen.';
      if (!background) setError(message);
      else setCopyNotice({ text: 'Kunde inte uppdatera innehållet. Visar senast hämtade uppgifter.', error: true });
      setStatus(message);
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); return () => activeRequest.current?.abort(); }, [refresh]);
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === 'visible' && !mainPanel.current?.closest('[hidden]')) void refresh(true);
    };
    const unlocked = () => { requestAnimationFrame(() => void refresh(true)); };
    window.addEventListener('focus', resume); window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume); window.addEventListener('inventory-unlocked', unlocked);
    return () => {
      window.removeEventListener('focus', resume); window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume); window.removeEventListener('inventory-unlocked', unlocked);
    };
  }, [refresh]);
  const activePath = useRef(location.pathname);
  activePath.current = location.pathname;
  useEffect(() => {
    list.current?.scrollTo(0, 0);
    if (firstRender.current) firstRender.current = false;
    // The incoming heading starts outside the viewport during a slide. Focus it
    // for accessibility without scrolling the animation container to reveal it.
    else heading.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  const segments = location.pathname.split('/').filter(Boolean);
  const current = items.find(item => item.publicId === segments[1] && routeFor(item) === location.pathname);
  const editingItem = editId ? items.find(item => item.publicId === editId) : undefined;
  const initialParentId = isAdd && !editId ? new URLSearchParams(location.search).get('parent') : null;
  const initialParent = initialParentId === 'home' ? null
    : items.find(item => item.publicId === initialParentId && item.type !== 'OBJECT');
  useLayoutEffect(() => {
    if (location.pathname === '/' || current) setLastHomePath(location.pathname);
  }, [location.pathname, current?.id]);
  const handleSwipe = (direction: SwipeDirection) => {
    const target = swipeTarget(location.pathname, items, direction, location.state?.searchReturn);
    if (!target) return;
    navigate(target.panel && target.path === '/' ? lastHomePath : target.path,
      { state: target.panel ? { navigation: 'panel' } : { direction: 'back' } });
  };
  const swipeHandlers = useSwipeNavigation(location.key, handleSwipe);
  useSafariEdgeSwipe(mainPanel, location.key, handleSwipe, () => {
    if (isSearch) mainPanel.current?.querySelector<HTMLInputElement>('.inventory-page:not([aria-hidden="true"]) .search-form input')?.focus({ preventScroll: true });
  });
  const isHome = location.pathname === '/';
  const missing = !isHome && !current;
  const children = childrenOf(items, current?.id ?? null);
  const ancestors = current ? ancestorsOf(items, current) : [];
  const parent = ancestors.at(-1);
  const parentRoute = parent ? routeFor(parent) : '/';
  const title = isAdd ? editId ? 'Redigera föremål' : 'Lägg till föremål' : isSearch ? 'Sök' : missing && !loading && !error ? 'Hittades inte' : current?.name ?? 'Mitt hem';
  const contents = contentLabel(children);

  useEffect(() => { document.title = `${title} · Heminventering`; }, [title]);

  return (
    <div className="app-shell" {...controlFeedback}>
      <button type="button" className="app-lock-button" aria-label="Lås appen" title="Lås appen" onClick={() => window.dispatchEvent(new Event('inventory-lock'))}><LockKeyhole aria-hidden="true" /></button>
      <main ref={mainPanel} className={`inventory-panel inventory-panel--${viewMode}`} id="main-content" onClick={event => {
        if (!isSearch || event.defaultPrevented || !(event.target instanceof Element)
          || event.target.closest('a, button, input, select, textarea, nav, dialog')) return;
        event.currentTarget.querySelector<HTMLInputElement>('.inventory-page:not([aria-hidden="true"]) .search-form input')?.focus({ preventScroll: true });
      }}>
        <PageTransition path={location.pathname} back={navigationType !== 'POP' && location.state?.direction === 'back'}
          viaPanelMenu={navigationType !== 'POP' && location.state?.navigation === 'panel'} swipeHandlers={swipeHandlers}>{active => isAdd
          ? <AddPage items={items} loading={loading} error={error} active={active} onRetry={() => void refresh()} onReadyChange={setAddReady}
              onSaved={saved => {
                setItems(current => [...current.filter(item => item.publicId !== saved.publicId), saved]);
                setCopyNotice({ text: 'Föremålet är sparat', error: false });
                void refresh();
                if (activePath.current === location.pathname) navigate(routeFor(saved), { replace: true, state: { direction: 'back' } });
              }}
              onDeleted={deleted => {
                setItems(current => current.filter(item => item.id !== deleted.id && !ancestorsOf(current, item).some(parent => parent.id === deleted.id)));
                const parent = items.find(item => item.id === deleted.parentId);
                setCopyNotice({ text: 'Föremålet är raderat', error: false });
                void refresh();
                if (activePath.current === location.pathname) navigate(parent ? routeFor(parent) : '/', { replace: true, state: { direction: 'back' } });
              }}
              editing={Boolean(editId)} item={editingItem} initialParent={initialParent} />
          : isSearch
          ? <SearchPage items={items} loading={loading} error={error} viewMode={viewMode} active={active}
              scrollPositions={searchScrollPositions.current}
              search={location.search} transition={viewTransition} onRetry={() => void refresh()}
              onTransitionEnd={() => {
                if (viewTransition === 'out') { setViewMode(requestedView); setViewTransition('hidden'); }
                else if (viewTransition === 'in') setViewTransition('idle');
              }} />
          : <>
        <header className="inventory-header">
          <h1 ref={active ? heading : null} tabIndex={-1}>{current ? <InventoryIcon name={current.icon} /> : <House aria-hidden="true" />}<FitText>{title}</FitText></h1>
          {!missing && (current && !error
            ? <InventoryBreadcrumbs current={current} ancestors={ancestors} contents={contents} />
            : <p className="hierarchy-summary">{loading && items.length === 0 ? 'Hämtar ditt inventarium…' : error ? 'Anslutningen kunde inte slutföras' : `Mitt hem | ${contents}`}</p>)}
          <div className="header-rule" />
        </header>

        <div className={`inventory-content inventory-content--${viewMode} view-transition--${viewTransition}`} ref={active ? list : null}
          aria-busy={loading || viewTransition !== 'idle'} inert={!active || viewTransition !== 'idle'}
          onAnimationEnd={event => {
            if (!active || event.target !== event.currentTarget) return;
            if (viewTransition === 'out') {
              setViewMode(requestedView);
              setViewTransition('hidden');
            } else if (viewTransition === 'in') setViewTransition('idle');
          }}>
          {error ? <div className="empty-state" role="alert"><p>{error}</p><button onClick={() => void refresh()}>Försök igen</button></div>
            : loading && items.length === 0 ? <p className="empty-state">Hämtar innehåll…</p>
            : missing ? <div className="empty-state"><p>Platsen saknas eller är inte tillgänglig.</p><Link to="/">Till Mitt hem</Link></div>
            : <>
              <div className={`inventory-list inventory-list--${viewMode}`} aria-label={`Innehåll i ${title}`}>
                {children.map(item => <InventoryCard key={item.id} item={item} items={items} />)}
                {current?.type !== 'OBJECT' && <Link className="add-card" to={`/add?parent=${current?.publicId ?? 'home'}`} aria-label="Lägg till föremål" title="Lägg till föremål">{viewMode === 'grid' ? <><span>Lägg till…</span><span className="card-icon-wrap"><PackagePlus aria-hidden="true" /></span></> : <Plus aria-hidden="true" />}</Link>}
              </div>
              {current?.description && <p className="item-description">{current.description}</p>}
              {children.length === 0 && current?.type !== 'OBJECT' && <p className="demo-empty">{isHome ? 'Ditt inventarium är tomt.' : 'Här finns inget innehåll ännu.'}</p>}
            </>}
        </div>

        </>}</PageTransition>
        {isAdd ? <AddSavePanel ready={addReady} /> : isSearch ? <SearchToolbar viewMode={requestedView} onViewChange={changeView} />
          : <ContextToolbar atHome={isHome} parentRoute={parentRoute} viewMode={requestedView} onViewChange={changeView} onCopy={() => void copyLink()}
              editRoute={current ? `/add/${current.publicId}` : undefined} />}
      </main>
      <BottomNavigation lastHomePath={lastHomePath} />
      {copyNotice && <div className="copy-toast" role={copyNotice.error ? 'alert' : 'status'}>
        {!copyNotice.error && <Check aria-hidden="true" />}<span>{copyNotice.text}</span>
      </div>}
      <span className="sr-only">{loading ? 'Ansluter till Supabase…' : error ? 'Supabase · Ingen anslutning' : 'Supabase · Inloggad'}</span>
      <span role="status" className="sr-only">{status}</span>
    </div>
  );
}
