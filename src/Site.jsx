import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { components } from './sections/registry.jsx';
import { LightboxProvider } from './components/Lightbox.jsx';
import { QuoteProvider } from './components/QuoteContext.jsx';
import { Img, Prose } from './components/Basics.jsx';
import { api } from './api.js';
import { sectionAnchor } from './util.js';

export function themeVars(s = {}) {
  return {
    '--primary': s.colorPrimary,
    '--accent': s.colorAccent,
    '--bg': s.colorBg,
    '--surface': s.colorSurface,
    '--text': s.colorText,
    '--muted': s.colorMuted,
    '--font': s.font,
    '--heading-font': s.headingFont,
    '--radius': `${Number(s.radius) || 0}px`,
    '--max-width': `${Number(s.maxWidth) || 1100}px`,
  };
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return scrolled;
}

export const pagePath = (p) => `/${p?.slug || ''}`;

// Renders one page of a site. Used by the public site and the admin preview.
// onNavigate(page) changes the page. The caller decides how (router or local state).
export function SiteView({ site, page, onNavigate }) {
  const scrolled = useScrolled();
  const settings = site.settings || {};
  const pages = (site.pages || []).filter((p) => p.visible);
  const current = page || pages.find((p) => !p.slug) || pages[0];
  const nav = pages.filter((p) => p.showInNav && p.navLabel);
  const home = pages.find((p) => !p.slug) || pages[0];
  const goTo = (pageId) => {
    const p = pages.find((x) => x.id === pageId);
    if (p) onNavigate(p);
  };
  const link = (p) => ({
    href: pagePath(p),
    onClick: (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      onNavigate(p);
    },
  });
  const sections = (current?.sections || []).filter((s) => s.visible);
  const open = settings.commissionsOpen !== false;
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [current?.id]);

  return (
    <LightboxProvider>
      <div className="site" style={themeVars(settings)}>
        {settings.navStyle !== 'hidden' && (
          <header className={`nav nav-${settings.navStyle || 'sticky'} ${scrolled ? 'scrolled' : ''}`}>
            <div className="container nav-inner">
              <div className="nav-left">
                <a className="brand" {...(home ? link(home) : { href: '/' })}>
                  <Img image={settings.logo} className="logo" sizes="80px" />
                  {settings.siteTitle && <span>{settings.siteTitle}</span>}
                </a>
                {settings.showStatus !== false && (
                  <span className={`status ${open ? 'open' : 'closed'}`}>
                    {open ? settings.statusOpenText || 'Commissions open' : settings.statusClosedText || 'Commissions closed'}
                  </span>
                )}
              </div>
              {nav.length > 0 && (
                <button type="button" className="menu-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
                  {menuOpen ? 'Close' : 'Menu'}
                </button>
              )}
              <nav className={menuOpen ? 'open' : ''}>
                {nav.map((p) => (
                  <a key={p.id} {...link(p)} className={p.id === current?.id ? 'active' : ''} aria-current={p.id === current?.id ? 'page' : undefined}>
                    {p.navLabel}
                  </a>
                ))}
              </nav>
            </div>
          </header>
        )}
        <main className={`page ${sections[0]?.type === 'hero' ? 'starts-with-hero' : ''}`} key={current?.id}>
          {sections.map((s) => {
            const C = components[s.type];
            if (!C) return null;
            return (
              <section key={s.id} id={sectionAnchor(s)} className={`section section-${s.type}`}>
                <C section={s} data={s.data || {}} layout={s.layout} settings={settings} goTo={goTo} pages={pages} />
              </section>
            );
          })}
        </main>
        {settings.footerText && (
          <footer className="footer"><div className="container"><Prose text={settings.footerText} /></div></footer>
        )}
      </div>
    </LightboxProvider>
  );
}

export default function Site() {
  const [site, setSite] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api('/api/site').then(setSite).catch((e) => setError(e.message));
  }, []);

  const slug = decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, ''));
  const pages = (site?.pages || []).filter((p) => p.visible);
  const page = pages.find((p) => (p.slug || '') === slug) || pages.find((p) => !p.slug) || pages[0];

  useEffect(() => {
    if (!site) return;
    const t = [page?.slug ? page.navLabel : '', site.settings?.siteTitle].filter(Boolean);
    document.title = t.join(' | ');
    document.body.style.background = site.settings?.colorBg || '';
  }, [site, page]);

  // New page: go to the top, or to the #anchor if there is one.
  useEffect(() => {
    if (!site) return;
    const id = location.hash.slice(1);
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [site, location.pathname, location.hash]);

  if (error) return <div className="load-error">{error}</div>;
  if (!site) return null;
  return (
    <QuoteProvider>
      <SiteView site={site} page={page} onNavigate={(p) => navigate(pagePath(p))} />
    </QuoteProvider>
  );
}
