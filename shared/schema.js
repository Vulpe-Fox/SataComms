// Field schemas. The admin panel builds its forms from these.
// To add a section type: add an entry here, then a component in src/sections/registry.jsx.

export const uid = () => Math.random().toString(36).slice(2, 10);

const title = { key: 'title', label: 'Title', type: 'text' };
const body = { key: 'body', label: 'Body', type: 'textarea' };

// Admin tabs. Fields without a group go to "content".
export const fieldGroups = {
  content: 'Content',
  images: 'Images',
  choices: 'Choices and prices',
  form: 'Form',
  layout: 'Layout',
};

// Color sets for Settings > Appearance. Taken from the dragon reference art.
export const themePresets = {
  dragonDark: {
    label: 'Dragon (dark)',
    colors: {
      colorPrimary: '#d7212b', // marking red
      colorAccent: '#f2a7c8', // soft pink
      colorBg: '#141012', // body black
      colorSurface: '#231b1f', // shaded fur
      colorText: '#f7f1f4', // horn white
      colorMuted: '#c4b0c8', // dusty lavender
    },
  },
  dragonLight: {
    label: 'Dragon (light)',
    colors: {
      colorPrimary: '#c41a28', // rose red
      colorAccent: '#7a3f9d', // deep lavender
      colorBg: '#faf3f8', // pale pink
      colorSurface: '#efe3f4', // lavender
      colorText: '#1f1619', // body black
      colorMuted: '#6c5870', // muted plum
    },
  },
};

export const settingsGroups = {
  general: 'General',
  commissions: 'Commission status',
  appearance: 'Appearance',
  pricing: 'Pricing',
  sharing: 'Link previews',
};

export const imageFields = [
  { key: 'alt', label: 'Alt text', type: 'text' },
  { key: 'caption', label: 'Caption', type: 'text' },
];

export const sectionTypes = {
  hero: {
    label: 'Hero banner',
    layouts: ['center', 'left', 'split'],
    fields: [
      title,
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'buttonText', label: 'Button text', type: 'text' },
      { key: 'buttonTarget', label: 'Button goes to page', type: 'page' },
      { key: 'images', label: 'Background images (slideshow)', group: 'images', type: 'images' },
      { key: 'interval', label: 'Slide interval (seconds)', group: 'layout', type: 'number', min: 1 },
      { key: 'overlay', label: 'Overlay darkness (0 to 1)', group: 'layout', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'height', label: 'Height (vh)', group: 'layout', type: 'number', min: 20, max: 100 },
    ],
    create: () => ({ title: '', subtitle: '', buttonText: '', buttonTarget: '', images: [], interval: 6, overlay: 0.4, height: 70 }),
  },

  text: {
    label: 'Text block',
    layouts: ['plain', 'image-left', 'image-right', 'two-column'],
    fields: [
      title,
      body,
      { key: 'bodySecond', label: 'Second column (two-column layout)', type: 'textarea' },
      { key: 'images', label: 'Images (more than one makes a carousel)', group: 'images', type: 'images' },
      {
        key: 'members', label: 'People / cards', type: 'list', itemLabel: 'Card', titleKey: 'name',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role', type: 'text' },
          { key: 'bio', label: 'Text', type: 'textarea' },
          { key: 'image', label: 'Image', type: 'image' },
        ],
        create: () => ({ name: '', role: '', bio: '', image: null }),
      },
    ],
    create: () => ({ title: '', body: '', bodySecond: '', images: [], members: [] }),
  },

  gallery: {
    label: 'Gallery',
    layouts: ['carousels', 'grid', 'tabs'],
    fields: [
      title,
      body,
      {
        key: 'albums', label: 'Albums / carousels', group: 'images', type: 'list', itemLabel: 'Album', titleKey: 'title',
        fields: [
          title,
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'images', label: 'Images', type: 'images' },
          { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
          { key: 'interval', label: 'Autoplay interval (seconds)', type: 'number', min: 1 },
        ],
        create: () => ({ title: '', description: '', images: [], autoplay: false, interval: 5 }),
      },
    ],
    create: () => ({ title: '', body: '', albums: [] }),
  },

  quote: {
    label: 'Commission options / quote',
    layouts: ['sidebar', 'stacked'],
    fields: [
      title,
      body,
      { key: 'basePrice', label: 'Base price', group: 'choices', type: 'number', step: 0.01 },
      { key: 'minPrice', label: 'Minimum total', group: 'choices', type: 'number', step: 0.01 },
      {
        key: 'groups', label: 'Option groups', group: 'choices', type: 'list', itemLabel: 'Group', titleKey: 'label',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'image', label: 'Group image (shows above the options)', type: 'image' },
          { key: 'description', label: 'Description', type: 'textarea' },
          {
            key: 'kind', label: 'Selection type', type: 'select',
            options: [
              { value: 'single', label: 'Pick one' },
              { value: 'multi', label: 'Pick any' },
              { value: 'quantity', label: 'Quantity per option' },
            ],
          },
          { key: 'required', label: 'Required (pick one only)', type: 'boolean' },
          { key: 'display', label: 'Display', type: 'select', options: [
            { value: 'cards', label: 'Cards' },
            { value: 'list', label: 'List' },
            { value: 'dropdown', label: 'Dropdown (pick one only)' },
          ] },
          {
            key: 'options', label: 'Options', type: 'list', itemLabel: 'Option', titleKey: 'label',
            fields: [
              { key: 'label', label: 'Label', type: 'text' },
              { key: 'image', label: 'Option image', type: 'image' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'price', label: 'Price change (negative to subtract)', type: 'number', step: 0.01 },
              { key: 'mode', label: 'Price mode', type: 'select', options: [
                { value: 'flat', label: 'Flat amount' },
                { value: 'percent', label: 'Percent of subtotal' },
              ] },
              { key: 'max', label: 'Max quantity, the most the + button can reach (quantity groups only, default 99)', type: 'number', min: 1 },
              { key: 'disabled', label: 'Unavailable', type: 'boolean' },
            ],
            create: () => ({ label: '', description: '', price: 0, mode: 'flat', max: 99, image: null, disabled: false }),
          },
        ],
        create: () => ({ label: '', image: null, description: '', kind: 'single', required: false, display: 'cards', options: [] }),
      },
      { key: 'summaryTitle', label: 'Summary title', type: 'text' },
      { key: 'baseLabel', label: 'Base price label', type: 'text' },
      { key: 'totalLabel', label: 'Total label', type: 'text' },
      { key: 'depositPercent', label: 'Deposit (percent of total, 0 hides it)', group: 'choices', type: 'number', min: 0, max: 100 },
      { key: 'depositMin', label: 'Minimum deposit amount (optional)', group: 'choices', type: 'number', min: 0, step: 0.01 },
      { key: 'depositLabel', label: 'Deposit label', group: 'choices', type: 'text' },
      { key: 'depositNote', label: 'Text about the deposit (shows under the deposit on the quote and in the contact form)', group: 'choices', type: 'textarea' },
      { key: 'note', label: 'Note under total', type: 'textarea' },
      { key: 'buttonText', label: 'Request button text', type: 'text' },
      { key: 'buttonTarget', label: 'Request button goes to page', type: 'page' },
    ],
    create: () => ({
      title: '', body: '', basePrice: 0, minPrice: 0, groups: [],
      summaryTitle: '', baseLabel: '', totalLabel: '', depositPercent: 0, depositMin: '', depositLabel: 'Deposit', depositNote: '', note: '', buttonText: '', buttonTarget: '',
    }),
  },

  contact: {
    label: 'Contact',
    layouts: ['split', 'stacked'],
    fields: [
      title,
      body,
      { key: 'email', label: 'Email shown on page', type: 'text' },
      {
        key: 'links', label: 'Links', type: 'list', itemLabel: 'Link', titleKey: 'label',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
        ],
        create: () => ({ label: '', url: '' }),
      },
      { key: 'showForm', label: 'Show form', group: 'form', type: 'boolean' },
      {
        key: 'formFields', label: 'Form fields', group: 'form', type: 'list', itemLabel: 'Field', titleKey: 'label',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'text', label: 'Text' },
            { value: 'email', label: 'Email' },
            { value: 'tel', label: 'Phone' },
            { value: 'textarea', label: 'Long text' },
            { value: 'date', label: 'Date' },
            { value: 'file', label: 'Images (for example reference sheets, up to 5)' },
            { value: 'checkbox', label: 'Checkbox (for example "I agree to the terms")' },
          ] },
          { key: 'required', label: 'Required', type: 'boolean' },
          { key: 'linkPage', label: 'Link to a page after the label (checkbox only)', type: 'page' },
        ],
        create: () => ({ label: '', type: 'text', required: false, linkPage: '' }),
      },
      { key: 'includeQuote', label: 'Attach current quote to message', group: 'form', type: 'boolean' },
      { key: 'quoteLabel', label: 'Quote box label', group: 'form', type: 'text' },
      { key: 'noQuoteText', label: 'Quote box text when there is no quote yet', group: 'form', type: 'text' },
      { key: 'submitText', label: 'Submit button text', group: 'form', type: 'text' },
      { key: 'successText', label: 'Message after send', group: 'form', type: 'text' },
      { key: 'privacyText', label: 'Privacy note under the send button', group: 'form', type: 'textarea' },
    ],
    create: () => ({
      title: '', body: '', email: '', links: [], showForm: true,
      formFields: [
        { id: uid(), label: 'Name', type: 'text', required: true },
        { id: uid(), label: 'Email', type: 'email', required: true },
        { id: uid(), label: 'Reference sheet', type: 'file', required: false },
        { id: uid(), label: 'Message', type: 'textarea', required: true },
        { id: uid(), label: 'I agree to the', type: 'checkbox', required: true, linkPage: '' },
      ],
      includeQuote: true, quoteLabel: 'Your quote', noQuoteText: 'No quote', submitText: 'Send', successText: 'Thank you. Your message was sent.',
      privacyText: 'We only use your details to reply to you. We do not share them.',
    }),
  },
};

export const settingsFields = [
  { key: 'siteTitle', group: 'general', label: 'Site title', type: 'text' },
  { key: 'logo', group: 'general', label: 'Logo', type: 'image' },
  { key: 'footerText', group: 'general', label: 'Footer text', type: 'textarea' },
  { key: 'commissionsOpen', group: 'commissions', label: 'Commissions are open', type: 'boolean' },
  { key: 'showStatus', group: 'commissions', label: 'Show the status in the menu bar', type: 'boolean' },
  { key: 'statusOpenText', group: 'commissions', label: 'Status text when open', type: 'text' },
  { key: 'statusClosedText', group: 'commissions', label: 'Status text when closed', type: 'text' },
  { key: 'closedLocksForm', group: 'commissions', label: 'When closed, lock the contact form and hide quote request buttons', type: 'boolean' },
  { key: 'closedFormText', group: 'commissions', label: 'Text shown in place of the form when closed', type: 'textarea' },
  { key: 'siteDescription', group: 'sharing', label: 'Site description (shows under the title in link previews and search results)', type: 'textarea' },
  { key: 'shareImage', group: 'sharing', label: 'Preview image (shows when the link is shared; wide images work best)', type: 'image' },
  { key: 'currency', group: 'pricing', label: 'Currency symbol', type: 'text' },
  { key: 'currencyAfter', group: 'pricing', label: 'Symbol after number', type: 'boolean' },
  { key: 'decimals', group: 'pricing', label: 'Decimal places', type: 'number', min: 0, max: 4 },
  { key: 'navStyle', group: 'appearance', label: 'Navigation', type: 'select', options: [
    { value: 'sticky', label: 'Sticky top bar' },
    { value: 'static', label: 'Static top bar' },
    { value: 'hidden', label: 'Hidden' },
  ] },
  { key: 'colorPrimary', group: 'appearance', label: 'Primary color', type: 'color' },
  { key: 'colorAccent', group: 'appearance', label: 'Accent color', type: 'color' },
  { key: 'colorBg', group: 'appearance', label: 'Background color', type: 'color' },
  { key: 'colorSurface', group: 'appearance', label: 'Card color', type: 'color' },
  { key: 'colorText', group: 'appearance', label: 'Text color', type: 'color' },
  { key: 'colorMuted', group: 'appearance', label: 'Muted text color', type: 'color' },
  { key: 'font', group: 'appearance', label: 'Body font (CSS font-family)', type: 'text' },
  { key: 'headingFont', group: 'appearance', label: 'Heading font (CSS font-family)', type: 'text' },
  { key: 'radius', group: 'appearance', label: 'Corner radius (px)', type: 'number', min: 0, max: 40 },
  { key: 'maxWidth', group: 'appearance', label: 'Content width (px)', type: 'number', min: 600, max: 2000 },
];

export const defaultSettings = () => ({
  siteTitle: '', logo: null, footerText: '',
  commissionsOpen: true, showStatus: true, statusOpenText: 'Commissions open', statusClosedText: 'Commissions closed',
  closedLocksForm: true, closedFormText: 'Commissions are closed right now. Please check back later.',
  siteDescription: '', shareImage: null,
  currency: '$', currencyAfter: false, decimals: 2, navStyle: 'sticky',
  ...themePresets.dragonDark.colors,
  font: 'system-ui, sans-serif', headingFont: 'system-ui, sans-serif',
  radius: 12, maxWidth: 1100,
});

export const createSection = (type, layout) => ({
  id: uid(),
  type,
  anchor: '',
  visible: true,
  layout: layout || sectionTypes[type].layouts[0],
  data: sectionTypes[type].create(),
});

// A page has its own address (slug) and menu label. The home page has an empty slug.
export const RESERVED_SLUGS = ['admin', 'api', 'uploads', 'assets'];
export const createPage = (navLabel = '', slug = '', sections = []) => ({
  id: uid(), slug, navLabel, showInNav: true, visible: true, sections,
});

export const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Blank sample groups so the quote math works out of the box.
const opt = (price, mode = 'flat') => ({ id: uid(), label: '', description: '', price, mode, max: 99, image: null, disabled: false });
const group = (kind, required, options) => ({ id: uid(), label: '', image: null, description: '', kind, required, display: 'cards', options });
const sampleGroups = () => [
  group('single', true, [opt(0), opt(500), opt(1200)]),
  group('multi', false, [opt(150), opt(-100), opt(10, 'percent')]),
  group('quantity', false, [opt(50), opt(25)]),
];

// Default page for each section type. Used for new sites and to move old data into pages.
const PAGE_FOR_TYPE = { hero: 'home', text: 'about', gallery: 'gallery', quote: 'quote', contact: 'contact' };
const DEFAULT_PAGES = [
  { key: 'home', label: 'Home', slug: '' },
  { key: 'about', label: 'About Us', slug: 'about' },
  { key: 'gallery', label: 'Gallery', slug: 'gallery' },
  { key: 'quote', label: 'Quote', slug: 'quote' },
  { key: 'contact', label: 'Contact', slug: 'contact' },
];

export const defaultSite = () => {
  const [home, about, gallery, quote, contact] = DEFAULT_PAGES.map((p) => createPage(p.label, p.slug));
  const terms = createPage('Terms of Service', 'terms', [createSection('text', 'plain')]);
  const pages = [home, about, gallery, terms, quote, contact];
  home.sections = [createSection('hero')];
  about.sections = [createSection('text', 'image-right')];
  gallery.sections = [createSection('gallery')];
  quote.sections = [{ ...createSection('quote'), data: { ...sectionTypes.quote.create(), groups: sampleGroups(), buttonTarget: contact.id } }];
  contact.sections = [createSection('contact')];
  const agree = contact.sections[0].data.formFields.find((f) => f.type === 'checkbox');
  if (agree) agree.linkPage = terms.id;
  return { settings: defaultSettings(), pages };
};

// Moves data from the old one page format (site.sections) into pages.
export function migrateSite(site) {
  if (!site || Array.isArray(site.pages)) return site;
  const old = Array.isArray(site.sections) ? site.sections : [];
  const pages = DEFAULT_PAGES.map((p) => ({ ...createPage(p.label, p.slug), key: p.key }));
  const pageOfSection = {};
  for (const sec of old) {
    const page = pages.find((p) => p.key === (PAGE_FOR_TYPE[sec.type] || 'home'));
    if (sec.navLabel && page.key !== 'home' && !page.sections.length) page.navLabel = sec.navLabel;
    const { navLabel, showInNav, ...rest } = sec;
    page.sections.push(rest);
    pageOfSection[sec.id] = page.id;
  }
  for (const p of pages) {
    if (!p.sections.length) {
      const type = Object.keys(PAGE_FOR_TYPE).find((t) => PAGE_FOR_TYPE[t] === p.key);
      p.sections.push(createSection(type));
    }
    delete p.key;
    for (const sec of p.sections) {
      if (sec.data?.buttonTarget) sec.data.buttonTarget = pageOfSection[sec.data.buttonTarget] || '';
    }
  }
  const { sections, ...rest } = site;
  return { ...rest, pages };
}

export const allSections = (site) => (site.pages || []).flatMap((p) => p.sections);
