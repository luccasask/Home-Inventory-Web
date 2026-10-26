import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { childrenOf, routeFor, type InventoryItem } from '../domain/inventory';
import { InventoryIcon } from './InventoryIcon';
import { FitText } from './FitText';

export function InventoryCard({ item, items }: { item: InventoryItem; items: readonly InventoryItem[] }) {
  const count = childrenOf(items, item.id).length;
  const touchPress = useRef(false);
  return (
    <Link className={`inventory-card inventory-card--${item.type.toLowerCase()}`} to={routeFor(item)} draggable={false}
      onPointerDown={event => { touchPress.current = event.pointerType === 'touch' || event.pointerType === 'pen'; }}
      onKeyDown={() => { touchPress.current = false; }}
      onContextMenu={event => { if (touchPress.current) event.preventDefault(); }}>
      <span className="card-icon-wrap"><InventoryIcon name={item.icon} className="card-icon" /></span>
      <span className="card-copy">
        <FitText className="card-title">{item.name}</FitText>
        <span className="card-subtitle">{item.type === 'OBJECT' ? 'Föremål' : `${count} förvaringar`}</span>
      </span>
      <ChevronRight className="card-chevron" aria-hidden="true" />
    </Link>
  );
}
