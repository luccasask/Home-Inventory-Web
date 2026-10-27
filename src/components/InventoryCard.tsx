import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ancestorsOf, childrenOf, contentLabel, routeFor, type InventoryItem } from '../domain/inventory';
import { InventoryIcon } from './InventoryIcon';
import { FitText } from './FitText';

export function InventoryCard({ item, items, searchReturn, showSearchPath = false }: {
  item: InventoryItem; items: readonly InventoryItem[]; searchReturn?: string; showSearchPath?: boolean;
}) {
  const contents = contentLabel(childrenOf(items, item.id));
  return (
    <Link className={`inventory-card inventory-card--${item.type.toLowerCase()}`} to={routeFor(item)} state={searchReturn ? { searchReturn } : undefined} draggable={false}>
      <span className="card-icon-wrap"><InventoryIcon name={item.icon} className="card-icon" /></span>
      <span className="card-copy">
        <FitText className="card-title">{item.name}</FitText>
        <span className="card-subtitle">{item.type === 'OBJECT' ? 'Föremål' : contents}</span>
        {showSearchPath && <span className="card-path">{['Mitt hem', ...ancestorsOf(items, item).map(parent => parent.name)].join(' → ')}</span>}
      </span>
      {item.type !== 'OBJECT' && <ChevronRight className="card-chevron" aria-hidden="true" />}
    </Link>
  );
}
