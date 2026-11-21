// Quote math. selection shape: { [groupId]: optionId | optionId[] | { [optionId]: qty } }
export function initialSelection(groups = []) {
  const sel = {};
  for (const g of groups) {
    if (g.kind === 'single' && g.required) {
      const first = g.options.find((o) => !o.disabled);
      if (first) sel[g.id] = first.id;
    }
  }
  return sel;
}

export function calcQuote(data, selection) {
  const base = Number(data.basePrice) || 0;
  const picked = [];
  for (const g of data.groups || []) {
    const s = selection[g.id];
    if (s == null) continue;
    for (const o of g.options || []) {
      let qty = 0;
      if (g.kind === 'single') qty = s === o.id ? 1 : 0;
      else if (g.kind === 'multi') qty = Array.isArray(s) && s.includes(o.id) ? 1 : 0;
      else if (g.kind === 'quantity') qty = Math.min(Number(s[o.id]) || 0, Number(o.max) > 0 ? Number(o.max) : 99);
      if (qty > 0 && !o.disabled) picked.push({ group: g, option: o, qty });
    }
  }
  const flat = picked.filter((p) => p.option.mode !== 'percent')
    .reduce((sum, p) => sum + (Number(p.option.price) || 0) * p.qty, 0);
  const subtotal = base + flat;
  const lines = picked.map((p) => {
    const price = Number(p.option.price) || 0;
    const amount = p.option.mode === 'percent' ? (subtotal * price * p.qty) / 100 : price * p.qty;
    return { groupLabel: p.group.label, label: p.option.label, qty: p.qty, mode: p.option.mode, price, amount };
  });
  const raw = base + lines.reduce((sum, l) => sum + l.amount, 0);
  const total = Math.max(raw, Number(data.minPrice) || 0, 0);
  // Deposit: a percent of the total, but not less than the minimum, and not more than the total.
  const pct = Number(data.depositPercent) || 0;
  const min = Number(data.depositMin) || 0;
  const deposit = pct > 0 || min > 0 ? Math.min(total, Math.max((total * pct) / 100, min)) : 0;
  return { base, lines, total, deposit, depositPercent: pct };
}
