import express from 'express';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import nodemailer from 'nodemailer';
import { readJson, writeJson } from './store.js';

const scrypt = promisify(crypto.scrypt);

// The first login comes from .env. If ADMIN_PASSWORD is empty, the server makes a random password and shows it one time.
export const DEFAULT_USER = process.env.ADMIN_USER || 'admin';
export function defaultPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const pw = crypto.randomBytes(12).toString('base64url');
  console.log(`\nNo ADMIN_PASSWORD in .env. The server made a one time password: ${DEFAULT_USER} / ${pw}\n`);
  return pw;
}
const TOKEN_TTL = 12 * 60 * 60_000;
const RESET_TTL = 24 * 60 * 60_000;
const PORT = Number(process.env.PORT) || 3001;

// Password hashing
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(pw), salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(pw, stored) {
  const [, saltHex, keyHex] = String(stored || '').split('$');
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(String(pw ?? ''), Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const safeEqual = (a, b) => crypto.timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));

// Settings other server modules need.
export const authSettings = () => ({ notifyMessages: auth.notifyMessages !== false, publicUrl: process.env.PUBLIC_URL || auth.publicUrl || '' });

export const defaultPolicy = () => ({ maxPerIp: 5, ipLockMinutes: 15, maxGlobal: 15, globalLockMinutes: 30 });

export async function defaultAuth() {
  return {
    username: DEFAULT_USER,
    passwordHash: await hashPassword(defaultPassword()),
    isDefault: true,
    resetEmail: process.env.RESET_EMAIL || 'admin@example.com',
    publicUrl: '',
    smtp: { host: '', port: 587, secure: false, user: '', pass: '', from: '' },
    policy: defaultPolicy(),
    lockedUntil: 0,
    reset: null,
  };
}

let auth = readJson('auth.json', () => null);
if (!auth) {
  auth = await defaultAuth();
  writeJson('auth.json', auth);
}
const save = () => writeJson('auth.json', auth);

// Sessions
const tokens = new Map();
const newToken = () => {
  const t = crypto.randomBytes(24).toString('hex');
  tokens.set(t, Date.now() + TOKEN_TTL);
  return t;
};
const tokenOf = (req) => (req.get('authorization') || '').replace(/^Bearer /, '');

export function requireAuth(req, res, next) {
  const t = tokenOf(req);
  const exp = tokens.get(t);
  if (!exp || exp < Date.now()) {
    tokens.delete(t);
    return res.status(401).json({ error: 'Not signed in' });
  }
  next();
}

// Per IP rate limit for public endpoints.
export function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'Too many requests. Try again later.' });
    list.push(now);
    hits.set(req.ip, list);
    if (hits.size > 10_000) hits.clear();
    next();
  };
}

// Brute force lockout. Per IP lock, plus a full lock when there are too many failures in total.
const ipFails = new Map();
let globalFails = [];

const minutes = (ms) => Math.max(1, Math.ceil((ms - Date.now()) / 60_000));

function registerFail(ip) {
  const now = Date.now();
  const p = { ...defaultPolicy(), ...auth.policy };
  const st = ipFails.get(ip) || { fails: [], lockedUntil: 0 };
  st.fails = st.fails.filter((t) => now - t < p.ipLockMinutes * 60_000);
  st.fails.push(now);
  if (st.fails.length >= p.maxPerIp) {
    st.lockedUntil = now + p.ipLockMinutes * 60_000;
    st.fails = [];
  }
  ipFails.set(ip, st);
  if (ipFails.size > 10_000) ipFails.clear();

  globalFails = globalFails.filter((t) => now - t < p.globalLockMinutes * 60_000);
  globalFails.push(now);
  if (globalFails.length >= p.maxGlobal) {
    globalFails = [];
    auth.lockedUntil = now + p.globalLockMinutes * 60_000;
    save();
    const token = crypto.randomBytes(32).toString('hex');
    auth.reset = { hash: sha256(token), created: now, expires: now + RESET_TTL };
    save();
    console.warn(`Admin login locked until ${new Date(auth.lockedUntil).toISOString()}`);
    sendMail(
      'Admin login locked',
      `There were too many failed sign in attempts. The admin login is locked for ${p.globalLockMinutes} minutes.\n` +
      `Last attempt from IP: ${ip}\n\n` +
      `To unlock it now, open this link and set a new password. The link expires in 24 hours:\n` +
      `${baseUrl()}/admin/reset?token=${token}\n\nIf this was you, you can also wait for the lock to end.`
    ).catch((e) => console.error('Mail error:', e.message));
  }
}

function lockError(ip) {
  const now = Date.now();
  if (auth.lockedUntil > now) {
    return { status: 423, error: `Sign in is locked for ${minutes(auth.lockedUntil)} more minutes. An unlock link was sent to the reset email.` };
  }
  const st = ipFails.get(ip);
  if (st?.lockedUntil > now) {
    return { status: 429, error: `Too many failed attempts. Try again in ${minutes(st.lockedUntil)} minutes.` };
  }
  return null;
}

function clearLocks() {
  auth.lockedUntil = 0;
  ipFails.clear();
  globalFails = [];
}

// Email
function smtpConfig() {
  const s = auth.smtp || {};
  const env = process.env;
  return {
    host: s.host || env.SMTP_HOST || '',
    port: Number(s.port || env.SMTP_PORT) || 587,
    secure: s.host ? !!s.secure : env.SMTP_SECURE === 'true',
    user: s.user || env.SMTP_USER || '',
    pass: s.pass || env.SMTP_PASS || '',
    from: s.from || env.SMTP_FROM || s.user || env.SMTP_USER || '',
  };
}

export async function sendMail(subject, text) {
  const c = smtpConfig();
  if (!c.host || !auth.resetEmail) {
    console.log(`\n[Email not set up] To: ${auth.resetEmail}\nSubject: ${subject}\n${text}\n`);
    return { sent: false, error: 'Email is not set up. The message was written to the server log.' };
  }
  const transport = nodemailer.createTransport({
    host: c.host, port: c.port, secure: c.secure,
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
  });
  await transport.sendMail({ from: c.from, to: auth.resetEmail, subject, text });
  return { sent: true };
}

export const baseUrl = () => (process.env.PUBLIC_URL || auth.publicUrl || `http://localhost:${PORT}`).replace(/\/+$/, '');

// Validation
const USER_RE = /^[a-zA-Z0-9._@-]{3,40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function passwordError(pw, username) {
  if (typeof pw !== 'string' || pw.length < 8) return 'The password must have 8 or more characters.';
  if (pw.length > 200) return 'The password is too long.';
  if (pw.toLowerCase() === String(username).toLowerCase()) return 'The password must not be the same as the username.';
  return null;
}
const clampInt = (v, min, max, d) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

function accountView() {
  const s = auth.smtp || {};
  return {
    username: auth.username,
    isDefault: !!auth.isDefault,
    resetEmail: auth.resetEmail,
    publicUrl: auth.publicUrl,
    notifyMessages: auth.notifyMessages !== false,
    smtp: { host: s.host, port: s.port, secure: !!s.secure, user: s.user, from: s.from, hasPass: !!s.pass },
    policy: { ...defaultPolicy(), ...auth.policy },
  };
}

export const router = express.Router();

router.post('/login', async (req, res) => {
  const lock = lockError(req.ip);
  if (lock) return res.status(lock.status).json({ error: lock.error });
  const { username, password } = req.body || {};
  const passOk = String(password ?? '').length <= 200 && (await verifyPassword(password, auth.passwordHash));
  const userOk = safeEqual(String(username ?? '').toLowerCase(), auth.username.toLowerCase());
  if (!passOk || !userOk) {
    registerFail(req.ip);
    const after = lockError(req.ip);
    return res.status(after ? after.status : 401).json({ error: after ? after.error : 'Wrong username or password.' });
  }
  ipFails.delete(req.ip);
  res.json({ token: newToken() });
});

router.post('/logout', (req, res) => {
  tokens.delete(tokenOf(req));
  res.json({ ok: true });
});

router.get('/session', requireAuth, (req, res) => {
  res.json({ ok: true, username: auth.username, isDefault: !!auth.isDefault });
});

// Unlock link. It is only made when the login locks, and it goes to the reset email.
// There is no public "forgot password" request, so nobody can make the server send email.
router.post('/reset/confirm', rateLimit(10, 15 * 60_000), async (req, res) => {
  const { token, password } = req.body || {};
  const r = auth.reset;
  if (!r || r.expires < Date.now() || !token || !safeEqual(sha256(token), r.hash)) {
    return res.status(400).json({ error: 'This link is not valid or it has expired.' });
  }
  const err = passwordError(password, auth.username);
  if (err) return res.status(400).json({ error: err });
  auth.passwordHash = await hashPassword(password);
  auth.isDefault = false;
  auth.reset = null;
  clearLocks();
  tokens.clear();
  save();
  res.json({ ok: true, username: auth.username });
});

router.get('/account', requireAuth, (req, res) => res.json(accountView()));

// Every account change needs the current password.
router.put('/account', requireAuth, async (req, res) => {
  const b = req.body || {};
  if (!(await verifyPassword(b.currentPassword, auth.passwordHash))) {
    registerFail(req.ip);
    return res.status(403).json({ error: 'The current password is wrong.' });
  }
  const username = b.username === undefined ? auth.username : String(b.username).trim();
  if (!USER_RE.test(username)) return res.status(400).json({ error: 'The username must have 3 to 40 characters: letters, numbers, . _ @ -' });
  if (b.newPassword) {
    const err = passwordError(b.newPassword, username);
    if (err) return res.status(400).json({ error: err });
  }
  if (b.resetEmail !== undefined && !EMAIL_RE.test(String(b.resetEmail).trim())) {
    return res.status(400).json({ error: 'The reset email is not valid.' });
  }
  if (b.publicUrl && !/^https?:\/\/[^\s]+$/.test(b.publicUrl)) {
    return res.status(400).json({ error: 'The site address must start with http:// or https://' });
  }

  const credsChanged = username !== auth.username || !!b.newPassword;
  auth.username = username;
  if (b.newPassword) {
    auth.passwordHash = await hashPassword(b.newPassword);
    auth.isDefault = false;
  }
  if (b.resetEmail !== undefined) auth.resetEmail = String(b.resetEmail).trim();
  if (b.publicUrl !== undefined) auth.publicUrl = String(b.publicUrl).trim();
  if (b.notifyMessages !== undefined) auth.notifyMessages = !!b.notifyMessages;
  if (b.smtp) {
    const s = b.smtp;
    auth.smtp = {
      host: String(s.host || '').trim(),
      port: clampInt(s.port, 1, 65535, 587),
      secure: !!s.secure,
      user: String(s.user || '').trim(),
      pass: s.pass ? String(s.pass) : s.clearPass ? '' : auth.smtp?.pass || '',
      from: String(s.from || '').trim(),
    };
  }
  if (b.policy) {
    const p = b.policy;
    const d = defaultPolicy();
    auth.policy = {
      maxPerIp: clampInt(p.maxPerIp, 1, 100, d.maxPerIp),
      ipLockMinutes: clampInt(p.ipLockMinutes, 1, 1440, d.ipLockMinutes),
      maxGlobal: clampInt(p.maxGlobal, 1, 1000, d.maxGlobal),
      globalLockMinutes: clampInt(p.globalLockMinutes, 1, 1440, d.globalLockMinutes),
    };
  }
  let token;
  if (credsChanged) {
    tokens.clear();
    token = newToken();
  }
  save();
  res.json({ ...accountView(), token });
});

router.post('/account/test-email', requireAuth, async (req, res) => {
  try {
    const r = await sendMail('Test email', 'Email for the admin panel works.');
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
