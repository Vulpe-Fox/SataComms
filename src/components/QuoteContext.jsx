import { createContext, useContext, useState } from 'react';

// Keeps quote picks while the visitor moves between pages, and shares the result with the contact form.
const Ctx = createContext({ quote: null, setQuote: () => {}, selections: {}, setSelections: () => {} });

export function QuoteProvider({ children }) {
  const [quote, setQuote] = useState(null);
  const [selections, setSelections] = useState({});
  return <Ctx.Provider value={{ quote, setQuote, selections, setSelections }}>{children}</Ctx.Provider>;
}

export const useQuote = () => useContext(Ctx);
