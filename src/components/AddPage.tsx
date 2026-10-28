import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, ChevronDown, FolderPen, MapPin, Package, PackagePlus, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InventoryItem, ItemType } from '../domain/inventory';
import type { InventoryTag } from '../domain/tags';
import { InventoryIcon } from './InventoryIcon';
import { draftFor, draftIsComplete, placementChoices } from '../domain/itemForm';
import { FitText } from './FitText';
import { DeleteConfirmation } from './DeleteConfirmation';
import { deleteInventoryItem, saveInventoryItem } from '../services/inventoryRepository';

const MAX_WORDS = 200;
function wordCount(text: string) {
  return (text.match(/\S+/g) ?? []).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
}
function limitWords(text: string) {
  let count = 0;
  for (const token of text.matchAll(/\S+/g)) {
    if (/[\p{L}\p{N}]/u.test(token[0]) && ++count > MAX_WORDS) return text.slice(0, token.index).trimEnd();
  }
  return text;
}

export function AddPage({ items, tags, loading, error, active, onRetry, onReadyChange, onSaved, onDeleted, editing = false, item, initialParent }: {
  tags: readonly InventoryTag[];
  items: readonly InventoryItem[]; loading: boolean; error: string; active: boolean; onRetry: () => void;
  onReadyChange: (ready: boolean) => void;
  onSaved: (item: InventoryItem) => void; onDeleted: (item: InventoryItem) => void;
  editing?: boolean; item?: InventoryItem; initialParent?: InventoryItem | null;
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => draftFor(item, initialParent));
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Keep the version the draft was opened from, even during a background refresh.
  const [original, setOriginal] = useState(item);
  const [newPublicId, setNewPublicId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const busyGuard = useRef(false);
  const [saveError, setSaveError] = useState('');
  const { name, type, place, description } = draft;
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const wasActive = useRef(active);
  const draftKey = item?.id ?? (initialParent === null ? 'home' : initialParent?.id);
  const initializedItem = useRef(draftKey);
  useEffect(() => {
    const close = () => setDeleteOpen(false);
    window.addEventListener('inventory-locked', close);
    return () => window.removeEventListener('inventory-locked', close);
  }, []);
  useLayoutEffect(() => {
    setDeleteOpen(false);
    if (active) {
      // A quick return can reuse the departing page during its slide. Reset the
      // draft before painting it again, while keeping the exit animation intact.
      if (!wasActive.current || initializedItem.current !== draftKey) {
        setDraft(draftFor(item, initialParent));
        setOriginal(item); setNewPublicId(crypto.randomUUID()); setSaveError('');
      }
      form.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
    wasActive.current = active;
    initializedItem.current = draftKey;
  }, [active, draftKey]);
  const places = useMemo(() => placementChoices(items, item, initialParent, type), [items, item, initialParent, type]);
  const selectedTag = tags.find(tag => tag.id === draft.tagId);
  const tagValid = !draft.tagId || Boolean(selectedTag);
  useLayoutEffect(() => {
    onReadyChange(active && !loading && !busy && tagValid && (!editing || Boolean(original?.revision)) && draftIsComplete(draft, places));
  }, [active, loading, busy, editing, original, draft, places, tagValid, onReadyChange]);
  const TypeIcon = type === 'LOCATION' ? MapPin : type === 'STORAGE' ? Package : Box;
  const HeadingIcon = editing ? FolderPen : PackagePlus;

  return <section className="add-page" aria-label={editing ? 'Redigera föremål' : 'Lägg till föremål'}>
    <header className="inventory-header add-header">
      <h1 ref={active ? heading : null} tabIndex={-1}><HeadingIcon aria-hidden="true" /><FitText>{editing ? 'Redigera föremål' : 'Lägg till föremål'}</FitText></h1>
      <p className="hierarchy-summary">Namn | Typ | Plats | Tagg | Beskrivning</p>
      <div className="header-rule" />
    </header>
    {(editing && !item) || (loading && !items.length) ? <div className="empty-state" role={loading ? 'status' : 'alert'}>
      <p>{loading ? 'Hämtar föremålet…' : error || 'Föremålet saknas eller är inte tillgängligt.'}</p>
      {error ? <button type="button" onClick={onRetry}>Försök igen</button> : !loading && <Link to="/">Till Mitt hem</Link>}
    </div> : <form id={active ? 'inventory-item-form' : undefined} ref={active ? form : null} className="inventory-content add-fields" aria-label={editing ? 'Redigera föremålets uppgifter' : 'Uppgifter om föremålet'} onSubmit={async event => {
      event.preventDefault();
      if (!active || loading || busyGuard.current || !tagValid || !draftIsComplete(draft, places) || (editing && !original?.revision)) return;
      busyGuard.current = true; setBusy(true); setSaveError('');
      try { onSaved(await saveInventoryItem(original?.publicId ?? newPublicId, draft, original)); }
      catch (cause) { setSaveError((cause as Error).message); }
      finally { busyGuard.current = false; setBusy(false); }
    }}>
      <fieldset className="add-fieldset" disabled={busy}>
      <div className="add-field">
        <label htmlFor={`${id}-name`}>Namn:</label>
        <input id={`${id}-name`} value={name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
          placeholder="Namn på föremålet" maxLength={120} autoComplete="off" />
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-type`}>Typ:</label>
        <div className="add-select add-select--type" data-type={type}>
          <TypeIcon aria-hidden="true" />
          <select id={`${id}-type`} value={type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as ItemType }))}>
            <option value="LOCATION" disabled={editing && original?.type !== 'LOCATION'}>Plats</option>
            <option value="STORAGE" disabled={editing && original?.type === 'LOCATION'}>Förvaring</option>
            <option value="OBJECT" disabled={editing && (original?.type === 'LOCATION' || items.some(child => child.parentId === item?.id))}>Föremål</option>
          </select>
          <ChevronDown className="select-chevron" aria-hidden="true" />
        </div>
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-place`}>Plats:</label>
        <div className="add-select">
          <MapPin aria-hidden="true" />
          <select id={`${id}-place`} value={place} onChange={event => setDraft(current => ({ ...current, place: event.target.value }))} disabled={loading || !places.length}
            aria-describedby={error ? `${id}-place-error` : undefined}>
            {!places.some(option => option.value === '') && <option value="">{loading ? 'Hämtar platser…' : places.length ? 'Välj befintlig plats' : 'Inga platser tillgängliga'}</option>}
            {places.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <ChevronDown className="select-chevron" aria-hidden="true" />
        </div>
        {error && <p id={`${id}-place-error`} className="add-field-note" role="alert">Platserna kunde inte hämtas. <button type="button" onClick={onRetry}>Försök igen</button></p>}
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-tag`}>Tagg:</label>
        <div className="add-select">
          <InventoryIcon name={selectedTag?.icon ?? (type === 'LOCATION' ? 'map-pin' : type === 'STORAGE' ? 'package' : 'box')} />
          <select id={`${id}-tag`} value={draft.tagId} disabled={loading} aria-describedby={`${id}-tag-note`}
            onChange={event => setDraft(current => ({ ...current, tagId: event.target.value }))}>
            <option value="">Ingen tagg – standardikon</option>
            {!tagValid && <option value={draft.tagId}>Taggen är inte tillgänglig</option>}
            {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
          <ChevronDown className="select-chevron" aria-hidden="true" />
        </div>
        <p id={`${id}-tag-note`} className="add-field-note">{tagValid ? 'Valfri. Taggen bestämmer föremålets ikon.' : 'Välj en tillgänglig tagg eller standardikonen.'}</p>
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-description`}>Beskrivning:</label>
        <textarea id={`${id}-description`} value={description} onChange={event => setDraft(current => ({ ...current, description: limitWords(event.target.value) }))}
          placeholder="Beskriv föremålet…" rows={5} aria-describedby={`${id}-word-limit`} />
        <p id={`${id}-word-limit`} className="add-field-note word-count">{wordCount(description)} / {MAX_WORDS} ord</p>
      </div>
      {editing && <button className="delete-item-button" type="button" disabled={!active || !item || loading}
        onClick={() => setDeleteOpen(true)} aria-haspopup="dialog" title="Ta bort föremål">
        <Trash2 aria-hidden="true" /><span>Ta bort föremål</span>
      </button>}
      </fieldset>
      {busy && <p className="add-field-note" role="status">Sparar ändringen…</p>}
      {saveError && <p className="add-field-note auth-error" role="alert">{saveError}</p>}
    </form>}
    {active && editing && original && deleteOpen && <DeleteConfirmation busy={busy} error={saveError} onDismiss={() => { if (!busyGuard.current) setDeleteOpen(false); }} onConfirm={async () => {
      if (busyGuard.current || !original.revision) return;
      busyGuard.current = true; setBusy(true); setSaveError('');
      try { await deleteInventoryItem(original); setDeleteOpen(false); onDeleted(original); }
      catch (cause) { setSaveError((cause as Error).message); }
      finally { busyGuard.current = false; setBusy(false); }
    }} />}
  </section>;
}

export function AddSavePanel({ ready }: { ready: boolean }) {
  return <div className="add-save-panel">
    <button className={`context-toolbar add-save-button${ready ? ' add-save-button--ready' : ''}`} type="submit" form="inventory-item-form" disabled={!ready} aria-describedby="add-save-note">
      <Save aria-hidden="true" /><span>Spara</span>
    </button>
    <span id="add-save-note" className="sr-only">{ready ? 'Spara föremålet.' : 'Ange namn, typ och plats för att spara.'}</span>
  </div>;
}
