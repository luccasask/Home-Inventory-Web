import { AArrowDown, CalendarDays, Tags, Box, ChevronLeft, Copy, FolderPen, House, LayoutGrid, MapPin, Package, PackagePlus, Menu, Search } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { isAddPath } from '../domain/navigation';

import { nextSortMode, sortLabels, type SortMode } from '../domain/sorting';

export type ViewMode = 'list' | 'grid';

export function ContextToolbar({ parentRoute, atHome, viewMode, onViewChange, sortMode, onSortChange, onCopy, editRoute }: {
  parentRoute: string; atHome: boolean; viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void; onCopy: () => void;
  editRoute?: string; sortMode: SortMode; onSortChange: (mode: SortMode) => void;
}) {
  return (
    <nav className="context-toolbar" aria-label="Åtgärder för aktuell vy">
      <Link to={atHome ? '/' : parentRoute} state={{ direction: 'back' }} aria-disabled={atHome} tabIndex={atHome ? -1 : 0} aria-label="Gå upp en nivå" title="Gå upp en nivå" className={atHome ? 'is-disabled' : ''}><ChevronLeft /></Link>
      <button type="button" onClick={onCopy} aria-label="Kopiera sidans länk" title="Kopiera sidans länk"><Copy /></button>
      {editRoute ? <Link to={editRoute} aria-label="Redigera föremål" title="Redigera föremål"><FolderPen /></Link>
        : <button type="button" disabled aria-label="Redigera föremål" title="Öppna ett föremål eller en plats för att redigera"><FolderPen /></button>}
      <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
      <SortToggle sortMode={sortMode} onSortChange={onSortChange} />
    </nav>
  );
}

export function SearchToolbar({ viewMode, onViewChange, sortMode, onSortChange }: { viewMode: ViewMode; onViewChange: (mode: ViewMode) => void; sortMode: SortMode; onSortChange: (mode: SortMode) => void }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('type');
  return <nav className="context-toolbar search-toolbar" aria-label="Filtrera sökresultat och välj vy">
    <div className="search-type-filters" role="group" aria-label="Typfilter">
      {([{ type: 'LOCATION', label: 'Visa endast platser', Icon: MapPin },
        { type: 'STORAGE', label: 'Visa endast förvaringar', Icon: Package },
        { type: 'OBJECT', label: 'Visa endast föremål', Icon: Box }] as const).map(({ type, label, Icon }) =>
        <button key={type} type="button" data-type={type} aria-label={label} title={selected === type ? 'Visa alla typer' : label}
          aria-pressed={selected === type} onClick={() => {
            const next = new URLSearchParams(params);
            if (selected === type) next.delete('type'); else next.set('type', type);
            setParams(next, { replace: true });
          }}><Icon aria-hidden="true" /></button>)}
    </div>
    <div className="search-view-controls" role="group" aria-label="Visning och sortering">
      <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
      <SortToggle sortMode={sortMode} onSortChange={onSortChange} />
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

function ViewToggle({ viewMode, onViewChange }: { viewMode: ViewMode; onViewChange: (mode: ViewMode) => void }) {
  const label = viewMode === 'grid' ? 'Visa som lista' : 'Visa som grid';
  return <button type="button" onClick={() => onViewChange(viewMode === 'grid' ? 'list' : 'grid')} aria-label={label} title={label}>
    {viewMode === 'grid' ? <LayoutGrid aria-hidden="true" /> : <Menu aria-hidden="true" />}
  </button>;
}

function SortToggle({ sortMode, onSortChange }: { sortMode: SortMode; onSortChange: (mode: SortMode) => void }) {
  const next = nextSortMode(sortMode);
  const label = 'Sortering: ' + sortLabels[sortMode] + '. Byt till ' + sortLabels[next];
  const Icon = sortMode === 'recent' ? CalendarDays : sortMode === 'tag' ? Tags : AArrowDown;
  return <button type="button" onClick={() => onSortChange(next)} aria-label={label} title={label}><Icon aria-hidden="true" /></button>;
}
