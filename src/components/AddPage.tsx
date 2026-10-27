import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, ChevronDown, MapPin, Package, PackagePlus, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InventoryItem, ItemType } from '../domain/inventory';
import { draftFor, draftIsComplete, placementChoices } from '../domain/itemForm';
import { FitText } from './FitText';

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

/** Local visual draft only. This component has no persistence or write service. */
export function AddPage({ items, loading, error, active, onRetry, onReadyChange, editing = false, item, initialParent }: {
  items: readonly InventoryItem[]; loading: boolean; error: string; active: boolean; onRetry: () => void;
  onReadyChange: (ready: boolean) => void;
  editing?: boolean; item?: InventoryItem; initialParent?: InventoryItem | null;
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => draftFor(item, initialParent));
  const { name, type, place, description } = draft;
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const wasActive = useRef(active);
  const draftKey = item?.id ?? (initialParent === null ? 'home' : initialParent?.id);
  const initializedItem = useRef(draftKey);
  useLayoutEffect(() => {
    if (active) {
      // A quick return can reuse the departing page during its slide. Reset the
      // draft before painting it again, while keeping the exit animation intact.
      if (!wasActive.current || initializedItem.current !== draftKey) {
        setDraft(draftFor(item, initialParent));
      }
      form.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
    wasActive.current = active;
    initializedItem.current = draftKey;
  }, [active, draftKey]);
  const places = useMemo(() => placementChoices(items, item, initialParent), [items, item, initialParent]);
  useLayoutEffect(() => {
    onReadyChange(active && (!editing || Boolean(item)) && draftIsComplete(draft, places));
  }, [active, editing, item, draft, places, onReadyChange]);
  const TypeIcon = type === 'LOCATION' ? MapPin : type === 'STORAGE' ? Package : Box;

  return <section className="add-page" aria-label={editing ? 'Redigera föremål' : 'Lägg till föremål'}>
    <header className="inventory-header add-header">
      <h1 ref={active ? heading : null} tabIndex={-1}><PackagePlus aria-hidden="true" /><FitText>Lägg till föremål</FitText></h1>
      <p className="hierarchy-summary">Namn | Typ | Plats | Beskrivning</p>
      <div className="header-rule" />
    </header>
    {editing && !item ? <div className="empty-state" role={loading ? 'status' : 'alert'}>
      <p>{loading ? 'Hämtar föremålet…' : error || 'Föremålet saknas eller är inte tillgängligt.'}</p>
      {error ? <button type="button" onClick={onRetry}>Försök igen</button> : !loading && <Link to="/">Till Mitt hem</Link>}
    </div> : <form ref={active ? form : null} className="inventory-content add-fields" aria-label={editing ? 'Redigera föremålets uppgifter' : 'Uppgifter om föremålet'} onSubmit={event => event.preventDefault()}>
      <div className="add-field">
        <label htmlFor={`${id}-name`}>Namn:</label>
        <input id={`${id}-name`} value={name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
          placeholder="Namn på föremålet" maxLength={120} autoComplete="off" />
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-type`}>Typ:</label>
        <div className="add-select">
          <TypeIcon aria-hidden="true" />
          <select id={`${id}-type`} value={type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as ItemType }))}>
            <option value="LOCATION">Plats</option><option value="STORAGE">Förvaring</option><option value="OBJECT">Föremål</option>
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
        <label htmlFor={`${id}-description`}>Beskrivning:</label>
        <textarea id={`${id}-description`} value={description} onChange={event => setDraft(current => ({ ...current, description: limitWords(event.target.value) }))}
          placeholder="Beskriv föremålet…" rows={5} aria-describedby={`${id}-word-limit`} />
        <p id={`${id}-word-limit`} className="add-field-note word-count">{wordCount(description)} / {MAX_WORDS} ord</p>
      </div>
      {editing && <button className="delete-item-button" type="button" disabled title="Borttagning är inte aktiverad ännu" aria-describedby={`${id}-preview-note`}>
        <Trash2 aria-hidden="true" /><span>Ta bort föremål</span>
      </button>}
      <p id={`${id}-preview-note`} className="add-field-note">{editing ? 'Sparande och borttagning är inte aktiverat ännu.' : 'Sparande är inte aktiverat ännu.'}</p>
    </form>}
  </section>;
}

export function AddSavePanel({ ready }: { ready: boolean }) {
  return <div className="add-save-panel">
    <button className={`context-toolbar add-save-button${ready ? ' add-save-button--ready' : ''}`} type="button" disabled aria-describedby="add-save-note" title="Sparande är inte aktiverat ännu">
      <Save aria-hidden="true" /><span>Spara</span>
    </button>
    <span id="add-save-note" className="sr-only">Sparande är inte aktiverat ännu.</span>
  </div>;
}
