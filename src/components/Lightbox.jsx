import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(() => {});
export const useLightbox = () => useContext(Ctx);

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null);
  const open = (images, index = 0) => setState({ images, index });
  const close = () => setState(null);
  const move = (n) => setState((s) => ({ ...s, index: (s.index + n + s.images.length) % s.images.length }));

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const img = state?.images[state.index];
  return (
    <Ctx.Provider value={open}>
      {children}
      {img && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true">
          <img src={img.src} alt={img.alt || ''} onClick={(e) => e.stopPropagation()} />
          {img.caption && <div className="lightbox-caption">{img.caption}</div>}
          {state.images.length > 1 && (
            <>
              <button type="button" className="carousel-btn prev" onClick={(e) => { e.stopPropagation(); move(-1); }} >Previous</button>
              <button type="button" className="carousel-btn next" onClick={(e) => { e.stopPropagation(); move(1); }} >Next</button>
            </>
          )}
          <button type="button" className="lightbox-close" onClick={close} >Close</button>
        </div>
      )}
    </Ctx.Provider>
  );
}
