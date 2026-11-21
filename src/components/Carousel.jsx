import { useEffect, useState, useCallback } from 'react';
import { srcSet } from '../util.js';

export default function Carousel({ images = [], autoplay = false, interval = 5, onOpen, className = '', fill = false }) {
  const list = images.filter((i) => i?.src);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = list.length;
  const go = useCallback((n) => setIndex((i) => (count ? (i + n + count) % count : 0)), [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    const t = setInterval(() => go(1), Math.max(1, Number(interval) || 5) * 1000);
    return () => clearInterval(t);
  }, [autoplay, paused, interval, count, go]);

  if (!count) return null;
  const current = list[index];

  return (
    <div
      className={`carousel ${fill ? 'carousel-fill' : ''} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
      tabIndex={0}
    >
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {list.map((img, i) => (
          <div className="carousel-slide" key={img.src + i} aria-hidden={i !== index}>
            <img
              src={img.src}
              srcSet={srcSet(img.src)}
              sizes={fill ? '100vw' : '(max-width: 800px) 100vw, 60vw'}
              alt={img.alt || ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              onClick={onOpen ? () => onOpen(list, i) : undefined}
              style={onOpen ? { cursor: 'zoom-in' } : undefined}
            />
          </div>
        ))}
      </div>
      {current.caption && <div className="carousel-caption">{current.caption}</div>}
      {count > 1 && (
        <>
          <button type="button" className="carousel-btn prev" onClick={() => go(-1)} >Previous</button>
          <button type="button" className="carousel-btn next" onClick={() => go(1)} >Next</button>
          <div className="carousel-dots">
            {list.map((_, i) => (
              <button type="button" key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
