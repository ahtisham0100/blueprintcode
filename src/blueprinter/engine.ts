/* Process Blueprinter engine. Pure functions: no DOM, no storage.
   A visitor lays out their current process as a flow of steps; transform()
   maps it onto the Blueprint Code tools that would replace each step, and
   renderSVG() draws the old road and the proposed one.

   Flow = { steps: [{ uid, label, kind, block }], loops: [uid] }
   (a uid in loops = a two-way link between that step and the next). */

import CONFIG from './config.json';

export type Step = { uid: string; label: string; kind: string; block: string | null; manual?: boolean };
export type Flow = { steps: Step[]; loops: string[] };
export type Tag = { tag: string; text: string };
export type Node = { id: string; label: string; area: string | null; brief?: string; replaces: Step[]; tags: Tag[]; replacesText?: string };
export type Result =
  | { ok: false; reason: string }
  | {
      ok: true;
      nodes: Node[];
      review: Step[];
      areas: string[];
      metrics: { stepsBefore: number; stepsAfter: number; manualBefore: number; manualAfter: number; loopsBefore: number; systemsConnected: number; automated: number };
      tagCounts: Record<string, number>;
    };
export type Transformed = Extract<Result, { ok: true }>;
export type Config = typeof CONFIG;
export const DEFAULT_CONFIG: Config = CONFIG;

export const esc = (s: unknown) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
let seq = 0;
const uid = () => 's' + Date.now().toString(36).slice(-4) + (seq++).toString(36);

/* ---------- steps ---------- */
export function classify(cfg: Config, label: string): string {
  const t = ' ' + String(label || '').toLowerCase() + ' ';
  for (const r of cfg.custom_rules) if (new RegExp('(?:' + r.re + ')', 'i').test(t)) return r.kind;
  return 'other';
}
export function stepFromBlock(cfg: Config, blockId: string): Step {
  const b = cfg.blocks.find((x) => x.id === blockId);
  if (!b) throw new Error('Unknown block ' + blockId);
  return { uid: uid(), label: b.label, kind: b.kind, block: b.id };
}
export function customStep(cfg: Config, label: string): Step {
  const l = String(label || '').trim().slice(0, 40);
  if (!l) throw new Error('Name the step.');
  return { uid: uid(), label: l, kind: classify(cfg, l), block: null };
}
export function fromPreset(cfg: Config, presetId: string): Flow {
  const p = cfg.presets.find((x) => x.id === presetId);
  if (!p) return { steps: [], loops: [] };
  const steps = p.steps.map((b) => stepFromBlock(cfg, b));
  return { steps, loops: p.loops.map(([a]) => steps[a].uid) };
}
export function move(flow: Flow, id: string, dir: number): Flow {
  const i = flow.steps.findIndex((s) => s.uid === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= flow.steps.length) return flow;
  const steps = flow.steps.slice();
  [steps[i], steps[j]] = [steps[j], steps[i]];
  return tidy({ steps, loops: flow.loops });
}
export function moveTo(flow: Flow, id: string, index: number): Flow {
  const steps = flow.steps.slice();
  const i = steps.findIndex((s) => s.uid === id);
  if (i < 0) return flow;
  const [s] = steps.splice(i, 1);
  steps.splice(Math.max(0, Math.min(index, steps.length)), 0, s);
  return tidy({ steps, loops: flow.loops });
}
export function remove(flow: Flow, id: string): Flow {
  return tidy({ steps: flow.steps.filter((s) => s.uid !== id), loops: flow.loops.filter((x) => x !== id) });
}
export function add(flow: Flow, step: Step, index?: number): Flow {
  const steps = flow.steps.slice();
  steps.splice(index == null ? steps.length : index, 0, step);
  return tidy({ steps, loops: flow.loops });
}
/** Done by hand: the step's own setting if the visitor changed it, otherwise the default for its kind. */
export function isManual(cfg: Config, step: Step): boolean {
  return typeof step.manual === 'boolean' ? step.manual : cfg.manual_kinds.includes(step.kind);
}
export function toggleManual(cfg: Config, flow: Flow, id: string): Flow {
  return tidy({ steps: flow.steps.map((s) => (s.uid === id ? { ...s, manual: !isManual(cfg, s) } : s)), loops: flow.loops });
}
export function toggleLoop(flow: Flow, id: string): Flow {
  const has = flow.loops.includes(id);
  return tidy({ steps: flow.steps, loops: has ? flow.loops.filter((x) => x !== id) : flow.loops.concat(id) });
}
/** A loop belongs to the link after a step; the last step has no next link. */
export function tidy(flow: Flow): Flow {
  const valid = new Set(flow.steps.slice(0, -1).map((s) => s.uid));
  return { steps: flow.steps, loops: [...new Set(flow.loops)].filter((x) => valid.has(x)) };
}

/** A flow read back from storage, or null if it isn't one. */
export function readFlow(raw: unknown): Flow | null {
  const f = raw as Flow;
  if (!f || !Array.isArray(f.steps) || !Array.isArray(f.loops)) return null;
  const ok = f.steps.every((s) => s && typeof s.uid === 'string' && typeof s.label === 'string' && typeof s.kind === 'string');
  return ok ? tidy({ steps: f.steps.map((s) => ({ ...s, label: s.label.slice(0, 40) })), loops: f.loops.filter((x) => typeof x === 'string') }) : null;
}

/* ---------- analysis and transform ---------- */
export function analyse(cfg: Config, flow: Flow) {
  const s = flow.steps;
  const kinds = new Set(s.map((x) => x.kind));
  const manual = s.filter((x) => isManual(cfg, x));
  const loopPairs = flow.loops
    .map((id) => {
      const i = s.findIndex((x) => x.uid === id);
      return [s[i], s[i + 1]] as [Step, Step];
    })
    .filter((p) => p[0] && p[1]);
  const payIdx = s.findIndex((x) => x.kind === 'payment');
  const phonePayment = payIdx > 0 && s[payIdx - 1].kind === 'contact' ? s[payIdx - 1] : null;
  return { kinds, manual, loopPairs, phonePayment, steps: s.filter((x) => x.kind !== 'customer').length, systems: s.filter((x) => x.kind === 'system') };
}
function names(list: { label: string }[]): string {
  const l = [...new Set(list.map((x) => x.label))];
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0] || '';
}

export function transform(cfg: Config, flow: Flow): Result {
  if (!flow.steps.length) return { ok: false, reason: 'Add at least two steps to see a blueprint.' };
  if (flow.steps.filter((x) => x.kind !== 'customer').length < 2) return { ok: false, reason: 'Add at least two steps after the customer.' };
  const a = analyse(cfg, flow);
  const nodes: Node[] = [{ id: 'customer', label: 'Customer', area: null, replaces: [], tags: [] }];
  cfg.stages.forEach((st) => {
    if (!st.when.some((k) => a.kinds.has(k))) return;
    if (st.id === 'crm' && !['contact', 'person', 'manual_data', 'system'].some((k) => a.kinds.has(k))) return;
    nodes.push({ id: st.id, label: st.label, area: st.area, brief: st.brief, replaces: [], tags: st.tags.map(([tag, text]) => ({ tag, text })) });
  });
  // Assign every old step to the first proposed stage that absorbs its kind.
  const review: Step[] = [];
  flow.steps.forEach((step) => {
    if (step.kind === 'customer') return;
    const n = nodes.find((x) => {
      const st = cfg.stages.find((y) => y.id === x.id);
      return st && st.replaces.includes(step.kind);
    });
    if (n) n.replaces.push(step);
    else if (step.kind === 'other') {
      const crm = nodes.find((x) => x.id === 'crm');
      if (crm) crm.replaces.push(step);
      else review.push(step);
    } else {
      const fb = nodes.find((x) => x.id === 'fulfil') || nodes.find((x) => x.id === 'crm');
      if (fb) fb.replaces.push(step);
      else review.push(step);
    }
  });
  // Personalise the callouts with the visitor's own steps.
  const crm = nodes.find((x) => x.id === 'crm');
  if (crm) {
    const dup = crm.tags.find((t) => t.tag === 'REMOVE DUPLICATION');
    const manualData = flow.steps.filter((x) => x.kind === 'manual_data');
    if (!manualData.length && !a.loopPairs.length && dup) crm.tags = crm.tags.filter((t) => t !== dup);
    else if (dup) {
      const parts: string[] = [];
      if (manualData.length) parts.push(`${names(manualData)} ${manualData.length > 1 ? 'are' : 'is'} replaced by one shared record`);
      a.loopPairs.forEach(([x, y]) => parts.push(`the ${x.label} ↔ ${y.label} back-and-forth disappears`));
      dup.text = parts.join('; ') + '. Nobody retypes anything.';
      dup.text = dup.text.charAt(0).toUpperCase() + dup.text.slice(1);
    }
  }
  const sel = nodes.find((x) => x.id === 'select');
  if (sel) {
    const manualFront = sel.replaces.filter((x) => x.kind === 'contact' || x.kind === 'person');
    if (manualFront.length) sel.tags[0].text = `Replaces ${names(manualFront)} in the normal path. Customers answer a few questions; your team steps in for exceptions.`;
    else sel.tags[0].text = 'Customers find the right product themselves, with questions that narrow down the options.';
  }
  const q = nodes.find((x) => x.id === 'quote');
  if (q && a.phonePayment) q.tags.push({ tag: 'CUSTOMER SELF-SERVICE', text: `Customers pay online instead of by ${a.phonePayment.label.toLowerCase()}.` });
  nodes.forEach((n) => {
    if (n.id !== 'customer' && n.replaces.length) n.replacesText = names(n.replaces);
  });

  const connectCount = nodes.filter((n) => n.tags.some((t) => t.tag === 'CONNECT')).length;
  const areas = [...new Set(nodes.map((n) => n.area).filter((x): x is string => !!x))];
  return {
    ok: true,
    nodes,
    review,
    areas,
    metrics: {
      stepsBefore: a.steps,
      stepsAfter: nodes.length - 1,
      manualBefore: a.manual.length,
      manualAfter: 0,
      loopsBefore: a.loopPairs.length,
      systemsConnected: connectCount,
      automated: nodes.filter((n) => n.tags.some((t) => t.tag === 'AUTOMATE')).length,
    },
    tagCounts: nodes.flatMap((n) => n.tags.map((t) => t.tag)).reduce<Record<string, number>>((m, t) => ((m[t] = (m[t] || 0) + 1), m), {}),
  };
}

/* ---------- handoff to Blueprint Builder ---------- */
export function flowText(flow: Flow): string {
  return flow.steps.map((s, i) => s.label + (i < flow.steps.length - 1 ? (flow.loops.includes(s.uid) ? ' ↔ ' : ' → ') : '')).join('');
}
/** The visitor's process in words, ready to use as the builder's problem description. */
export function builderBrief(cfg: Config, flow: Flow, result: Transformed): string {
  const parts = [`Today our process is: ${flowText(flow)}.`];
  const a = analyse(cfg, flow);
  if (a.loopPairs.length) parts.push(a.loopPairs.map(([x, y]) => `${x.label} and ${y.label} go back and forth`).join('; ') + '.');
  if (a.manual.length) parts.push(`${a.manual.length} steps are done by hand: ${names(a.manual)}.`);
  const wants = result.nodes.filter((n) => n.brief).map((n) => n.brief!);
  if (wants.length) parts.push(`We'd like ${wants.length > 1 ? wants.slice(0, -1).join(', ') + ' and ' + wants[wants.length - 1] : wants[0]}.`);
  if (result.review.length) parts.push(`We also need to look at: ${names(result.review)}.`);
  return parts.join(' ');
}
/** Opens Blueprint Builder with the brief as its description (builder ui/app.js, #/start). */
export function builderLink(builderUrl: string, cfg: Config, flow: Flow, result: Transformed): string {
  return builderUrl + '#/start?desc=' + encodeURIComponent(builderBrief(cfg, flow, result));
}

/* ---------- SVG ---------- */
const FONT = 'IBM Plex Sans, Segoe UI, Arial, sans-serif';
const MONO = 'DM Mono, Menlo, Consolas, monospace';
const DISPLAY = 'Bebas Neue, Impact, Arial Narrow, sans-serif';
// Generous width estimates so text never overflows, even in fallback fonts.
function textW(s: string, px: number, face?: 'mono' | 'display') {
  const k = face === 'mono' ? 0.68 : face === 'display' ? 0.6 : 0.58;
  return String(s).length * px * k;
}
function jitter(seed: string, range: number) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 1000) / 1000) * 2 * range - range;
}

type Box = { x: number; y: number; w: number; h: number; label: string; rowBottom?: number };
/** Lay boxes out left to right, wrapping into rows. Returns positions and the height used. */
function layoutRows<T extends { w: number; h: number }>(items: T[], W: number, startY: number, rowGap: number, margin: number) {
  let x = margin,
    y = startY,
    rowH = 0;
  const out: (T & { x: number; y: number })[] = [];
  items.forEach((it) => {
    if (x > margin && x + it.w > W - margin) {
      x = margin;
      y += rowH + rowGap;
      rowH = 0;
    }
    out.push({ ...it, x, y });
    x += it.w + 54;
    rowH = Math.max(rowH, it.h);
  });
  return { items: out, bottom: y + rowH };
}
function connector(a: Box, b: Box, cls: string, marker: string, wobble: boolean, twoWay: boolean): string {
  let d: string;
  if (Math.abs(a.y - b.y) < 2) {
    const x1 = a.x + a.w,
      y1 = a.y + a.h / 2,
      x2 = b.x,
      y2 = b.y + b.h / 2;
    const mx = (x1 + x2) / 2,
      my = y1 + (wobble ? jitter(a.label + b.label, 7) : 0);
    d = wobble ? `M${x1 + 3} ${y1} Q${mx} ${my} ${x2 - 5} ${y2}` : `M${x1} ${y1} L${x2 - 4} ${y2}`;
  } else if (wobble) {
    const x1 = a.x + a.w / 2,
      y1 = a.y + a.h,
      x2 = b.x + b.w / 2,
      y2 = b.y,
      midY = (y1 + y2) / 2;
    d = `M${x1} ${y1 + 2} C${x1 + 20} ${midY + 10} ${x2 - 20} ${midY - 10} ${x2} ${y2 - 5}`;
  } else {
    // Clean row wrap: out of the right side, down below everything in the row (tags included), back to the next row.
    const x1 = a.x + a.w,
      y1 = a.y + a.h / 2,
      x2 = b.x + b.w / 2,
      y2 = b.y,
      turn = a.rowBottom! + (b.y - a.rowBottom!) / 2;
    d = `M${x1} ${y1} H${x1 + 16} V${turn} H${x2} V${y2 - 4}`;
  }
  return `<path class="${cls}" d="${d}"${/\bdraw\b/.test(cls) ? ' pathLength="1"' : ''} marker-end="url(#${marker})"${twoWay ? ` marker-start="url(#${marker}-s)"` : ''}/>`;
}

export function renderSVG(cfg: Config, flow: Flow, result: Transformed, opts: { width?: number; animate?: boolean } = {}): string {
  const T = cfg.theme;
  const W = opts.width || 1200;
  const narrow = W < 700;
  const M = narrow ? 18 : 40;
  const anim = opts.animate !== false;
  let y = 30;
  const parts: string[] = [];
  const label = (text: string, yy: number) => `<text x="${M}" y="${yy}" class="bp-label">${esc(text)}</text>`;

  // Old way
  parts.push(label('OLD WAY', y + 12));
  y += 34;
  const oldItems = flow.steps.map((s) => ({ s, label: s.label, w: Math.max(96, textW(s.label, 14) + 34), h: 44 }));
  const oldL = layoutRows(oldItems, W, y, narrow ? 34 : 44, M);
  oldL.items.forEach((it, i) => {
    const nx = oldL.items[i + 1];
    if (nx) parts.push(connector(it, nx, 'o-line', 'ao', true, flow.loops.includes(it.s.uid)));
  });
  oldL.items.forEach((it) => {
    const rot = jitter(it.s.uid + it.label, 2.4).toFixed(2);
    const manual = isManual(cfg, it.s);
    parts.push(
      `<g class="o-node" transform="rotate(${rot} ${it.x + it.w / 2} ${it.y + it.h / 2})"><rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="3"/>` +
        `<text x="${it.x + it.w / 2}" y="${it.y + 27}" text-anchor="middle">${esc(it.label)}</text>` +
        (manual ? `<circle class="o-manual" cx="${it.x + it.w - 7}" cy="${it.y + 7}" r="4"><title>Done by hand</title></circle>` : '') +
        '</g>',
    );
  });
  y = oldL.bottom + 30;

  // Transformation band
  const bandY = y;
  parts.push(`<line class="band" x1="${M}" y1="${bandY + 20}" x2="${W - M}" y2="${bandY + 20}"/>`);
  const pillW = textW('BLUEPRINT CODE', 21, 'display') + 21 * 0.08 * 14 + 48;
  parts.push(
    `<g class="band-pill${anim ? ' anim' : ''}" style="--d:.2s"><rect x="${W / 2 - pillW / 2}" y="${bandY + 2}" width="${pillW}" height="36" rx="18"/><text x="${W / 2}" y="${bandY + 27}" text-anchor="middle">BLUEPRINT CODE</text></g>`,
  );
  parts.push(`<path class="band-arrow${anim ? ' anim' : ''}" style="--d:.35s" d="M${W / 2} ${bandY + 40} L${W / 2} ${bandY + 64}" marker-end="url(#ap)"/>`);
  y = bandY + 86;

  // Proposed flow
  parts.push(label('PROPOSED FLOW', y + 12));
  y += 34;
  const newItems = result.nodes.map((n) => {
    const tagH = n.tags.length * 24;
    const w = Math.max(
      132,
      textW(n.label, 15) + 36,
      n.area ? textW(n.area.toUpperCase(), 10, 'mono') + 10 * 0.06 * n.area.length + 30 : 0,
      ...n.tags.map((t) => textW(t.tag, 10.5, 'mono') + 10.5 * 0.05 * t.tag.length + 24),
    );
    return { n, label: n.label, w, h: 58 + (tagH ? tagH + 10 : 0) };
  });
  const newL = layoutRows(newItems, W, y, narrow ? 30 : 40, M);
  const rowBottom: Record<number, number> = {};
  newL.items.forEach((it) => {
    rowBottom[it.y] = Math.max(rowBottom[it.y] || 0, it.y + it.h);
  });
  newL.items.forEach((it, i) => {
    const nx = newL.items[i + 1];
    if (nx) {
      const a = { ...it, h: 58, rowBottom: rowBottom[it.y] },
        b = { ...nx, h: 58 };
      parts.push(connector(a, b, 'p-line' + (anim ? ' draw' : ''), 'ap', false, false).replace('<path ', `<path style="--d:${(0.55 + i * 0.12).toFixed(2)}s" `));
    }
  });
  newL.items.forEach((it, i) => {
    const d = (0.45 + i * 0.12).toFixed(2);
    let g =
      `<g class="p-node${anim ? ' anim' : ''}" style="--d:${d}s"><rect x="${it.x}" y="${it.y}" width="${it.w}" height="58" rx="4"/>` +
      `<text class="p-t" x="${it.x + 14}" y="${it.y + (it.n.area ? 25 : 35)}">${esc(it.label)}</text>` +
      (it.n.area ? `<text class="p-a" x="${it.x + 14}" y="${it.y + 44}">${esc(it.n.area.toUpperCase())}</text>` : '');
    it.n.tags.forEach((t, k) => {
      const col = (cfg.tags as Record<string, { colour: string }>)[t.tag]?.colour || T.ink;
      const tw = textW(t.tag, 10.5, 'mono') + 10.5 * 0.05 * t.tag.length + 20;
      const ty = it.y + 68 + k * 24;
      g += `<g class="tag"><rect x="${it.x}" y="${ty}" width="${tw}" height="19" rx="9.5" style="stroke:${col}"/><text x="${it.x + 10}" y="${ty + 13}" style="fill:${col}">${esc(t.tag)}</text></g>`;
    });
    parts.push(g + '</g>');
  });
  y = newL.bottom + 34;

  // Metrics
  const m = result.metrics;
  const stats = [
    [`${m.stepsBefore} → ${m.stepsAfter}`, 'steps after the customer'],
    [`${m.manualBefore} → ${m.manualAfter}`, 'manual hand-offs in the normal path'],
    [String(m.loopsBefore), m.loopsBefore === 1 ? 'back-and-forth removed' : 'back-and-forths removed'],
    [String(m.automated), m.automated === 1 ? 'step automated' : 'steps automated'],
  ];
  const sw = narrow ? (W - 2 * M - 10) / 2 : (W - 2 * M - 3 * 14) / 4;
  stats.forEach((st, i) => {
    const col = narrow ? i % 2 : i,
      row = narrow ? Math.floor(i / 2) : 0;
    const sx = M + col * (sw + (narrow ? 10 : 14)),
      sy = y + row * 74;
    parts.push(
      `<g class="stat${anim ? ' anim' : ''}" style="--d:${(1.1 + i * 0.1).toFixed(2)}s"><rect x="${sx}" y="${sy}" width="${sw}" height="62"/><text class="s-v" x="${sx + 14}" y="${sy + 32}">${esc(st[0])}</text><text class="s-k" x="${sx + 14}" y="${sy + 50}">${esc(st[1])}</text></g>`,
    );
  });
  y += narrow ? 150 : 80;
  parts.push(`<text class="foot" x="${M}" y="${y}">${esc(cfg.copy.studio)}, ${esc(cfg.copy.site)}</text>`);
  const H = y + 22;

  const css = `
    .bp-bg{fill:${T.ground}} .grid{stroke:${T.lineSoft};stroke-width:1}
    .bp-label{font:500 12px ${MONO};fill:${T.ink2};letter-spacing:.12em}
    .o-node rect{fill:${T.ground2};stroke:${T.old};stroke-width:1.4;stroke-dasharray:5 3}
    .o-node text{font:400 14px ${FONT};fill:${T.old}}
    .o-manual{fill:#FFD28A}
    .o-line{fill:none;stroke:${T.old};stroke-width:1.4;stroke-dasharray:4 4}
    .band{stroke:${T.line};stroke-width:1;stroke-dasharray:2 6}
    .band-pill rect{fill:${T.ink}} .band-pill text{font:400 21px ${DISPLAY};letter-spacing:.08em;fill:${T.ground}}
    .band-arrow{stroke:${T.ink};stroke-width:2}
    .p-node rect{fill:${T.ground2};stroke:${T.ink2};stroke-width:1.6}
    .p-t{font:600 15px ${FONT};fill:${T.ink}} .p-a{font:500 10px ${MONO};fill:${T.ink2};letter-spacing:.06em}
    .tag rect{fill:${T.ground};stroke-width:1.2} .tag text{font:500 10.5px ${MONO};letter-spacing:.05em}
    .p-line{fill:none;stroke:${T.ink};stroke-width:2}
    .stat rect{fill:${T.ground2};stroke:${T.line}} .s-v{font:400 26px ${DISPLAY};fill:${T.ink};letter-spacing:.03em} .s-k{font:400 12px ${FONT};fill:${T.ink2}}
    .foot{font:400 11px ${MONO};fill:${T.ink2}}
    .ao{fill:${T.old}} .apf{fill:${T.ink}}
    @media (prefers-reduced-motion:no-preference){
      .anim{opacity:0;animation:bpIn .5s ease-out forwards;animation-delay:var(--d)}
      .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:bpDraw .6s ease-out forwards;animation-delay:var(--d)}
    }
    @keyframes bpIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes bpDraw{to{stroke-dashoffset:0}}`;
  const defs = `<defs><style>${css}</style>
    <pattern id="gridp" width="24" height="24" patternUnits="userSpaceOnUse"><path class="grid" d="M24 0H0V24" fill="none"/></pattern>
    <marker id="ao" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="ao" d="M0 0L10 5L0 10z"/></marker>
    <marker id="ao-s" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="ao" d="M10 0L0 5L10 10z"/></marker>
    <marker id="ap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="apf" d="M0 0L10 5L0 10z"/></marker></defs>`;
  const desc = `Old way: ${flowText(flow)}. Proposed flow: ${result.nodes.map((n) => n.label).join(' → ')}.`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="bp-t bp-d"><title id="bp-t">Process blueprint</title><desc id="bp-d">${esc(desc)}</desc>${defs}` +
    `<rect class="bp-bg" width="${W}" height="${H}"/><rect width="${W}" height="${H}" fill="url(#gridp)"/>${parts.join('')}</svg>`
  );
}
