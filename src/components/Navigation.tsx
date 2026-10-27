import { Box, ChevronLeft, Copy, FolderPen, House, LayoutGrid, MapPin, Package, PackagePlus, Rows2, Search } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { isAddPath } from '../domain/navigation';

export type ViewMode = 'list' | 'grid';

export function ContextToolbar({ parentRoute, atHome, viewMode, onViewChange, onCopy, editRoute }: {
  parentRoute: string; atHome: boolean; viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void; onCopy: () => void;
  editRoute?: string;
}) {
  return (
    <nav className="context-toolbar" aria-label="Åtgärder för aktuell vy">
      <Link to={atHome ? '/' : parentRoute} state={{ direction: 'back' }} aria-disabled={atHome} tabIndex={atHome ? -1 : 0} aria-label="Gå upp en nivå" title="Gå upp en nivå" className={atHome ? 'is-disabled' : ''}><ChevronLeft /></Link>
      <button type="button" onClick={onCopy} aria-label="Kopiera sidans länk" title="Kopiera sidans länk"><Copy /></button>
      {editRoute ? <Link to={editRoute} aria-label="Redigera föremål" title="Redigera föremål"><FolderPen /></Link>
        : <button type="button" disabled aria-label="Redigera föremål" title="Öppna ett föremål eller en plats för att redigera"><FolderPen /></button>}
      <button type="button" onClick={() => onViewChange('grid')} aria-pressed={viewMode === 'grid'} aria-label="Visa som grid" title="Visa som grid"><LayoutGrid /></button>
      <button type="button" onClick={() => onViewChange('list')} aria-pressed={viewMode === 'list'} aria-label="Visa som lista" title="Visa som lista"><Rows2 /></button>
    </nav>
  );
}

export function SearchToolbar({ viewMode, onViewChange }: { viewMode: ViewMode; onViewChange: (mode: ViewMode) => void }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('type');
  return <nav className="context-toolbar search-toolbar" aria-label="Filtrera sökresultat och välj vy">
    <div className="search-type-filters" role="group" aria-label="Typfilter">
      {([{ type: 'LOCATION', label: 'Visa endast platser', Icon: MapPin },
        { type: 'STORAGE', label: 'Visa endast förvaringar', Icon: Package },
        { type: 'OBJECT', label: 'Visa endast föremål', Icon: Box }] as const).map(({ type, label, Icon }) =>
        <button key={type} type="button" aria-label={label} title={selected === type ? 'Visa alla typer' : label}
          aria-pressed={selected === type} onClick={() => {
            const next = new URLSearchParams(params);
            if (selected === type) next.delete('type'); else next.set('type', type);
            setParams(next, { replace: true });
          }}><Icon aria-hidden="true" /></button>)}
    </div>
    <div className="search-view-controls" role="group" aria-label="Visningsläge">
      <button type="button" onClick={() => onViewChange('grid')} aria-pressed={viewMode === 'grid'} aria-label="Visa som grid" title="Visa som grid"><LayoutGrid /></button>
      <button type="button" onClick={() => onViewChange('list')} aria-pressed={viewMode === 'list'} aria-label="Visa som lista" title="Visa som lista"><Rows2 /></button>
    </div>
  </nav>;
}

export function BottomNavigation({ lastHomePath }: { lastHomePath: string }) {
  const location = useLocation();
  const panel = location.pathname === '/search' ? 'search' : isAddPath(location.pathname) ? 'add' : 'home';
  return (
    <nav className="bottom-navigation" data-panel={panel} aria-label="Huvudnavigation">
      <Link className="home-link" to={panel === 'home' ? '/' : lastHomePath} state={{ direction: 'back', navigation: 'panel' }} aria-label="Mitt hem" aria-current={panel === 'home' ? 'page' : undefined}><House /></Link>
      <Link to="/search" state={{ navigation: 'panel' }} aria-label="Sök" aria-current={location.pathname === '/search' ? 'page' : undefined}><Search /></Link>
      <Link to="/add" state={{ navigation: 'panel' }} aria-label="Lägg till föremål" aria-current={isAddPath(location.pathname) ? 'page' : undefined}><PackagePlus /></Link>
      <span className="navigation-indicator" aria-hidden="true" />
    </nav>
  );
}
