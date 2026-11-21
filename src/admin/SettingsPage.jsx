import { Navigate, useParams } from 'react-router-dom';
import { settingsFields, settingsGroups, themePresets } from '../../shared/schema.js';
import { useAdmin } from './AdminContext.jsx';
import SchemaForm from './SchemaForm.jsx';

function Presets({ settings, onApply }) {
  return (
    <div className="a-row sf-gap">
      <div className="a-label">Color presets</div>
      <div className="a-presets">
        {Object.entries(themePresets).map(([k, p]) => {
          const active = Object.entries(p.colors).every(([key, v]) => settings[key]?.toLowerCase() === v);
          return (
            <button type="button" key={k} className={`a-preset ${active ? 'active' : ''}`} onClick={() => onApply(p.colors)}>
              <span className="a-swatches">
                {Object.values(p.colors).map((v) => <span key={v} style={{ background: v }} />)}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { group } = useParams();
  const { site, setSite } = useAdmin();
  if (!settingsGroups[group]) return <Navigate to="/admin/settings/general" replace />;
  const fields = settingsFields.filter((f) => (f.group || 'general') === group);
  const setSettings = (settings) => setSite({ ...site, settings });

  return (
    <div>
      <div className="panel-head"><h2>{settingsGroups[group]}</h2></div>
      <div className="a-box">
        {group === 'appearance' && (
          <Presets settings={site.settings} onApply={(colors) => setSettings({ ...site.settings, ...colors })} />
        )}
        <SchemaForm fields={fields} value={site.settings} onChange={setSettings} />
      </div>
    </div>
  );
}
