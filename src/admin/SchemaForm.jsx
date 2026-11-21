import { useState } from 'react';
import { uid, imageFields } from '../../shared/schema.js';
import { useAdmin, pageName, move } from './AdminContext.jsx';
import { useDialog } from './Dialog.jsx';

// Renders a form for any value from a field list. See shared/schema.js.
export default function SchemaForm({ fields, value, onChange }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  return (
    <div className="sf">
      {fields.map((f) => (
        <Field key={f.key} field={f} value={value?.[f.key]} onChange={(v) => set(f.key, v)} />
      ))}
    </div>
  );
}

function Field({ field, value, onChange }) {
  const { label, type } = field;
  switch (type) {
    case 'text':
      return <Row label={label}><input className="a-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Row>;
    case 'password':
      return <Row label={label}><input className="a-input" type="password" autoComplete="new-password" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Row>;
    case 'textarea':
      return <Row label={label}><textarea className="a-input" rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Row>;
    case 'number':
      return (
        <Row label={label}>
          <input
            className="a-input" type="number" step={field.step ?? 1} min={field.min} max={field.max}
            value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Row>
      );
    case 'boolean':
      return (
        <label className="a-check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {label}
        </label>
      );
    case 'select':
      return (
        <Row label={label}>
          <select className="a-input" value={value ?? field.options[0].value} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Row>
      );
    case 'color':
      return (
        <Row label={label}>
          <div className="a-color">
            <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
            <input className="a-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          </div>
        </Row>
      );
    case 'choice':
      return (
        <Row label={label}>
          <div className="a-choice">
            {field.options.map((o) => (
              <button type="button" key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </Row>
      );
    case 'page':
      return <Row label={label}><PageSelect value={value} onChange={onChange} /></Row>;
    case 'image':
      return <Row label={label}><ImageField value={value} onChange={onChange} /></Row>;
    case 'images':
      return <Row label={label}><ImagesField value={value || []} onChange={onChange} /></Row>;
    case 'list':
      return <ListField field={field} value={value || []} onChange={onChange} />;
    default:
      return null;
  }
}

function Row({ label, children }) {
  return (
    <div className="a-row">
      <div className="a-label">{label}</div>
      {children}
    </div>
  );
}

function PageSelect({ value, onChange }) {
  const { site } = useAdmin();
  return (
    <select className="a-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">None</option>
      {site.pages.map((p) => <option key={p.id} value={p.id}>{pageName(p)}</option>)}
    </select>
  );
}

function ImageField({ value, onChange }) {
  const { pickImages } = useAdmin();
  const choose = async () => {
    const [img] = await pickImages(false);
    if (img) onChange({ src: img.src, alt: value?.alt || '', caption: value?.caption || '' });
  };
  return (
    <div className="a-image">
      {value?.src ? <img src={value.src} alt="" /> : <div className="a-thumb-empty" />}
      <div className="a-image-side">
        <div className="a-btns">
          <button type="button" className="a-btn" onClick={choose}>{value?.src ? 'Change' : 'Select'}</button>
          {value?.src && <button type="button" className="a-btn danger" onClick={() => onChange(null)}>Remove</button>}
        </div>
        {value?.src && (
          <input className="a-input" placeholder="Alt text" value={value.alt || ''} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
        )}
      </div>
    </div>
  );
}

function ImagesField({ value, onChange }) {
  const { pickImages } = useAdmin();
  const [edit, setEdit] = useState(null);
  const add = async () => {
    const imgs = await pickImages(true);
    if (imgs.length) onChange([...value, ...imgs.map((i) => ({ src: i.src, alt: '', caption: '' }))]);
  };
  return (
    <div>
      <div className="a-thumbs">
        {value.map((img, i) => (
          <div key={img.src + i} className={`a-thumb ${edit === i ? 'sel' : ''}`}>
            <img src={img.src} alt="" onClick={() => setEdit(edit === i ? null : i)} />
            <div className="a-thumb-tools">
              <button type="button" onClick={() => onChange(move(value, i, -1))} >Left</button>
              <button type="button" onClick={() => onChange(move(value, i, 1))} >Right</button>
              <button type="button" onClick={() => { onChange(value.filter((_, j) => j !== i)); setEdit(null); }} >Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="a-thumb-add" onClick={add}>Add</button>
      </div>
      {edit != null && value[edit] && (
        <div className="a-sub">
          <SchemaForm fields={imageFields} value={value[edit]} onChange={(v) => onChange(value.map((x, j) => (j === edit ? v : x)))} />
        </div>
      )}
    </div>
  );
}

function ListField({ field, value, onChange }) {
  const [open, setOpen] = useState(null);
  const dialog = useDialog();
  const add = () => {
    const item = { ...(field.create ? field.create() : {}), id: uid() };
    onChange([...value, item]);
    setOpen(item.id);
  };
  const dup = (i) => {
    const copy = structuredClone(value[i]);
    reId(copy);
    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
  };
  return (
    <div className="a-list">
      <div className="a-list-head">
        <span className="a-label">{field.label}</span>
        <button type="button" className="a-btn" onClick={add}>Add {field.itemLabel?.toLowerCase() || 'item'}</button>
      </div>
      {value.map((item, i) => {
        const isOpen = open === item.id;
        const name = item[field.titleKey] || `${field.itemLabel || 'Item'} ${i + 1}`;
        return (
          <div key={item.id || i} className={`a-item ${isOpen ? 'open' : ''}`}>
            <div className="a-item-head">
              <button type="button" className="a-item-title" onClick={() => setOpen(isOpen ? null : item.id)}>
                {name}
              </button>
              <div className="a-btns">
                <button type="button" className="a-word" onClick={() => onChange(move(value, i, -1))}>Up</button>
                <button type="button" className="a-word" onClick={() => onChange(move(value, i, 1))}>Down</button>
                <button type="button" className="a-word" onClick={() => dup(i)}>Copy</button>
                <button
                  type="button" className="a-word danger"
                  onClick={async () => (await dialog.confirm(`"${name}" will be deleted when you save.`, { title: `Delete this ${(field.itemLabel || 'item').toLowerCase()}?` })) && onChange(value.filter((_, j) => j !== i))}
                >Delete</button>
              </div>
            </div>
            {isOpen && (
              <div className="a-item-body">
                <SchemaForm fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Gives new ids to a copied item and its nested list items.
function reId(obj) {
  if (Array.isArray(obj)) return obj.forEach(reId);
  if (obj && typeof obj === 'object') {
    if ('id' in obj) obj.id = uid();
    Object.values(obj).forEach(reId);
  }
}
