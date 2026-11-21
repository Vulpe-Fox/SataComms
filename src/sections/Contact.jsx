import { useEffect, useRef, useState } from 'react';
import { Heading, Prose } from '../components/Basics.jsx';
import { useQuote } from '../components/QuoteContext.jsx';
import { api } from '../api.js';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const NONE = [];

// Image picker with previews. Files are kept in the parent form state.
function FileField({ field, files, onChange, room }) {
  const input = useRef();
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);

  return (
    <div className="field">
      {field.label && <span>{field.label}{field.required ? ' *' : ''}</span>}
      <div className="file-pick">
        {files.map((f, i) => (
          <div key={i} className="file-item">
            <img src={urls[i]} alt="" />
            <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        {room > 0 && (
          <button type="button" className="file-add" onClick={() => input.current.click()}>Add images</button>
        )}
      </div>
      <input
        ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
        aria-label={field.label || 'Images'}
        onChange={(e) => {
          const picked = [...e.target.files].slice(0, room);
          e.target.value = '';
          onChange([...files, ...picked]);
        }}
      />
    </div>
  );
}

export default function Contact({ section, data, layout, settings = {}, pages = [] }) {
  const { quote } = useQuote();
  const fields = data.formFields || [];
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [trap, setTrap] = useState('');
  const started = useRef(Date.now());
  const links = (data.links || []).filter((l) => l.url);
  const showQuote = !!data.includeQuote;
  const closed = settings.commissionsOpen === false && settings.closedLocksForm !== false;
  const allFiles = Object.values(files).flat();
  const set = (id, v) => setValues((s) => ({ ...s, [id]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const missing = fields.find((f) => f.type === 'file' && f.required && !(files[f.id] || []).length);
    if (missing) return setError(`Add at least one image for "${missing.label || 'Images'}".`);
    const big = allFiles.find((f) => f.size > MAX_SIZE);
    if (big) return setError(`"${big.name}" is larger than 10 MB.`);

    const payload = {
      sectionId: section.id,
      fields: fields.map((f) => {
        const label = f.label || f.type;
        if (f.type === 'checkbox') {
          const page = pages.find((p) => p.id === f.linkPage);
          const full = page?.navLabel ? [f.label, page.navLabel].filter(Boolean).join(' ') : label;
          return { label: full, value: values[f.id] ? 'Yes' : 'No' };
        }
        if (f.type === 'file') {
          const list = files[f.id] || [];
          return { label, value: list.length ? list.map((x) => x.name).join(', ') : 'None' };
        }
        return { label, value: values[f.id] || '' };
      }),
      quote: showQuote && quote ? quote : null,
      website: trap,
      elapsed: Date.now() - started.current,
    };
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    allFiles.forEach((f) => form.append('files', f));

    setStatus('sending');
    try {
      await api('/api/messages', { method: 'POST', form });
      setStatus('sent');
      setValues({});
      setFiles({});
    } catch (err) {
      setStatus('idle');
      setError(err.message);
    }
  }

  const renderField = (f) => {
    if (f.type === 'file') {
      const mine = files[f.id] || NONE;
      return (
        <FileField
          key={f.id} field={f} files={mine} room={MAX_FILES - allFiles.length}
          onChange={(list) => setFiles((s) => ({ ...s, [f.id]: list }))}
        />
      );
    }
    if (f.type === 'checkbox') {
      const page = pages.find((p) => p.id === f.linkPage);
      return (
        <label key={f.id} className="check-field">
          <input type="checkbox" required={f.required} checked={!!values[f.id]} onChange={(e) => set(f.id, e.target.checked)} />
          <span>
            {f.label}
            {page && <> <a href={`/${page.slug || ''}`} target="_blank" rel="noreferrer">{page.navLabel}</a></>}
            {f.required ? ' *' : ''}
          </span>
        </label>
      );
    }
    const common = {
      className: 'input', required: f.required, 'aria-label': f.label || f.type,
      value: values[f.id] || '', onChange: (e) => set(f.id, e.target.value),
    };
    return (
      <label key={f.id} className="field">
        {f.label && <span>{f.label}{f.required ? ' *' : ''}</span>}
        {f.type === 'textarea' ? <textarea rows={5} {...common} /> : <input type={f.type || 'text'} {...common} />}
      </label>
    );
  };

  return (
    <div className="container">
      <div className={`contact contact-${layout}`}>
        <div className="contact-info">
          <Heading text={data.title} />
          <Prose text={data.body} />
          {data.email && <p><a href={`mailto:${data.email}`}>{data.email}</a></p>}
          {links.length > 0 && (
            <ul className="links">
              {links.map((l) => (
                <li key={l.id}><a href={l.url} target="_blank" rel="noreferrer">{l.label || l.url}</a></li>
              ))}
            </ul>
          )}
        </div>
        {data.showForm && closed && (
          <div className="contact-form card closed-note">
            <Prose text={settings.closedFormText || 'Commissions are closed.'} />
          </div>
        )}
        {data.showForm && !closed && (
          <form className="contact-form card" onSubmit={submit}>
            {fields.map(renderField)}
            <input
              className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
              name="website" value={trap} onChange={(e) => setTrap(e.target.value)}
            />
            {showQuote && (
              <div className="quote-attach">
                {data.quoteLabel && <div className="muted small">{data.quoteLabel}</div>}
                <strong>{quote ? quote.totalText : data.noQuoteText || 'No quote'}</strong>
              </div>
            )}
            {error && <div className="error">{error}</div>}
            {status === 'sent' ? (
              <div className="success">{data.successText || 'Sent'}</div>
            ) : (
              <button type="submit" className="btn" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending' : data.submitText || 'Send'}
              </button>
            )}
            <Prose text={data.privacyText} className="prose small muted privacy" />
          </form>
        )}
      </div>
    </div>
  );
}
