import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { childrenOf, routeFor, type InventoryItem } from '../domain/inventory';
import { InventoryIcon } from './InventoryIcon';

export function InventoryCard({ item, items }: { item: InventoryItem; items: readonly InventoryItem[] }) {
  const count = childrenOf(items, item.id).length;
  return (
    <Link className={`inventory-card inventory-card--${item.type.toLowerCase()}`} to={routeFor(item)}>
      <InventoryIcon name={item.icon} className="card-icon" />
      <span className="card-copy">
        <span className="card-title">{item.name}</span>
        <span className="card-subtitle">{item.type === 'OBJECT' ? 'Föremål' : `${count} förvaringar`}</span>
      </span>
      <ChevronRight className="card-chevron" aria-hidden="true" />
    </Link>
  );
}
