import { useEffect, useMemo, useState } from 'react';
import { Heading, Prose, Img } from '../components/Basics.jsx';
import { useQuote } from '../components/QuoteContext.jsx';
import { calcQuote, initialSelection } from '../quote.js';
import { formatPrice } from '../util.js';

function priceTag(o, settings) {
  const p = Number(o.price) || 0;
  if (!p) return '';
  const sign = p > 0 ? '+' : '-';
  return o.mode === 'percent' ? `${sign}${Math.abs(p)}%` : `${sign}${formatPrice(Math.abs(p), settings)}`;
}

// Most the + button can reach. Set per option in the admin panel. Blank means 99.
const DEFAULT_MAX = 99;
const maxOf = (o) => (Number(o.max) > 0 ? Math.floor(Number(o.max)) : DEFAULT_MAX);

// Digits only text field. No browser spinner, but arrow keys still step the value.
function QtyInput({ value, max, disabled, label, onCommit }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = (t) => {
    const n = t === '' ? 0 : parseInt(t, 10);
    onCommit(Math.max(0, Math.min(max, n || 0)));
  };
  return (
    <input
      type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
      value={text} disabled={disabled} aria-label={label}
      onChange={(e) => {
        let t = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (t !== '' && parseInt(t, 10) > max) t = String(max);
        setText(t);
        if (t !== '') commit(t);
      }}
      onBlur={() => { commit(text); setText(String(value)); }}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); onCommit(Math.min(max, value + 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); onCommit(Math.max(0, value - 1)); }
      }}
    />
  );
}

function Group({ group, value, onChange, settings }) {
  const options = group.options || [];
  const isQty = group.kind === 'quantity';
  const isOn = (o) => (group.kind === 'single' ? value === o.id : Array.isArray(value) && value.includes(o.id));

  const toggle = (o) => {
    if (o.disabled) return;
    if (group.kind === 'single') onChange(value === o.id && !group.required ? undefined : o.id);
    else {
      const list = Array.isArray(value) ? value : [];
      onChange(list.includes(o.id) ? list.filter((x) => x !== o.id) : [...list, o.id]);
    }
  };

  const qtyOf = (o) => Math.min(Number(value?.[o.id]) || 0, maxOf(o));
  const limit = maxOf;
  const setQty = (o, q) => {
    onChange({ ...(value || {}), [o.id]: Math.max(0, Math.min(limit(o), Math.floor(Number(q) || 0))) });
  };

  let body;
  if (group.kind === 'single' && group.display === 'dropdown') {
    body = (
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || undefined)} aria-label={group.label || 'Option'}>
        {!group.required && <option value="" />}
        {options.map((o) => (
          <option key={o.id} value={o.id} disabled={o.disabled}>
            {[o.label, priceTag(o, settings)].filter(Boolean).join('  ')}
          </option>
        ))}
      </select>
    );
  } else {
    body = (
      <div className={`opts opts-${group.display === 'list' ? 'list' : 'cards'}`}>
        {options.map((o) => {
          const qty = isQty ? qtyOf(o) : 0;
          const active = isQty ? qty > 0 : isOn(o);
          return (
            <div
              key={o.id}
              className={`opt ${active ? 'active' : ''} ${o.disabled ? 'disabled' : ''}`}
              role={isQty ? undefined : group.kind === 'single' ? 'radio' : 'checkbox'}
              aria-checked={isQty ? undefined : active}
              aria-disabled={o.disabled || undefined}
              tabIndex={isQty || o.disabled ? -1 : 0}
              onClick={isQty ? undefined : () => toggle(o)}
              onKeyDown={(e) => {
                if (!isQty && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggle(o); }
              }}
            >
              <Img image={o.image} className="opt-img" />
              <div className="opt-main">
                {o.label && <div className="opt-label">{o.label}</div>}
                <Prose text={o.description} className="prose small" />
              </div>
              <div className="opt-price">{priceTag(o, settings)}</div>
              {isQty && (
                <div className="qty">
                  <button type="button" onClick={() => setQty(o, qty - 1)} disabled={o.disabled || qty <= 0} aria-label="Less">-</button>
                  <QtyInput value={qty} max={limit(o)} disabled={o.disabled} label={o.label || 'Quantity'} onCommit={(n) => setQty(o, n)} />
                  <button type="button" onClick={() => setQty(o, qty + 1)} disabled={o.disabled || qty >= limit(o)} aria-label="More">+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <fieldset className="group">
      {group.label && <legend>{group.label}</legend>}
      <Img image={group.image} className="group-img" />
      <Prose text={group.description} className="prose small muted" />
      {body}
    </fieldset>
  );
}

export default function Quote({ section, data, layout, settings, goTo }) {
  const groups = data.groups || [];
  const { setQuote, selections, setSelections } = useQuote();
  const selection = useMemo(() => ({ ...initialSelection(groups), ...selections[section.id] }), [groups, selections, section.id]);
  const result = useMemo(() => calcQuote(data, selection), [data, selection]);
  const setSelection = (fn) => setSelections((all) => ({ ...all, [section.id]: fn(selection) }));

  useEffect(() => {
    setQuote({
      sectionId: section.id,
      total: result.total,
      totalText: formatPrice(result.total, settings),
      base: result.base,
      baseText: formatPrice(result.base, settings),
      lines: result.lines.map((l) => ({ ...l, amountText: formatPrice(l.amount, settings) })),
      deposit: result.deposit,
      depositText: result.deposit ? formatPrice(result.deposit, settings) : '',
      depositPercent: result.depositPercent,
      depositLabel: data.depositLabel || 'Deposit',
      depositNote: data.depositNote || '',
    });
  }, [result, section.id, settings, setQuote, data.depositLabel, data.depositNote]);

  return (
    <div className="container">
      <Heading text={data.title} />
      <Prose text={data.body} />
      <div className={`quote quote-${layout}`}>
        <div className="quote-groups">
          {groups.map((g) => (
            <Group key={g.id} group={g} settings={settings} value={selection[g.id]} onChange={(v) => setSelection((s) => ({ ...s, [g.id]: v }))} />
          ))}
        </div>
        <aside className="quote-summary card">
          <Heading as="h3" text={data.summaryTitle} />
          <ul>
            {result.base !== 0 && (
              <li><span>{data.baseLabel}</span><span>{formatPrice(result.base, settings)}</span></li>
            )}
            {result.lines.map((l, i) => (
              <li key={i}>
                <span>{[l.groupLabel, l.label].filter(Boolean).join(': ')}{l.qty > 1 ? ` x${l.qty}` : ''}</span>
                <span>{l.amount >= 0 ? '+' : ''}{formatPrice(l.amount, settings)}</span>
              </li>
            ))}
          </ul>
          <div className="quote-total">
            <span>{data.totalLabel}</span>
            <strong>{formatPrice(result.total, settings)}</strong>
          </div>
          {result.deposit > 0 && (
            <div className="quote-deposit">
              <span>{data.depositLabel || 'Deposit'}{result.depositPercent > 0 ? ` (${result.depositPercent}%)` : ''}</span>
              <strong>{formatPrice(result.deposit, settings)}</strong>
            </div>
          )}
          {result.deposit > 0 && <Prose text={data.depositNote} className="prose small muted quote-deposit-note" />}
          <Prose text={data.note} className="prose small muted" />
          {data.buttonText && !(settings.commissionsOpen === false && settings.closedLocksForm !== false) && (
            <button type="button" className="btn block" onClick={() => goTo(data.buttonTarget)}>{data.buttonText}</button>
          )}
        </aside>
      </div>
    </div>
  );
}
