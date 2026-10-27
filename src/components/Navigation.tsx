import type { MouseEvent } from 'react';
import { Box, ChevronLeft, Copy, FolderPen, House, LayoutGrid, MapPin, Package, PackagePlus, Rows2, Search } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { bounce } from './motion';

export type ViewMode = 'list' | 'grid';

function toolbarFeedback(event: MouseEvent<HTMLElement>) {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest('button, a');
  if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
  const icon = control.querySelector('svg');
  if (icon) bounce(icon);
}

export function ContextToolbar({ parentRoute, atHome, viewMode, onViewChange, onCopy }: {
  parentRoute: string; atHome: boolean; viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void; onCopy: () => void;
}) {
  return (
    <nav className="context-toolbar" aria-label="Åtgärder för aktuell vy" onClickCapture={toolbarFeedback}>
      <Link to={atHome ? '/' : parentRoute} state={{ direction: 'back' }} aria-disabled={atHome} tabIndex={atHome ? -1 : 0} aria-label="Gå till överordnad förvaring" title="Gå upp en nivå" className={atHome ? 'is-disabled' : ''}><ChevronLeft /></Link>
      <button type="button" onClick={onCopy} aria-label="Kopiera sidans länk" title="Kopiera sidans länk"><Copy /></button>
      <button type="button" disabled aria-label="Redigera — ingår inte i denna förhandsvisning" title="Redigering ingår inte i denna förhandsvisning"><FolderPen /></button>
      <button type="button" onClick={() => onViewChange('grid')} aria-pressed={viewMode === 'grid'} aria-label="Visa som grid" title="Visa som grid"><LayoutGrid /></button>
      <button type="button" onClick={() => onViewChange('list')} aria-pressed={viewMode === 'list'} aria-label="Visa som lista" title="Visa som lista"><Rows2 /></button>
    </nav>
  );
}

export function SearchToolbar({ viewMode, onViewChange }: { viewMode: ViewMode; onViewChange: (mode: ViewMode) => void }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('type');
  return <nav className="context-toolbar search-toolbar" aria-label="Filtrera sökresultat och välj vy" onClickCapture={toolbarFeedback}>
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

export function BottomNavigation() {
  const location = useLocation();
  return (
    <nav className="bottom-navigation" aria-label="Huvudnavigation">
      <Link className="home-link" to="/" state={{ direction: 'back' }} aria-label="Mitt hem" aria-current={!['/search', '/add'].includes(location.pathname) ? 'page' : undefined}><House /></Link>
      <Link to="/search" aria-label="Sök" aria-current={location.pathname === '/search' ? 'page' : undefined}><Search /></Link>
      <Link to="/add" aria-label="Lägg till föremål" aria-current={location.pathname === '/add' ? 'page' : undefined}><PackagePlus /></Link>
    </nav>
  );
}
