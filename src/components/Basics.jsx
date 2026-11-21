import { paragraphs, srcSet } from '../util.js';

// Renders nothing when the text is blank.
export function Heading({ as: Tag = 'h2', text, className }) {
  return text ? <Tag className={className}>{text}</Tag> : null;
}

export function Prose({ text, className = 'prose' }) {
  const ps = paragraphs(text);
  if (!ps.length) return null;
  return <div className={className}>{ps.map((p, i) => <p key={i}>{p}</p>)}</div>;
}

export function Img({ image, className, sizes = '(max-width: 800px) 100vw, 50vw', ...rest }) {
  if (!image?.src) return null;
  const set = srcSet(image.src);
  return <img src={image.src} srcSet={set} sizes={set ? sizes : undefined} alt={image.alt || ''} loading="lazy" decoding="async" className={className} {...rest} />;
}
