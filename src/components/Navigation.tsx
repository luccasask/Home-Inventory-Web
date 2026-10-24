import { ArrowUpFromLine, ChevronLeft, FolderPen, House, PackagePlus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ContextToolbar({ onBack, parentRoute, atHome }: { onBack: () => void; parentRoute: string; atHome: boolean }) {
  return (
    <nav className="context-toolbar" aria-label="Åtgärder för aktuell vy">
      <button type="button" onClick={onBack} disabled={atHome} aria-label="Tillbaka" title="Tillbaka"><ChevronLeft /></button>
      <Link to={parentRoute} aria-disabled={atHome} tabIndex={atHome ? -1 : 0} aria-label="Gå till överordnad förvaring" title="Gå upp en nivå" className={atHome ? 'is-disabled' : ''}><span className="parent-icon"><ArrowUpFromLine /></span></Link>
      <button type="button" disabled aria-label="Redigera — ingår inte i denna förhandsvisning" title="Redigering ingår inte i denna förhandsvisning"><FolderPen /></button>
      <button type="button" disabled aria-label="Ta bort — ingår inte i denna förhandsvisning" title="Borttagning ingår inte i denna förhandsvisning"><Trash2 /></button>
    </nav>
  );
}

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Huvudnavigation">
      <Link className="home-link" to="/" aria-label="Mitt hem" aria-current="page"><House /></Link>
      <button type="button" disabled aria-label="Sök — ingår inte i denna förhandsvisning" title="Sök ingår inte i denna förhandsvisning"><Search /></button>
      <button type="button" disabled aria-label="Lägg till — ingår inte i denna förhandsvisning" title="Lägg till ingår inte i denna förhandsvisning"><PackagePlus /></button>
    </nav>
  );
}
