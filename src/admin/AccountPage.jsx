import { useEffect, useState } from 'react';
import { api, setToken } from '../api.js';
import { useAdmin } from './AdminContext.jsx';
import SchemaForm from './SchemaForm.jsx';

const loginFields = [
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'newPassword', label: 'New password (blank keeps the current password)', type: 'password' },
  { key: 'confirmPassword', label: 'Type the new password again', type: 'password' },
];

const recoveryFields = [
  { key: 'resetEmail', label: 'Admin email. Lockout alerts, unlock links and new message alerts go here.', type: 'text' },
  { key: 'notifyMessages', label: 'Email me when someone sends a message from the contact form', type: 'boolean' },
  { key: 'publicUrl', label: 'Site address for links in emails (for example https://example.com)', type: 'text' },
];

const smtpFields = [
  { key: 'host', label: 'SMTP server', type: 'text' },
  { key: 'port', label: 'Port', type: 'number', min: 1, max: 65535 },
  { key: 'secure', label: 'Use TLS (usually on for port 465)', type: 'boolean' },
  { key: 'user', label: 'Username', type: 'text' },
  { key: 'pass', label: 'Password (blank keeps the saved password)', type: 'password' },
  { key: 'from', label: 'From address', type: 'text' },
];

const policyFields = [
  { key: 'maxPerIp', label: 'Failed attempts from one address before it is blocked', type: 'number', min: 1 },
  { key: 'ipLockMinutes', label: 'Block time for that address (minutes)', type: 'number', min: 1 },
  { key: 'maxGlobal', label: 'Failed attempts in total before all sign in is locked', type: 'number', min: 1 },
  { key: 'globalLockMinutes', label: 'Full lock time (minutes)', type: 'number', min: 1 },
];

export default function AccountPage() {
  const { session, setSession } = useAdmin();
  const [form, setForm] = useState(null);
  const [current, setCurrent] = useState('');
  const [msg, setMsg] = useState({});

  const load = () => api('/api/account').then((a) => setForm({ ...a, newPassword: '', confirmPassword: '', smtp: { ...a.smtp, pass: '' } }));
  useEffect(() => { load(); }, []);

  if (!form) return null;
  const set = (patch) => setForm({ ...form, ...patch });

  async function save(e) {
    e.preventDefault();
    setMsg({});
    if (form.newPassword && form.newPassword !== form.confirmPassword) return setMsg({ error: 'The new passwords are not the same.' });
    try {
      const r = await api('/api/account', {
        method: 'PUT',
        body: {
          currentPassword: current,
          username: form.username,
          newPassword: form.newPassword || undefined,
          resetEmail: form.resetEmail,
          publicUrl: form.publicUrl,
          notifyMessages: form.notifyMessages,
          smtp: form.smtp,
          policy: form.policy,
        },
      });
      if (r.token) setToken(r.token);
      setSession({ ...session, username: r.username, isDefault: r.isDefault });
      setForm({ ...r, newPassword: '', confirmPassword: '', smtp: { ...r.smtp, pass: '' } });
      setCurrent('');
      setMsg({ ok: 'Account saved.' });
    } catch (err) {
      setMsg({ error: err.message });
    }
  }

  async function testEmail() {
    setMsg({});
    try {
      const r = await api('/api/account/test-email', { method: 'POST' });
      setMsg(r.sent ? { ok: `Test email sent to ${form.resetEmail}.` } : { error: r.error });
    } catch (err) {
      setMsg({ error: err.message });
    }
  }

  return (
    <form onSubmit={save} autoComplete="off">
      <div className="panel-head"><h2>Account and security</h2></div>
      <p className="a-hint">These settings save on their own. The Save button at the top is not used here.</p>

      <fieldset className="a-box">
        <legend>Login</legend>
        <SchemaForm fields={loginFields} value={form} onChange={setForm} />
      </fieldset>

      <fieldset className="a-box">
        <legend>Email alerts and recovery</legend>
        <SchemaForm fields={recoveryFields} value={form} onChange={setForm} />
      </fieldset>

      <fieldset className="a-box">
        <legend>Email server</legend>
        <p className="a-hint">
          The server uses this to send alerts. If it is blank, alerts go to the server log instead.
          {form.smtp.hasPass && ' A password is saved.'}
        </p>
        <SchemaForm fields={smtpFields} value={form.smtp} onChange={(smtp) => set({ smtp })} />
        <div className="a-btns" style={{ marginTop: '0.8rem' }}>
          <button type="button" className="a-btn" onClick={testEmail}>Send test email (uses saved settings)</button>
        </div>
      </fieldset>

      <fieldset className="a-box">
        <legend>Lockout</legend>
        <p className="a-hint">
          Failed sign in attempts lock the login. A full lock sends one alert with an unlock link to the reset email.
          There is no public password reset.
        </p>
        <SchemaForm fields={policyFields} value={form.policy} onChange={(policy) => set({ policy })} />
      </fieldset>

      <div className="a-box a-save-row">
        <input
          className="a-input" type="password" autoComplete="current-password" placeholder="Current password (needed to save)"
          value={current} onChange={(e) => setCurrent(e.target.value)}
        />
        <button type="submit" className="a-btn primary" disabled={!current}>Save account</button>
      </div>
      {msg.error && <div className="a-error">{msg.error}</div>}
      {msg.ok && <div className="a-ok">{msg.ok}</div>}
    </form>
  );
}
