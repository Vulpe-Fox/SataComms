import express from 'express';
import multer from 'multer';
import { ZipArchive } from 'archiver';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrateSite } from '../shared/schema.js';
import { DATA_DIR, UPLOAD_DIR, MESSAGE_FILES_DIR, writeJson } from './store.js';
import { requireAuth } from './auth.js';
import { IMAGE_EXT, isVariant, backfillImages } from './images.js';

// Full backup: content, messages, images and message images. The login is not included.
export const router = express.Router();

router.get('/backup', requireAuth, (req, res) => {
  const stamp = new Date().toISOString().slice(0, 10);
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="site-backup-${stamp}.zip"`);
  const zip = new ZipArchive({ zlib: { level: 6 } });
  zip.on('error', (e) => { console.error('Backup error:', e.message); res.destroy(e); });
  zip.pipe(res);
  for (const n of ['site.json', 'messages.json']) {
    const p = path.join(DATA_DIR, n);
    if (fs.existsSync(p)) zip.file(p, { name: n });
  }
  // Resized copies are left out. They are made again after a restore.
  for (const n of fs.readdirSync(UPLOAD_DIR)) {
    if (IMAGE_EXT.test(n) && !isVariant(n)) zip.file(path.join(UPLOAD_DIR, n), { name: `uploads/${n}` });
  }
  for (const n of fs.readdirSync(MESSAGE_FILES_DIR)) {
    if (IMAGE_EXT.test(n)) zip.file(path.join(MESSAGE_FILES_DIR, n), { name: `message-files/${n}` });
  }
  zip.finalize();
});

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

router.post('/backup/restore', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const zip = new AdmZip(req.file.path);
    const entries = zip.getEntries().filter((e) => !e.isDirectory);
    const siteEntry = entries.find((e) => e.entryName === 'site.json');
    if (!siteEntry) throw new Error('This is not a site backup. site.json is missing.');
    const site = migrateSite(JSON.parse(siteEntry.getData().toString('utf8')));
    if (!site?.settings || !Array.isArray(site.pages) || !site.pages.length) throw new Error('The site.json in this backup is not valid.');

    // Only known names are written. Folders in names are not allowed.
    let images = 0;
    for (const e of entries) {
      const m = e.entryName.match(/^(uploads|message-files)\/([^/\\]+)$/);
      if (!m || !IMAGE_EXT.test(m[2]) || m[2] !== path.basename(m[2]) || m[2].startsWith('.')) continue;
      fs.writeFileSync(path.join(m[1] === 'uploads' ? UPLOAD_DIR : MESSAGE_FILES_DIR, m[2]), e.getData());
      images++;
    }
    const msgEntry = entries.find((e) => e.entryName === 'messages.json');
    if (msgEntry) {
      const msgs = JSON.parse(msgEntry.getData().toString('utf8'));
      if (Array.isArray(msgs)) writeJson('messages.json', msgs);
    }
    writeJson('site.json', site);
    backfillImages().catch(() => {});
    res.json({ ok: true, site, images });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    fs.rm(req.file.path, () => {});
  }
});
