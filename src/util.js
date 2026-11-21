export { uid } from '../shared/schema.js';

export function formatPrice(value, s = {}) {
  const n = Number(value) || 0;
  const d = Number.isFinite(Number(s.decimals)) ? Number(s.decimals) : 2;
  const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const sym = s.currency ?? '';
  const out = s.currencyAfter ? `${abs}${sym}` : `${sym}${abs}`;
  return n < 0 ? `-${out}` : out;
}

export const sectionAnchor = (sec) => sec.anchor || `s-${sec.id}`;


// Turns blank lines into paragraphs.
export function paragraphs(text) {
  return String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

// Smaller copies the server makes for each upload. GIFs have none.
export function srcSet(src) {
  if (!src || !/^\/uploads\/[^/]+\.(png|jpe?g|webp|avif)$/i.test(src) || /-w\d+\.webp$/i.test(src)) return undefined;
  const base = src.replace(/\.[^.]+$/, '');
  return `${base}-w640.webp 640w, ${base}-w1280.webp 1280w, ${src} 2400w`;
}
