// Adds the page title, description and preview image to index.html.
// Chat apps and social sites read these tags to build link previews.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderIndex(html, site, reqPath, origin) {
  const settings = site.settings || {};
  const slug = decodeURIComponent(reqPath).replace(/^\/+|\/+$/g, '');
  const page = (site.pages || []).find((p) => p.visible && (p.slug || '') === slug);
  const title = [page?.slug ? page.navLabel : '', settings.siteTitle].filter(Boolean).join(' | ');
  const description = settings.siteDescription || '';
  const image = settings.shareImage?.src || settings.logo?.src || '';
  const url = origin + (slug ? `/${slug}` : '/');

  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    title && `<meta property="og:title" content="${esc(title)}" />`,
    title && `<meta name="twitter:title" content="${esc(title)}" />`,
    description && `<meta name="description" content="${esc(description)}" />`,
    description && `<meta property="og:description" content="${esc(description)}" />`,
    description && `<meta name="twitter:description" content="${esc(description)}" />`,
    image && `<meta property="og:image" content="${esc(origin + image)}" />`,
    image && `<meta name="twitter:image" content="${esc(origin + image)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    settings.colorBg && `<meta name="theme-color" content="${esc(settings.colorBg)}" />`,
  ].filter(Boolean).join('\n    ');

  return html
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace('</head>', `    ${tags}\n  </head>`);
}
