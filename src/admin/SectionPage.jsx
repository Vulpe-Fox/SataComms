import { NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { sectionTypes, fieldGroups, uid } from '../../shared/schema.js';
import { useAdmin, typeLabel, pageName, findSection, withPage } from './AdminContext.jsx';
import SchemaForm from './SchemaForm.jsx';
import { useDialog } from './Dialog.jsx';

// Fields every section has. They show on the Layout tab.
const placementFields = (type) => [
  {
    key: 'layout', label: 'Layout', type: 'choice',
    options: sectionTypes[type].layouts.map((l) => ({ value: l, label: l })),
  },
  { key: 'visible', label: 'Visible on site', type: 'boolean' },
  { key: 'anchor', label: 'Anchor id, for links like /about#team (optional)', type: 'text' },
];

// Groups this type uses, in the order of fieldGroups. Layout is always last.
function tabsFor(type) {
  const used = new Set(sectionTypes[type].fields.map((f) => f.group || 'content'));
  used.add('layout');
  return Object.keys(fieldGroups).filter((g) => used.has(g));
}

export default function SectionPage() {
  const { id, tab } = useParams();
  const { site, setSite } = useAdmin();
  const navigate = useNavigate();
  const dialog = useDialog();
  const { page, section } = findSection(site, id);
  if (!section) return <Navigate to="/admin" replace />;

  const type = sectionTypes[section.type];
  if (!type) return <div className="a-error">Unknown section type: {section.type}</div>;

  const tabs = tabsFor(section.type);
  const active = tabs.includes(tab) ? tab : tabs[0];
  const fields = type.fields.filter((f) => (f.group || 'content') === active);

  const update = (sec) => setSite(withPage(site, { ...page, sections: page.sections.map((s) => (s.id === sec.id ? sec : s)) }));
  const duplicate = () => {
    const copy = { ...structuredClone(section), id: uid(), anchor: '' };
    const i = page.sections.indexOf(section);
    setSite(withPage(site, { ...page, sections: [...page.sections.slice(0, i + 1), copy, ...page.sections.slice(i + 1)] }));
    navigate(`/admin/section/${copy.id}`);
  };
  const remove = async () => {
    if (!(await dialog.confirm('The section and its content will be deleted when you save.', { title: 'Delete this section?' }))) return;
    setSite(withPage(site, { ...page, sections: page.sections.filter((s) => s.id !== section.id) }));
    navigate(`/admin/page/${page.id}`);
  };
  const moveTo = (pageId) => {
    if (pageId === page.id) return;
    setSite({
      ...site,
      pages: site.pages.map((p) => {
        if (p.id === page.id) return { ...p, sections: p.sections.filter((s) => s.id !== section.id) };
        if (p.id === pageId) return { ...p, sections: [...p.sections, section] };
        return p;
      }),
    });
  };

  return (
    <div>
      <div className="panel-head">
        <div>
          <h2>{typeLabel(section.type)}</h2>
          <div className="a-hint">On page: {pageName(page)}{section.visible ? '' : ' (hidden)'}</div>
        </div>
        <div className="a-btns">
          <button type="button" className="a-btn" onClick={duplicate}>Duplicate</button>
          <button type="button" className="a-btn danger" onClick={remove}>Delete</button>
        </div>
      </div>

      <nav className="a-subtabs">
        {tabs.map((g) => (
          <NavLink key={g} to={`/admin/section/${section.id}/${g}`} className={g === active ? 'active' : ''}>
            {fieldGroups[g]}
          </NavLink>
        ))}
      </nav>

      <div className="a-box">
        {active === 'layout' && (
          <div className="sf-gap">
            <SchemaForm fields={placementFields(section.type)} value={section} onChange={update} />
            <div className="a-row" style={{ marginTop: '0.8rem' }}>
              <div className="a-label">Page</div>
              <select className="a-input" value={page.id} onChange={(e) => moveTo(e.target.value)}>
                {site.pages.map((p) => <option key={p.id} value={p.id}>{pageName(p)}</option>)}
              </select>
            </div>
          </div>
        )}
        {fields.length > 0 && (
          <SchemaForm
            key={section.id + active}
            fields={fields}
            value={section.data}
            onChange={(data) => update({ ...section, data })}
          />
        )}
      </div>
    </div>
  );
}
