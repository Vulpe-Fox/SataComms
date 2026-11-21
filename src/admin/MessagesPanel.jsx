import { useEffect, useState } from 'react';
import { api, getToken } from '../api.js';
import { useDialog } from './Dialog.jsx';

// Message images are private, so they load with the admin token.
function AuthImage({ file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let u = '';
    fetch(`/api/messages/file/${encodeURIComponent(file.name)}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => u && URL.revokeObjectURL(u);
  }, [file.name]);
  if (!url) return <div className="msg-file empty">Loading</div>;
  return (
    <a className="msg-file" href={url} download={file.original || file.name} title={file.original}>
      <img src={url} alt={file.original || ''} />
      <span>Download</span>
    </a>
  );
}

export default function MessagesPanel() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const dialog = useDialog();
  const load = () => api('/api/messages').then(setMessages).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const mark = async (m, read) => {
    await api(`/api/messages/${m.id}`, { method: 'PATCH', body: { read } });
    load();
  };
  const remove = async (m) => {
    if (!(await dialog.confirm('You cannot undo this.', { title: 'Delete this message?' }))) return;
    await api(`/api/messages/${m.id}`, { method: 'DELETE' });
    load();
  };

  if (error) return <div className="a-error">{error}</div>;
  if (!messages) return null;
  if (!messages.length) return <div className="a-hint">No messages.</div>;

  return (
    <div className="msgs">
      <div className="panel-head">
        <h2>Messages</h2>
        <button type="button" className="a-btn" onClick={load}>Refresh</button>
      </div>
      {messages.map((m) => (
        <div key={m.id} className={`msg a-box ${m.read ? 'read' : ''}`}>
          <div className="msg-head">
            <strong>{new Date(m.date).toLocaleString()}</strong>
            <div className="a-btns">
              <button type="button" className="a-btn" onClick={() => mark(m, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
              <button type="button" className="a-btn danger" onClick={() => remove(m)}>Delete</button>
            </div>
          </div>
          <dl>
            {m.fields.map((f, i) => (
              <div key={i}><dt>{f.label}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
          {m.files?.length > 0 && (
            <div className="msg-files">
              {m.files.map((f) => <AuthImage key={f.name} file={f} />)}
            </div>
          )}
          {m.quote && (
            <div className="msg-quote">
              <table>
                <tbody>
                  {m.quote.base ? <tr><td>Base</td><td>{m.quote.baseText}</td></tr> : null}
                  {m.quote.lines?.map((l, i) => (
                    <tr key={i}>
                      <td>{[l.groupLabel, l.label].filter(Boolean).join(': ') || '(no label)'}{l.qty > 1 ? ` x${l.qty}` : ''}</td>
                      <td>{l.amountText}</td>
                    </tr>
                  ))}
                  <tr className="total"><td>Total</td><td>{m.quote.totalText}</td></tr>
                  {m.quote.depositText ? <tr><td>{m.quote.depositLabel || 'Deposit'}{m.quote.depositPercent > 0 ? ` (${m.quote.depositPercent}%)` : ''}</td><td>{m.quote.depositText}</td></tr> : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
