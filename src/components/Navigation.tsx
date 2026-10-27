import { ChevronLeft, Copy, FolderPen, House, LayoutGrid, PackagePlus, Rows2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bounce } from './motion';

export type ViewMode = 'list' | 'grid';

export function ContextToolbar({ parentRoute, atHome, viewMode, onViewChange, onCopy }: {
  parentRoute: string; atHome: boolean; viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void; onCopy: () => void;
}) {
  return (
    <nav className="context-toolbar" aria-label="Åtgärder för aktuell vy" onClickCapture={event => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('button, a');
      if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
      const icon = control.querySelector('svg');
      if (!icon) return;
      bounce(icon);
    }}>
      <Link to={atHome ? '/' : parentRoute} state={{ direction: 'back' }} aria-disabled={atHome} tabIndex={atHome ? -1 : 0} aria-label="Gå till överordnad förvaring" title="Gå upp en nivå" className={atHome ? 'is-disabled' : ''}><ChevronLeft /></Link>
      <button type="button" onClick={onCopy} aria-label="Kopiera sidans länk" title="Kopiera sidans länk"><Copy /></button>
      <button type="button" disabled aria-label="Redigera — ingår inte i denna förhandsvisning" title="Redigering ingår inte i denna förhandsvisning"><FolderPen /></button>
      <button type="button" onClick={() => onViewChange('grid')} aria-pressed={viewMode === 'grid'} aria-label="Visa som grid" title="Visa som grid"><LayoutGrid /></button>
      <button type="button" onClick={() => onViewChange('list')} aria-pressed={viewMode === 'list'} aria-label="Visa som lista" title="Visa som lista"><Rows2 /></button>
    </nav>
  );
}

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Huvudnavigation">
      <Link className="home-link" to="/" state={{ direction: 'back' }} aria-label="Mitt hem" aria-current="page"><House /></Link>
      <button type="button" disabled aria-label="Sök — ingår inte i denna förhandsvisning" title="Sök ingår inte i denna förhandsvisning"><Search /></button>
      <button type="button" disabled aria-label="Lägg till — ingår inte i denna förhandsvisning" title="Lägg till ingår inte i denna förhandsvisning"><PackagePlus /></button>
    </nav>
  );
}
