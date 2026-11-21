// Maps a section type to its public component. Schemas live in shared/schema.js.
import Hero from './Hero.jsx';
import TextBlock from './TextBlock.jsx';
import Gallery from './Gallery.jsx';
import Quote from './Quote.jsx';
import Contact from './Contact.jsx';

export const components = {
  hero: Hero,
  text: TextBlock,
  gallery: Gallery,
  quote: Quote,
  contact: Contact,
};
