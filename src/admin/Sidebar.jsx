import { NavLink, useNavigate } from 'react-router-dom';
import { settingsGroups, createPage } from '../../shared/schema.js';
import { useAdmin, pageName, typeLabel, withPage, move } from './AdminContext.jsx';

const link = ({ isActive }) => `a-nav-link ${isActive ? 'active' : ''}`;

export default function Sidebar() {
  const { site, setSite } = useAdmin();
  const navigate = useNavigate();
  const pages = site.pages;

  const addPage = () => {
    const p = createPage('', '');
    p.slug = `page-${p.id}`;
    setSite({ ...site, pages: [...pages, p] });
    navigate(`/admin/page/${p.id}`);
  };

  return (
    <aside className="a-side">
      <div className="a-side-group">
        <div className="a-side-title">Pages</div>
        {pages.map((p, i) => (
          <div key={p.id} className="a-tree">
            <div className={`a-sec ${p.visible ? '' : 'off'}`}>
              <NavLink to={`/admin/page/${p.id}`} className={link}>
                <span className="a-sec-name">{pageName(p)}</span>
              </NavLink>
              <div className="a-sec-tools">
                <button type="button" onClick={() => setSite({ ...site, pages: move(pages, i, -1) })} disabled={i === 0}>Up</button>
                <button type="button" onClick={() => setSite({ ...site, pages: move(pages, i, 1) })} disabled={i === pages.length - 1}>Down</button>
                <button
                  type="button" title={p.visible ? 'Hide page' : 'Show page'}
                  onClick={() => setSite(withPage(site, { ...p, visible: !p.visible }))}
                >{p.visible ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {p.sections.map((s) => (
              <NavLink key={s.id} to={`/admin/section/${s.id}`} className={(a) => `${link(a)} a-child ${s.visible ? '' : 'off'}`}>
                <span className="a-sec-name">{s.anchor || typeLabel(s.type)}</span>
              </NavLink>
            ))}
          </div>
        ))}
        <div className="a-sec-add">
          <button type="button" className="a-btn" onClick={addPage}>Add page</button>
        </div>
      </div>

      <div className="a-side-group">
        <div className="a-side-title">Site settings</div>
        {Object.entries(settingsGroups).map(([k, label]) => (
          <NavLink key={k} to={`/admin/settings/${k}`} className={link}>{label}</NavLink>
        ))}
      </div>

      <div className="a-side-group">
        <div className="a-side-title">Library</div>
        <NavLink to="/admin/media" className={link}>Images</NavLink>
        <NavLink to="/admin/messages" className={link}>Messages</NavLink>
      </div>

      <div className="a-side-group">
        <div className="a-side-title">Admin</div>
        <NavLink to="/admin/account" className={link}>Account and security</NavLink>
        <NavLink to="/admin/data" className={link}>Backup</NavLink>
      </div>
    </aside>
  );
}
