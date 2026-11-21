import './env.js';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { defaultSite, migrateSite, uid } from '../shared/schema.js';
import { root, UPLOAD_DIR, readJson, writeJson, exists } from './store.js';
import { router as authRouter, requireAuth, authSettings } from './auth.js';
import { router as messagesRouter } from './messages.js';
import { router as backupRouter } from './backup.js';
import { IMAGE_EXT, isVariant, processImage, removeImage, backfillImages } from './images.js';
import { renderIndex } from './meta.js';

const DIST_DIR = path.join(root, 'dist');
const PORT = Number(process.env.PORT) || 3001;

if (!exists('site.json')) writeJson('site.json', defaultSite());
if (!exists('messages.json')) writeJson('messages.json', []);

const app = express();
// TRUST_PROXY is a number of proxy hops (for example 1), or proxy addresses.
const trustProxy = process.env.TRUST_PROXY || 'loopback';
app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
app.disable('x-powered-by');

// Security headers. HSTS is only sent over HTTPS.
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:", "font-src 'self' data:", "connect-src 'self'",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ].join('; '),
  });
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use('/api', authRouter);
app.use('/api', messagesRouter);
app.use('/api', backupRouter);

const loadSite = () => migrateSite(readJson('site.json', defaultSite));

// Site content
app.get('/api/site', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(loadSite());
});

app.put('/api/site', requireAuth, (req, res) => {
  const site = req.body;
  if (!site || typeof site.settings !== 'object' || !Array.isArray(site.pages)) {
    return res.status(400).json({ error: 'Invalid site data' });
  }
  writeJson('site.json', site);
  res.json({ ok: true });
});

app.post('/api/site/reset', requireAuth, (req, res) => {
  const site = defaultSite();
  writeJson('site.json', site);
  res.json(site);
});

// Media
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => {
      const ext = path.extname(f.originalname).toLowerCase();
      const base = path.basename(f.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
      cb(null, `${base}-${uid()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, f.mimetype.startsWith('image/') && IMAGE_EXT.test(f.originalname)),
});

app.get('/api/media', requireAuth, (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter((n) => IMAGE_EXT.test(n) && !isVariant(n))
    .map((n) => {
      const st = fs.statSync(path.join(UPLOAD_DIR, n));
      return { name: n, src: `/uploads/${n}`, size: st.size, date: st.mtimeMs };
    })
    .sort((a, b) => b.date - a.date);
  res.json(files);
});

app.post('/api/media', requireAuth, upload.array('files', 50), async (req, res) => {
  const files = req.files || [];
  for (const f of files) {
    try { await processImage(f.filename); } catch (e) { console.error(`Resize failed for ${f.filename}: ${e.message}`); }
  }
  res.json(files.map((f) => ({ name: f.filename, src: `/uploads/${f.filename}` })));
});

app.delete('/api/media/:name', requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  if (IMAGE_EXT.test(name) && !isVariant(name)) removeImage(name);
  res.json({ ok: true });
});

// Static files
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }), (req, res) => res.status(404).end());
if (fs.existsSync(DIST_DIR)) {
  const html = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  app.use(express.static(DIST_DIR, { index: false, maxAge: '1d' }));
  app.get('/{*any}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const origin = authSettings().publicUrl.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(renderIndex(html, loadSite(), req.path, origin));
  });
}

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  backfillImages().catch((e) => console.error('Resize error:', e.message));
});
