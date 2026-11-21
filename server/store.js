import './env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = process.env.DATA_DIR || path.join(root, 'data');
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(root, 'uploads');
// Files sent with the contact form. Private: only the admin can see them.
export const MESSAGE_FILES_DIR = path.join(DATA_DIR, 'message-files');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(MESSAGE_FILES_DIR, { recursive: true });

// JSON file store. Writes go to a temp file first, then rename.
const file = (name) => path.join(DATA_DIR, name);

export function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); }
  catch { return fallback(); }
}

export function writeJson(name, value) {
  const tmp = file(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file(name));
}

export const exists = (name) => fs.existsSync(file(name));
