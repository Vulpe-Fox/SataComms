import Carousel from '../components/Carousel.jsx';
import { Heading, Prose } from '../components/Basics.jsx';

export default function Hero({ data, layout, goTo }) {
  const hasImages = data.images?.some((i) => i?.src);
  return (
    <div className={`hero hero-${layout}`} style={{ minHeight: `${Number(data.height) || 70}vh` }}>
      {hasImages && layout !== 'split' && (
        <div className="hero-bg">
          <Carousel images={data.images} autoplay interval={data.interval} fill />
          <div className="hero-overlay" style={{ opacity: Number(data.overlay) || 0 }} />
        </div>
      )}
      <div className="hero-content container">
        <div className="hero-text">
          <Heading as="h1" text={data.title} />
          <Prose text={data.subtitle} className="prose hero-sub" />
          {data.buttonText && (
            <button type="button" className="btn" onClick={() => goTo(data.buttonTarget)}>{data.buttonText}</button>
          )}
        </div>
        {layout === 'split' && hasImages && (
          <div className="hero-media"><Carousel images={data.images} autoplay interval={data.interval} /></div>
        )}
      </div>
    </div>
  );
}
