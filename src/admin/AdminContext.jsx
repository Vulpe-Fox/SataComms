import { createContext, useContext } from 'react';
import { sectionTypes } from '../../shared/schema.js';

export const AdminContext = createContext(null);
export const AdminTheme = createContext(null);
export const useAdminTheme = () => adminVars(useContext(AdminTheme)?.settings);

// Admin colors come from the site theme.
export function adminVars(s) {
  if (!s) return undefined;
  return {
    '--a-bg': s.colorBg,
    '--a-panel': s.colorSurface,
    '--a-text': s.colorText,
    '--a-muted': s.colorMuted,
    '--a-primary': s.colorPrimary,
    '--a-accent': s.colorAccent,
  };
}
export const useAdmin = () => useContext(AdminContext);

export const typeLabel = (t) => sectionTypes[t]?.label || t;
export const pageName = (p) => p.navLabel || (p.slug ? `/${p.slug}` : 'Home');

export function findSection(site, id) {
  for (const page of site.pages) {
    const section = page.sections.find((s) => s.id === id);
    if (section) return { page, section };
  }
  return {};
}

// Returns a new site with one page changed.
export const withPage = (site, page) => ({ ...site, pages: site.pages.map((p) => (p.id === page.id ? page : p)) });

export const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};
