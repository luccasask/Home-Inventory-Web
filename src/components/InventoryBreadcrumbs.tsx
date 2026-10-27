import { Link } from 'react-router-dom';
import { routeFor, type InventoryItem } from '../domain/inventory';

export function InventoryBreadcrumbs({ current, ancestors, count }: {
  current: InventoryItem; ancestors: readonly InventoryItem[]; count: number;
}) {
  return <nav className="hierarchy-summary" aria-label="Sökväg">
    <ol>
      <li><Link to="/" state={{ direction: 'back' }}>Mitt hem</Link></li>
      {ancestors.map(item => <li key={item.id}>
        <span className="path-separator" aria-hidden="true"> → </span>
        <Link to={routeFor(item)} state={{ direction: 'back' }}>{item.name}</Link>
      </li>)}
      <li><span className="path-separator" aria-hidden="true"> → </span><span aria-current="page">{current.name}</span></li>
    </ol>
    <span> | {current.type === 'OBJECT' ? 'Föremål' : `${count} förvaringar`}</span>
  </nav>;
}
