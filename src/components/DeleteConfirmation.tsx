import { useId, useLayoutEffect, useRef } from 'react';
import { OctagonAlert } from 'lucide-react';

export function DeleteConfirmation({ onDismiss, onConfirm, busy, error }: { onDismiss: () => void; onConfirm: () => void; busy: boolean; error: string }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal();
    cancel.current?.focus({ preventScroll: true });
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="delete-confirmation" aria-labelledby={`${id}-title`}
    aria-describedby={`${id}-warning ${id}-note`}
    onCancel={event => { event.preventDefault(); onDismiss(); }}
    onPointerDown={event => event.stopPropagation()}
    onPointerUp={event => event.stopPropagation()}
    onClick={event => {
      event.stopPropagation();
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom)) onDismiss();
    }}>
    <h2 id={`${id}-title`}><OctagonAlert aria-hidden="true" /><span>Vill du ta bort föremålet?</span></h2>
    <p id={`${id}-warning`}>Alla föremål inuti kommer att raderas.</p>
    <div className="delete-confirmation-actions">
      <button type="button" className="delete-confirmation-delete" disabled={busy} onClick={onConfirm}>{busy ? 'Raderar…' : 'Radera'}</button>
      <button ref={cancel} type="button" className="delete-confirmation-cancel" disabled={busy} onClick={onDismiss}>Avbryt</button>
    </div>
    <p id={`${id}-note`} className="delete-confirmation-note" role={error ? 'alert' : undefined}>{error || 'Detta går inte att ångra.'}</p>
  </dialog>;
}
