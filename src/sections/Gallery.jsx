import { useState } from 'react';
import Carousel from '../components/Carousel.jsx';
import { Heading, Prose } from '../components/Basics.jsx';
import { srcSet } from '../util.js';
import { useLightbox } from '../components/Lightbox.jsx';

function Album({ album, layout, lightbox }) {
  const images = (album.images || []).filter((i) => i?.src);
  return (
    <div className="album">
      <Heading as="h3" text={album.title} />
      <Prose text={album.description} />
      {layout === 'grid' ? (
        <div className="grid">
          {images.map((img, i) => (
            <figure key={img.src + i} onClick={() => lightbox(images, i)}>
              <img src={img.src} srcSet={srcSet(img.src)} sizes="(max-width: 600px) 50vw, 300px" alt={img.alt || ''} loading="lazy" decoding="async" />
              {img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        <Carousel images={images} autoplay={album.autoplay} interval={album.interval} onOpen={lightbox} />
      )}
    </div>
  );
}

export default function Gallery({ data, layout }) {
  const lightbox = useLightbox();
  const albums = data.albums || [];
  const [tab, setTab] = useState(0);
  const active = albums[Math.min(tab, albums.length - 1)];

  return (
    <div className="container">
      <Heading text={data.title} />
      <Prose text={data.body} />
      {layout === 'tabs' ? (
        <>
          {albums.length > 1 && (
            <div className="tabs">
              {albums.map((a, i) => (
                <button type="button" key={a.id} className={i === tab ? 'active' : ''} onClick={() => setTab(i)}>
                  {a.title || i + 1}
                </button>
              ))}
            </div>
          )}
          {active && <Album album={{ ...active, title: '' }} layout="grid" lightbox={lightbox} />}
        </>
      ) : (
        albums.map((a) => <Album key={a.id} album={a} layout={layout} lightbox={lightbox} />)
      )}
    </div>
  );
}
