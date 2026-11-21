import { useContext, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { api, getToken, setToken } from "../api.js";
import { AdminContext, AdminTheme, adminVars, findSection } from "./AdminContext.jsx";
import { DialogProvider, useDialog } from "./Dialog.jsx";
import { SiteView } from "../Site.jsx";
import { QuoteProvider } from "../components/QuoteContext.jsx";
import PagePage from "./PagePage.jsx";
import Sidebar from "./Sidebar.jsx";
import SectionPage from "./SectionPage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import AccountPage from "./AccountPage.jsx";
import DataPage from "./DataPage.jsx";
import MediaLibrary from "./MediaLibrary.jsx";
import MessagesPanel from "./MessagesPanel.jsx";
import { Login, ResetPage } from "./Login.jsx";
import "./admin.css";

export default function Admin() {
  // Saved site colors, for the sign in pages. The panel uses the live draft colors.
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    api("/api/site").then((s) => setSettings(s.settings)).catch(() => {});
  }, []);
  return (
    <AdminTheme.Provider value={{ settings, setSettings }}>
      <DialogProvider style={adminVars(settings)}>
        <Routes>
          <Route path="reset" element={<ResetPage />} />
          <Route path="*" element={<Panel />} />
        </Routes>
      </DialogProvider>
    </AdminTheme.Provider>
  );
}

function Panel() {
  const [session, setSession] = useState(undefined);
  const [site, setSite] = useState(null);
  const [savedJson, setSavedJson] = useState("");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [picker, setPicker] = useState(null);
  const [previewPageId, setPreviewPageId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useDialog();
  const theme = useContext(AdminTheme);

  // Dialogs follow the draft colors.
  useEffect(() => {
    if (site) theme.setSettings(site.settings);
  }, [site?.settings]);

  // Preview the page that is open in the editor.
  useEffect(() => {
    if (!site) return;
    const [, kind, id] = location.pathname.replace(/^\/admin\/?/, "").match(/^(page|section)\/([^/]+)/) || [];
    if (kind === "page") setPreviewPageId(id);
    if (kind === "section") setPreviewPageId(findSection(site, id).page?.id || null);
  }, [location.pathname, !!site]);

  const checkSession = () => {
    if (!getToken()) return setSession(null);
    api("/api/session")
      .then(setSession)
      .catch(() => {
        setToken(null);
        setSession(null);
      });
  };
  useEffect(checkSession, []);

  useEffect(() => {
    if (!session) return;
    api("/api/site").then((s) => {
      setSite(s);
      setSavedJson(JSON.stringify(s));
    });
  }, [!!session]);

  const dirty = site && JSON.stringify(site) !== savedJson;

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    if (!dirty) return;
    setStatus("Saving...");
    try {
      await api("/api/site", { method: "PUT", body: site });
      setSavedJson(JSON.stringify(site));
      setStatus("Saved");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) {
      if (e.status === 401) setSession(null);
      setStatus(`Error: ${e.message}`);
    }
  }

  async function logout() {
    if (dirty && !(await dialog.confirm("You have unsaved changes. They will be lost if you sign out.", { title: "Sign out?", confirmLabel: "Sign out" }))) return;
    await api("/api/logout", { method: "POST" }).catch(() => {});
    setToken(null);
    setSession(null);
    setSite(null);
  }

  const ctx = useMemo(
    () => ({
      site: site || { pages: [], settings: {} },
      setSite,
      session,
      setSession,
      pickImages: (multiple) =>
        new Promise((resolve) => setPicker({ multiple, resolve })),
    }),
    [site, session],
  );

  const closePicker = (result) => {
    picker?.resolve(result || []);
    setPicker(null);
  };

  if (session === undefined) return null;
  if (!session) return <Login onDone={checkSession} />;
  if (!site) return null;

  const first = site.pages[0];
  const previewPage = site.pages.find((p) => p.id === previewPageId);

  return (
    <AdminContext.Provider value={ctx}>
      <div className={`admin ${preview ? "with-preview" : ""}`} style={adminVars(site.settings)}>
        <header className="a-top">
          <strong className="a-logo">Admin</strong>
          <div className="a-btns">
            <span className="a-status">
              {status || (dirty ? "Unsaved changes" : "")}
            </span>
            <label className="a-check">
              <input
                type="checkbox"
                checked={preview}
                onChange={(e) => setPreview(e.target.checked)}
              />{" "}
              Preview
            </label>
            <a className="a-btn" href="/" target="_blank" rel="noreferrer">
              Open site
            </a>
            <button
              type="button"
              className="a-btn"
              disabled={!dirty}
              onClick={() => setSite(JSON.parse(savedJson))}
            >
              Undo all
            </button>
            <button
              type="button"
              className="a-btn primary"
              disabled={!dirty}
              onClick={save}
            >
              Save
            </button>
            <button type="button" className="a-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        {session.isDefault && (
          <div className="a-warn">
            You used the default login. Change it now on the{" "}
            <button
              type="button"
              className="a-link"
              onClick={() => navigate("/admin/account")}
            >
              Account
            </button>{" "}
            page.
          </div>
        )}
        <div className="a-body">
          <Sidebar />
          <main className="a-panel">
            <Routes>
              <Route
                index
                element={
                  first ? (
                    <Navigate to={`page/${first.id}`} replace />
                  ) : (
                    <Navigate to="settings/general" replace />
                  )
                }
              />
              <Route path="page/:id" element={<PagePage />} />
              <Route path="section/:id/:tab?" element={<SectionPage />} />
              <Route path="settings/:group" element={<SettingsPage />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="messages" element={<MessagesPanel />} />
              <Route path="account" element={<AccountPage />} />
              <Route
                path="data"
                element={
                  <DataPage savedJson={savedJson} setSavedJson={setSavedJson} />
                }
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
          {preview && (
            <div className="a-preview">
              <QuoteProvider>
                <SiteView site={site} page={previewPage} onNavigate={(p) => setPreviewPageId(p.id)} />
              </QuoteProvider>
            </div>
          )}
        </div>
        {picker && (
          <div className="a-modal" onClick={() => closePicker()}>
            <div className="a-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="panel-head">
                <h2>{picker.multiple ? "Select images" : "Select an image"}</h2>
                <button
                  type="button"
                  className="a-btn"
                  onClick={() => closePicker()}
                >
                  Cancel
                </button>
              </div>
              <MediaLibrary multiple={picker.multiple} onSelect={closePicker} />
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}
