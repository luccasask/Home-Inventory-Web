import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { childrenOf, routeFor, type InventoryItem } from '../domain/inventory';
import { InventoryIcon } from './InventoryIcon';
import { FitText } from './FitText';
import { bounce } from './motion';

export function InventoryCard({ item, items }: { item: InventoryItem; items: readonly InventoryItem[] }) {
  const count = childrenOf(items, item.id).length;
  const touchPress = useRef(false);
  const pendingBounce = useRef<Animation | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => () => {
    pendingBounce.current?.cancel();
    pendingBounce.current = null;
  }, [location.key]);
  return (
    <Link className={`inventory-card inventory-card--${item.type.toLowerCase()}`} to={routeFor(item)} draggable={false}
      onPointerDown={event => { touchPress.current = event.pointerType === 'touch' || event.pointerType === 'pen'; }}
      onKeyDown={() => { touchPress.current = false; }}
      onContextMenu={event => { if (touchPress.current) event.preventDefault(); }}
      onClick={event => {
        // Preserve opening links in a new tab and the browser's modified clicks.
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (pendingBounce.current) { event.preventDefault(); return; }
        const animation = bounce(event.currentTarget, event.currentTarget.closest('.inventory-list--grid') ? 'grid' : 'list');
        if (!animation) return;
        event.preventDefault();
        pendingBounce.current = animation;
        // Let the clicked card finish its bounce before replacing it with the next page.
        void animation.finished.then(() => {
          if (pendingBounce.current !== animation) return;
          pendingBounce.current = null;
          navigate(routeFor(item));
        }).catch(() => { /* Navigation or unmount cancelled the pending click. */ });
      }}>
      <span className="card-icon-wrap"><InventoryIcon name={item.icon} className="card-icon" /></span>
      <span className="card-copy">
        <FitText className="card-title">{item.name}</FitText>
        <span className="card-subtitle">{item.type === 'OBJECT' ? 'Föremål' : `${count} förvaringar`}</span>
      </span>
      <ChevronRight className="card-chevron" aria-hidden="true" />
    </Link>
  );
}
