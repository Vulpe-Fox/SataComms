import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useDialog } from './Dialog.jsx';

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

// Upload, list and delete images. With onSelect it works as a picker.
export default function MediaLibrary({ onSelect, multiple = false }) {
  const [files, setFiles] = useState([]);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const input = useRef();
  const dialog = useDialog();

  const load = () => api('/api/media').then(setFiles).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function upload(list) {
    if (!list?.length) return;
    const form = new FormData();
    [...list].forEach((f) => form.append('files', f));
    setBusy(true);
    setError('');
    try {
      const added = await api('/api/media', { method: 'POST', form });
      if (!added.length) setError('No valid images. Use PNG, JPG, GIF, WEBP or AVIF.');
      await load();
      if (onSelect && added.length) setPicked((p) => (multiple ? [...p, ...added] : [added[0]]));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(f) {
    if (!(await dialog.confirm('Sections that use this image will show nothing.', { title: 'Delete this image?' }))) return;
    await api(`/api/media/${encodeURIComponent(f.name)}`, { method: 'DELETE' });
    setPicked((p) => p.filter((x) => x.src !== f.src));
    load();
  }

  const toggle = (f) => {
    if (!onSelect) return;
    if (!multiple) return setPicked([f]);
    setPicked((p) => (p.some((x) => x.src === f.src) ? p.filter((x) => x.src !== f.src) : [...p, f]));
  };

  return (
    <div
      className={`media ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
    >
      <div className="media-bar">
        <button type="button" className="a-btn primary" onClick={() => input.current.click()} disabled={busy}>
          {busy ? 'Uploading...' : 'Upload images'}
        </button>
        <span className="a-hint">You can also drop files here.</span>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
        {onSelect && (
          <button type="button" className="a-btn primary push" disabled={!picked.length} onClick={() => onSelect(picked)}>
            Use {picked.length || ''} selected
          </button>
        )}
      </div>
      {error && <div className="a-error">{error}</div>}
      <div className="media-grid">
        {files.map((f) => {
          const n = picked.findIndex((x) => x.src === f.src);
          return (
            <div key={f.name} className={`media-item ${n >= 0 ? 'sel' : ''}`} onClick={() => toggle(f)} onDoubleClick={() => onSelect && onSelect([f])}>
              <img src={f.src} alt="" loading="lazy" />
              {n >= 0 && multiple && <span className="media-num">{n + 1}</span>}
              <div className="media-meta">
                <span title={f.name}>{kb(f.size)}</span>
                <button type="button" className="a-word danger" onClick={(e) => { e.stopPropagation(); remove(f); }} >Delete</button>
              </div>
            </div>
          );
        })}
        {!files.length && <div className="a-hint">No images. Upload some images to start.</div>}
      </div>
    </div>
  );
}
