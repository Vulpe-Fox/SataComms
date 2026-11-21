import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { uid, defaultSite, migrateSite } from '../shared/schema.js';
import { MESSAGE_FILES_DIR, readJson, writeJson } from './store.js';
import { requireAuth, rateLimit, sendMail, baseUrl, authSettings } from './auth.js';

export const router = express.Router();

const FILE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const MAX_FILES = 5;
const upload = multer({
  storage: multer.diskStorage({
    destination: MESSAGE_FILES_DIR,
    filename: (req, f, cb) => cb(null, `${uid()}${uid()}${path.extname(f.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: MAX_FILES, fields: 5, fieldSize: 200_000 },
  fileFilter: (req, f, cb) => cb(null, f.mimetype.startsWith('image/') && FILE_EXT.test(f.originalname)),
});

const removeFiles = (files) => files.forEach((f) => fs.rm(path.join(MESSAGE_FILES_DIR, path.basename(f.name || f.filename)), () => {}));

function emailText(m) {
  const lines = m.fields.map((f) => `${f.label}: ${f.value}`);
  if (m.files.length) lines.push(`Images: ${m.files.length} attached (see the admin panel)`);
  if (m.quote) {
    lines.push('', 'Quote:');
    if (m.quote.base) lines.push(`  Base: ${m.quote.baseText}`);
    for (const l of m.quote.lines || []) lines.push(`  ${[l.groupLabel, l.label].filter(Boolean).join(': ') || 'Option'}${l.qty > 1 ? ` x${l.qty}` : ''}: ${l.amountText}`);
    lines.push(`  Total: ${m.quote.totalText}`);
    if (m.quote.depositText) lines.push(`  Deposit: ${m.quote.depositText}`);
  }
  lines.push('', `Open the admin panel: ${baseUrl()}/admin/messages`);
  return lines.join('\n');
}

// Upload errors (too big, too many) become a clear message.
function receive(req, res, next) {
  upload.array('files', MAX_FILES)(req, res, (err) => {
    if (!err) return next();
    removeFiles(req.files || []);
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 10 MB or smaller.'
      : err.code === 'LIMIT_FILE_COUNT' ? `You can attach ${MAX_FILES} images or fewer.` : 'The upload failed.';
    res.status(400).json({ error: msg });
  });
}

router.post('/messages', rateLimit(5, 10 * 60_000), receive, async (req, res) => {
  const files = req.files || [];
  let body;
  try { body = req.is('multipart/form-data') ? JSON.parse(req.body.payload || '{}') : req.body || {}; }
  catch { removeFiles(files); return res.status(400).json({ error: 'Invalid message' }); }

  const { sectionId, fields, quote, website, elapsed } = body;
  // Spam filter: bots fill the hidden "website" field or send too fast. Act as if it worked.
  if (website || Number(elapsed) < 3000) { removeFiles(files); return res.json({ ok: true }); }

  const settings = migrateSite(readJson('site.json', defaultSite)).settings || {};
  if (settings.commissionsOpen === false && settings.closedLocksForm !== false) {
    removeFiles(files);
    return res.status(403).json({ error: settings.closedFormText || 'Commissions are closed.' });
  }
  if (!Array.isArray(fields) || fields.length > 50) { removeFiles(files); return res.status(400).json({ error: 'Invalid message' }); }

  const m = {
    id: uid(),
    date: new Date().toISOString(),
    sectionId: String(sectionId || ''),
    fields: fields.map((f) => ({ label: String(f?.label ?? '').slice(0, 200), value: String(f?.value ?? '').slice(0, 10_000) })),
    files: files.map((f) => ({ name: f.filename, original: path.basename(f.originalname).slice(0, 120), size: f.size })),
    quote: quote && typeof quote === 'object' ? quote : null,
    read: false,
  };
  const messages = readJson('messages.json', () => []);
  messages.unshift(m);
  removeFiles(messages.slice(5000).flatMap((x) => x.files || []));
  writeJson('messages.json', messages.slice(0, 5000));
  res.json({ ok: true });

  if (authSettings().notifyMessages) {
    sendMail('New message from the website', emailText(m)).catch((e) => console.error('Mail error:', e.message));
  }
});

router.get('/messages', requireAuth, (req, res) => res.json(readJson('messages.json', () => [])));

router.get('/messages/file/:name', requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const p = path.join(MESSAGE_FILES_DIR, name);
  if (!FILE_EXT.test(name) || !fs.existsSync(p)) return res.status(404).json({ error: 'Not found' });
  res.set('Cache-Control', 'private, max-age=3600');
  res.sendFile(p);
});

router.patch('/messages/:id', requireAuth, (req, res) => {
  const messages = readJson('messages.json', () => []);
  const m = messages.find((x) => x.id === req.params.id);
  if (m) m.read = !!req.body?.read;
  writeJson('messages.json', messages);
  res.json({ ok: true });
});

router.delete('/messages/:id', requireAuth, (req, res) => {
  const messages = readJson('messages.json', () => []);
  const m = messages.find((x) => x.id === req.params.id);
  if (m) removeFiles(m.files || []);
  writeJson('messages.json', messages.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
});
