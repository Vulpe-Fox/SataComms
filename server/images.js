import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOAD_DIR } from './store.js';

export const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;
// Smaller copies made next to each upload: name-w640.webp and name-w1280.webp.
export const WIDTHS = [640, 1280];
const MAX_ORIGINAL = 2400;
export const isVariant = (name) => /-w\d+\.webp$/i.test(name);
const variantName = (name, w) => `${name.replace(/\.[^.]+$/, '')}-w${w}.webp`;
// GIFs can move, so they stay as they are.
const resizable = (name) => IMAGE_EXT.test(name) && !/\.gif$/i.test(name) && !isVariant(name);

// Makes the smaller copies, and shrinks very large originals.
export async function processImage(name) {
  if (!resizable(name)) return;
  const file = path.join(UPLOAD_DIR, name);
  const meta = await sharp(file).metadata();
  if (meta.width > MAX_ORIGINAL || meta.height > MAX_ORIGINAL) {
    const buf = await sharp(file).rotate().resize(MAX_ORIGINAL, MAX_ORIGINAL, { fit: 'inside' }).toBuffer();
    fs.writeFileSync(file, buf);
  }
  for (const w of WIDTHS) {
    await sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 })
      .toFile(path.join(UPLOAD_DIR, variantName(name, w)));
  }
}

export function removeImage(name) {
  for (const n of [name, ...WIDTHS.map((w) => variantName(name, w))]) {
    const p = path.join(UPLOAD_DIR, n);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

// Makes missing copies for images uploaded before resizing existed.
export async function backfillImages() {
  const names = fs.readdirSync(UPLOAD_DIR).filter(resizable);
  for (const n of names) {
    if (WIDTHS.every((w) => fs.existsSync(path.join(UPLOAD_DIR, variantName(n, w))))) continue;
    try { await processImage(n); } catch (e) { console.error(`Resize failed for ${n}: ${e.message}`); }
  }
}
