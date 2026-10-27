import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, ChevronDown, MapPin, Package, PackagePlus, Save } from 'lucide-react';
import { ancestorsOf, type InventoryItem, type ItemType } from '../domain/inventory';
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
export function AddPage({ items, loading, error, active, onRetry }: {
  items: readonly InventoryItem[]; loading: boolean; error: string; active: boolean; onRetry: () => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('OBJECT');
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const wasActive = useRef(active);
  useLayoutEffect(() => {
    if (active) {
      // A quick return can reuse the departing page during its slide. Reset the
      // draft before painting it again, while keeping the exit animation intact.
      if (!wasActive.current) {
        setName(''); setType('OBJECT'); setPlace(''); setDescription('');
      }
      form.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
    wasActive.current = active;
  }, [active]);
  const places = useMemo(() => items.filter(item => item.type === 'LOCATION').map(item => ({
    id: item.id, label: [...ancestorsOf(items, item).map(parent => parent.name), item.name].join(' → '),
  })).sort((a, b) => a.label.localeCompare(b.label, 'sv')), [items]);
  const TypeIcon = type === 'LOCATION' ? MapPin : type === 'STORAGE' ? Package : Box;

  return <section className="add-page" aria-label="Lägg till föremål">
    <header className="inventory-header add-header">
      <h1 ref={active ? heading : null} tabIndex={-1}><PackagePlus aria-hidden="true" /><FitText>Lägg till föremål</FitText></h1>
      <p className="hierarchy-summary">Namn | Typ | Plats | Beskrivning</p>
      <div className="header-rule" />
    </header>
    <form ref={active ? form : null} className="inventory-content add-fields" aria-label="Uppgifter om föremålet" onSubmit={event => event.preventDefault()}>
      <div className="add-field">
        <label htmlFor={`${id}-name`}>Namn:</label>
        <input id={`${id}-name`} value={name} onChange={event => setName(event.target.value)}
          placeholder="Namn på föremålet" maxLength={120} autoComplete="off" />
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-type`}>Typ:</label>
        <div className="add-select">
          <TypeIcon aria-hidden="true" />
          <select id={`${id}-type`} value={type} onChange={event => setType(event.target.value as ItemType)}>
            <option value="LOCATION">Plats</option><option value="STORAGE">Förvaring</option><option value="OBJECT">Föremål</option>
          </select>
          <ChevronDown className="select-chevron" aria-hidden="true" />
        </div>
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-place`}>Plats:</label>
        <div className="add-select">
          <MapPin aria-hidden="true" />
          <select id={`${id}-place`} value={place} onChange={event => setPlace(event.target.value)} disabled={loading || !places.length}
            aria-describedby={error ? `${id}-place-error` : undefined}>
            <option value="">{loading ? 'Hämtar platser…' : places.length ? 'Välj befintlig plats' : 'Inga platser tillgängliga'}</option>
            {places.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <ChevronDown className="select-chevron" aria-hidden="true" />
        </div>
        {error && <p id={`${id}-place-error`} className="add-field-note" role="alert">Platserna kunde inte hämtas. <button type="button" onClick={onRetry}>Försök igen</button></p>}
      </div>
      <div className="add-field">
        <label htmlFor={`${id}-description`}>Beskrivning:</label>
        <textarea id={`${id}-description`} value={description} onChange={event => setDescription(limitWords(event.target.value))}
          placeholder="Beskriv föremålet…" rows={5} aria-describedby={`${id}-word-limit`} />
        <p id={`${id}-word-limit`} className="add-field-note word-count">{wordCount(description)} / {MAX_WORDS} ord</p>
      </div>
    </form>
  </section>;
}

export function AddSavePanel() {
  return <div className="add-save-panel">
    <button className="add-save-button" type="button" disabled aria-describedby="add-save-note" title="Sparande är inte aktiverat ännu">
      <Save aria-hidden="true" /><span>Spara</span>
    </button>
    <p id="add-save-note" className="add-save-note">Sparande är inte aktiverat ännu.</p>
  </div>;
}
