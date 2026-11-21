import { useState } from 'react';
import { api, getToken } from '../api.js';
import { migrateSite } from '../../shared/schema.js';
import { useAdmin } from './AdminContext.jsx';
import { useDialog } from './Dialog.jsx';

export default function DataPage({ setSavedJson }) {
  const { site, setSite } = useAdmin();
  const dialog = useDialog();

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(site, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file) => {
    if (!file) return;
    file.text().then((t) => {
      try {
        const data = migrateSite(JSON.parse(t));
        if (!data?.settings || !Array.isArray(data.pages)) throw new Error('This is not a site backup file.');
        setSite(data);
      } catch (e) {
        dialog.alert(e.message, { title: 'Cannot load file' });
      }
    });
  };

  const [busy, setBusy] = useState('');

  const downloadFull = async () => {
    setBusy('Making the backup...');
    try {
      const r = await fetch('/api/backup', { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('The backup failed.');
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `site-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setBusy('');
    } catch (e) {
      setBusy('');
      dialog.alert(e.message, { title: 'Backup failed' });
    }
  };

  const restoreFull = async (file) => {
    if (!file) return;
    const ok = await dialog.confirm('Content and messages are replaced with the backup. Images in the backup are added. Unsaved changes are lost.', { title: 'Restore this backup?', confirmLabel: 'Restore' });
    if (!ok) return;
    setBusy('Restoring...');
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await api('/api/backup/restore', { method: 'POST', form });
      setSite(r.site);
      setSavedJson(JSON.stringify(r.site));
      setBusy('');
      dialog.alert(`The backup is restored. ${r.images} images were added.`, { title: 'Done' });
    } catch (e) {
      setBusy('');
      dialog.alert(e.message, { title: 'Restore failed' });
    }
  };

  const reset = async () => {
    if (!(await dialog.confirm('All content will be deleted. Images stay on the server.', { title: 'Reset to a blank site?', confirmLabel: 'Reset' }))) return;
    const s = await api('/api/site/reset', { method: 'POST' });
    setSite(s);
    setSavedJson(JSON.stringify(s));
  };

  return (
    <div>
      <div className="panel-head"><h2>Backup</h2></div>
      <fieldset className="a-box">
        <legend>Full backup</legend>
        <p className="a-hint">One .zip file with all content, messages and images. The login is not in the file. Keep a copy somewhere safe.</p>
        <div className="a-btns">
          <button type="button" className="a-btn primary" onClick={downloadFull} disabled={!!busy}>Download full backup</button>
          <label className={`a-btn ${busy ? 'disabled' : ''}`}>
            Restore full backup
            <input type="file" accept=".zip,application/zip" hidden disabled={!!busy} onChange={(e) => { restoreFull(e.target.files[0]); e.target.value = ''; }} />
          </label>
          {busy && <span className="a-hint">{busy}</span>}
        </div>
      </fieldset>
      <fieldset className="a-box">
        <legend>Content only</legend>
        <p className="a-hint">Text and settings only, as a small file. To load one, choose the file, then click Save.</p>
        <div className="a-btns">
          <button type="button" className="a-btn" onClick={exportJson}>Download</button>
          <label className="a-btn">
            Load file
            <input type="file" accept="application/json" hidden onChange={(e) => { importJson(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <button type="button" className="a-btn danger" onClick={reset}>Reset to blank site</button>
        </div>
      </fieldset>
    </div>
  );
}
