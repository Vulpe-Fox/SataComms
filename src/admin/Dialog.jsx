import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Themed replacement for window.confirm and window.alert.
// Use: const dialog = useDialog(); if (await dialog.confirm('Delete?')) ...
const Ctx = createContext(null);
export const useDialog = () => useContext(Ctx);

export function DialogProvider({ style, children }) {
  const [d, setD] = useState(null);
  const cancelRef = useRef();
  const okRef = useRef();

  const api = useMemo(() => {
    const open = (opts) => new Promise((resolve) => setD({ ...opts, resolve }));
    return {
      confirm: (message, o = {}) => open({
        message,
        title: o.title || 'Are you sure?',
        confirmLabel: o.confirmLabel || 'Delete',
        danger: o.danger ?? true,
        cancel: true,
      }),
      alert: (message, o = {}) => open({ message, title: o.title || '', confirmLabel: 'OK', cancel: false }),
    };
  }, []);

  const close = (value) => {
    d?.resolve(value);
    setD(null);
  };

  // Focus Cancel first for risky actions. Escape cancels.
  useEffect(() => {
    if (!d) return;
    (d.cancel ? cancelRef : okRef).current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {d && (
        <div className="admin a-dialog-backdrop" style={style} onClick={() => close(false)}>
          <div
            className="a-dialog" role="alertdialog" aria-modal="true"
            aria-labelledby={d.title ? 'a-dialog-title' : undefined} aria-describedby="a-dialog-msg"
            onClick={(e) => e.stopPropagation()}
          >
            {d.title && <h2 id="a-dialog-title">{d.title}</h2>}
            <p id="a-dialog-msg">{d.message}</p>
            <div className="a-dialog-btns">
              {d.cancel && <button ref={cancelRef} type="button" className="a-btn" onClick={() => close(false)}>Cancel</button>}
              <button ref={okRef} type="button" className={`a-btn primary ${d.danger ? 'a-btn-danger' : ''}`} onClick={() => close(true)}>
                {d.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
