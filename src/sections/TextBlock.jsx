import Carousel from '../components/Carousel.jsx';
import { Heading, Prose, Img } from '../components/Basics.jsx';
import { useLightbox } from '../components/Lightbox.jsx';

export default function TextBlock({ data, layout }) {
  const lightbox = useLightbox();
  const images = (data.images || []).filter((i) => i?.src);
  const media = images.length > 1
    ? <Carousel images={images} autoplay interval={6} onOpen={lightbox} />
    : images.length === 1 ? <Img image={images[0]} className="block-img" onClick={() => lightbox(images, 0)} /> : null;
  const members = (data.members || []).filter((m) => m.name || m.role || m.bio || m.image?.src);

  return (
    <div className="container">
      <Heading text={data.title} />
      <div className={`text-block text-${layout} ${media ? 'has-media' : ''}`}>
        {layout === 'two-column' ? (
          <>
            <Prose text={data.body} />
            <Prose text={data.bodySecond} />
          </>
        ) : (
          <>
            <Prose text={data.body} />
            {layout !== 'plain' && media && <div className="text-media">{media}</div>}
          </>
        )}
      </div>
      {(layout === 'plain' || layout === 'two-column') && media && <div className="text-media wide">{media}</div>}
      {members.length > 0 && (
        <div className="cards">
          {members.map((m) => (
            <div className="card member" key={m.id}>
              <Img image={m.image} className="member-img" />
              <Heading as="h3" text={m.name} />
              {m.role && <div className="muted">{m.role}</div>}
              <Prose text={m.bio} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
