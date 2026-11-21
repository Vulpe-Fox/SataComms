import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { sectionTypes, createSection, slugify, RESERVED_SLUGS } from '../../shared/schema.js';
import { useAdmin, pageName, typeLabel, withPage, move } from './AdminContext.jsx';
import SchemaForm from './SchemaForm.jsx';
import { useDialog } from './Dialog.jsx';

const pageFields = [
  { key: 'navLabel', label: 'Menu label', type: 'text' },
  { key: 'showInNav', label: 'Show in menu', type: 'boolean' },
  { key: 'visible', label: 'Visible on site', type: 'boolean' },
];

export default function PagePage() {
  const { id } = useParams();
  const { site, setSite } = useAdmin();
  const navigate = useNavigate();
  const dialog = useDialog();
  const [newType, setNewType] = useState(Object.keys(sectionTypes)[0]);
  const page = site.pages.find((p) => p.id === id);
  if (!page) return <Navigate to="/admin" replace />;

  const isHome = !page.slug;
  const update = (p) => setSite(withPage(site, p));
  const slugTaken = site.pages.some((p) => p.id !== page.id && p.slug === page.slug);
  const slugReserved = RESERVED_SLUGS.includes(page.slug);

  const addSection = () => {
    const s = createSection(newType);
    update({ ...page, sections: [...page.sections, s] });
    navigate(`/admin/section/${s.id}`);
  };
  const removePage = async () => {
    if (!(await dialog.confirm('The page and all its sections will be deleted when you save.', { title: 'Delete this page?' }))) return;
    setSite({ ...site, pages: site.pages.filter((p) => p.id !== page.id) });
    navigate('/admin');
  };

  return (
    <div>
      <div className="panel-head">
        <div>
          <h2>{pageName(page)}</h2>
          <div className="a-hint">Page{isHome ? ' (home)' : ''}</div>
        </div>
        {!isHome && <button type="button" className="a-btn danger" onClick={removePage}>Delete page</button>}
      </div>

      <fieldset className="a-box">
        <legend>Page</legend>
        <SchemaForm fields={pageFields} value={page} onChange={update} />
        {isHome ? (
          <p className="a-hint">This is the home page. Its address is <code>/</code>.</p>
        ) : (
          <div className="a-row" style={{ marginTop: '0.8rem' }}>
            <div className="a-label">Address</div>
            <div className="a-slug">
              <span>/</span>
              <input
                className="a-input" value={page.slug}
                onChange={(e) => update({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 60) || '-' })}
                onBlur={() => update({ ...page, slug: slugify(page.slug) || `page-${page.id}` })}
              />
            </div>
            {slugTaken && <div className="a-error">Another page uses this address.</div>}
            {slugReserved && <div className="a-error">This address is reserved. Use a different one.</div>}
          </div>
        )}
      </fieldset>

      <fieldset className="a-box">
        <legend>Sections on this page</legend>
        {page.sections.length === 0 && <p className="a-hint">This page has no sections.</p>}
        {page.sections.map((s, i) => (
          <div key={s.id} className={`a-item ${s.visible ? '' : 'off'}`}>
            <div className="a-item-head">
              <Link className="a-item-title" to={`/admin/section/${s.id}`}>
                {typeLabel(s.type)}{s.anchor ? ` (#${s.anchor})` : ''}{s.visible ? '' : ' (hidden)'}
              </Link>
              <div className="a-btns">
                <button type="button" className="a-word" onClick={() => update({ ...page, sections: move(page.sections, i, -1) })}>Up</button>
                <button type="button" className="a-word" onClick={() => update({ ...page, sections: move(page.sections, i, 1) })}>Down</button>
                <button
                  type="button" className="a-word danger"
                  onClick={async () => (await dialog.confirm('The section and its content will be deleted when you save.', { title: 'Delete this section?' })) && update({ ...page, sections: page.sections.filter((x) => x.id !== s.id) })}
                >Delete</button>
              </div>
            </div>
          </div>
        ))}
        <div className="a-btns" style={{ marginTop: '0.8rem' }}>
          <select className="a-input a-inline" value={newType} onChange={(e) => setNewType(e.target.value)} aria-label="Section type">
            {Object.entries(sectionTypes).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
          <button type="button" className="a-btn" onClick={addSection}>Add section</button>
        </div>
      </fieldset>
    </div>
  );
}
