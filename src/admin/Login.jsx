import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, setToken } from '../api.js';
import { useAdminTheme } from './AdminContext.jsx';
import './admin.css';

export function Login({ onDone }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const theme = useAdminTheme();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api('/api/login', { method: 'POST', body: { username, password } });
      setToken(token);
      onDone();
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin login" style={theme}>
      <form onSubmit={submit} className="a-box login-box">
        <h1>Admin</h1>
        <input className="a-input" autoComplete="username" autoFocus placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="a-input" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="a-error">{error}</div>}
        <button className="a-btn primary" type="submit" disabled={busy || !username || !password}>Sign in</button>
      </form>
    </div>
  );
}

// Opened from the unlock link in the lockout email.
export function ResetPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const theme = useAdminTheme();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('The passwords are not the same.');
    try {
      const r = await api('/api/reset/confirm', { method: 'POST', body: { token: params.get('token'), password } });
      setDone(r.username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin login" style={theme}>
      <form onSubmit={submit} className="a-box login-box">
        <h1>Set a new password</h1>
        {done ? (
          <>
            <p>The password is changed and the login is unlocked. Your username is <strong>{done}</strong>.</p>
            <Link className="a-btn primary" to="/admin">Sign in</Link>
          </>
        ) : (
          <>
            <input className="a-input" type="password" autoComplete="new-password" placeholder="New password (8 or more characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="a-input" type="password" autoComplete="new-password" placeholder="Type the new password again" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <div className="a-error">{error}</div>}
            <button className="a-btn primary" type="submit" disabled={!password}>Save password</button>
          </>
        )}
      </form>
    </div>
  );
}
