/* Process Blueprinter page behaviour: the step lane, palette, presets, undo,
   drag to reorder, generate, downloads. Ported from the standalone page; every
   lookup is scoped to `root` and every listener is removed by the returned
   cleanup, so React can mount it (twice, in dev) without leaks.

   The markup it drives is rendered by ProcessBlueprinter.tsx. */

import * as B from './engine';
import type { Config, Flow, Transformed } from './engine';

const KEY = 'bpc-blueprinter:1';
const KIND_WORDS: Record<string, string> = {
  manual_data: 'a manual record',
  contact: 'a way customers get in touch',
  person: 'a person',
  system: 'a system',
  measure: 'measuring or visiting',
  samples: 'samples or a showroom',
  quote: 'quoting',
  payment: 'payment',
  order: 'ordering',
  stock: 'stock',
  supplier: 'a supplier',
  delivery: 'delivery',
  reporting: 'reporting',
  channel: 'where customers find you',
  customer: 'the customer',
  other: "something we'll look at in the full blueprint",
};

export type MountOptions = {
  cfg?: Config;
  /** Blueprint Builder's URL, or null when it isn't public: the last step then points to /contact. */
  builderUrl: string | null;
};

export function mountBlueprinter(root: HTMLElement, opts: MountOptions): () => void {
  const CFG = opts.cfg ?? B.DEFAULT_CONFIG;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K | string, fn: (e: HTMLElementEventMap[K]) => void) =>
    el.addEventListener(type, fn as EventListener, { signal: ac.signal });
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector(s) as T;
  const esc = B.esc;
  const isManual = (s: B.Step) => B.isManual(CFG, s);
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

  let flow: Flow;
  let result: Transformed | null = null;
  let dragId: string | null = null;
  let undoState: Flow | null = null;

  function announce(t: string) {
    const l = $('#pb-live');
    l.textContent = '';
    later(() => (l.textContent = t), 30);
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(flow));
    } catch {
      /* private mode: the page still works, it just won't remember */
    }
  }

  /* ---------- start state: ?preset=… (e.g. from the homepage), else saved, else the trade example ---------- */
  const qp = new URLSearchParams(location.search).get('preset') || (location.hash.match(/preset=([a-z]+)/) || [])[1] || '';
  let saved: Flow | null = null;
  if (!qp) {
    try {
      saved = B.readFlow(JSON.parse(localStorage.getItem(KEY) || 'null'));
    } catch {
      saved = null;
    }
  }
  flow = saved ?? B.fromPreset(CFG, CFG.presets.some((p) => p.id === qp) ? qp : 'trade');

  /* ---------- lane ---------- */
  function renderLane(focusSel?: string) {
    const s = flow.steps;
    $('#pb-lane').innerHTML = s
      .map((st, i) => {
        const next = s[i + 1],
          two = flow.loops.includes(st.uid),
          man = isManual(st);
        return (
          `<li class="step${man ? ' manual' : ''}" data-uid="${st.uid}" draggable="true">` +
          `<div class="chip"><span class="s-num" aria-hidden="true">${i + 1}</span><span class="s-label">${esc(st.label)}</span>` +
          `<button type="button" class="s-man${man ? ' on' : ''}" data-a="manual" data-uid="${st.uid}" aria-pressed="${man}" aria-label="${esc(st.label)} done by hand" title="Done by hand: ${man ? 'yes' : 'no'}. Press to change."></button>` +
          '<span class="s-ctrl">' +
          (i > 0 ? `<button type="button" data-a="left" data-uid="${st.uid}" aria-label="Move ${esc(st.label)} earlier">‹</button>` : '') +
          (i < s.length - 1 ? `<button type="button" data-a="right" data-uid="${st.uid}" aria-label="Move ${esc(st.label)} later">›</button>` : '') +
          `<button type="button" data-a="remove" data-uid="${st.uid}" aria-label="Remove ${esc(st.label)}">×</button></span></div>` +
          (next
            ? `<button type="button" class="lnk${two ? ' two' : ''}" data-a="loop" data-uid="${st.uid}" aria-pressed="${two}" aria-label="${esc(st.label)} to ${esc(next.label)}: ${two ? 'back and forth' : 'one way'}. Press to change.">${two ? '↔' : '→'}</button>`
            : '') +
          '</li>'
        );
      })
      .join('');
    $('#pb-lane-empty').hidden = s.length > 0;
    $('#pb-count').textContent = `${s.length} step${s.length === 1 ? '' : 's'}, ${s.filter(isManual).length} done by hand, ${flow.loops.length} back and forth`;
    if (focusSel) {
      const el = root.querySelector<HTMLElement>(focusSel);
      (el ?? $('#pb-generate')).focus();
    }
    save();
  }
  const stale = () => {
    if (result) $('#pb-stale').hidden = false;
  };

  /* ---------- palette and presets ---------- */
  $('#pb-blocks').innerHTML = CFG.blocks.map((b) => `<button type="button" class="blk" data-add="${b.id}">+ ${esc(b.label)}</button>`).join('');
  $('#pb-presets').innerHTML =
    CFG.presets.map((p) => `<button type="button" class="pre" data-preset="${p.id}" aria-pressed="false">${esc(p.label)}</button>`).join('') +
    '<button type="button" class="pre" data-preset="" aria-pressed="false">Blank</button>';

  const uidIndex = (id: string) => flow.steps.findIndex((x) => x.uid === id);
  on(root, 'click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a],[data-add],[data-preset],[data-go]');
    if (!b || !root.contains(b)) return;
    const id = b.getAttribute('data-uid') ?? '';
    if (b.hasAttribute('data-add')) {
      flow = B.add(flow, B.stepFromBlock(CFG, b.getAttribute('data-add')!));
      renderLane();
      stale();
      announce(`${flow.steps[flow.steps.length - 1].label} added as step ${flow.steps.length}.`);
      return;
    }
    if (b.hasAttribute('data-preset')) {
      // No confirm dialog: apply at once and offer Undo instead.
      const pid = b.getAttribute('data-preset')!;
      const before: Flow = JSON.parse(JSON.stringify(flow));
      const name = pid ? CFG.presets.find((x) => x.id === pid)?.label : 'A blank process';
      flow = pid ? B.fromPreset(CFG, pid) : { steps: [B.stepFromBlock(CFG, 'customer')], loops: [] };
      root.querySelectorAll('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderLane();
      stale();
      showUndo(`${name} loaded.`, before);
      return;
    }
    if (b.hasAttribute('data-go')) {
      const t = root.querySelector<HTMLElement>('#' + b.getAttribute('data-go'));
      if (t) {
        t.scrollIntoView({ block: 'start' });
        t.focus();
      }
      return;
    }
    const a = b.getAttribute('data-a');
    const label = flow.steps.find((x) => x.uid === id)?.label ?? '';
    if (a === 'left' || a === 'right') {
      flow = B.move(flow, id, a === 'left' ? -1 : 1);
      renderLane(`[data-a="${a}"][data-uid="${id}"]`);
      stale();
      announce(`${label} moved to step ${uidIndex(id) + 1}.`);
    } else if (a === 'remove') {
      const idx = uidIndex(id);
      const prev: Flow = JSON.parse(JSON.stringify(flow));
      flow = B.remove(flow, id);
      showUndo(`${label} removed.`, prev);
      const nx = flow.steps[Math.min(idx, flow.steps.length - 1)];
      renderLane(nx ? `[data-a="remove"][data-uid="${nx.uid}"]` : '#pb-own');
      stale();
    } else if (a === 'manual') {
      flow = B.toggleManual(CFG, flow, id);
      renderLane(`[data-a="manual"][data-uid="${id}"]`);
      stale();
      announce(label + (isManual(flow.steps[uidIndex(id)]) ? ' is done by hand.' : ' is not done by hand.'));
    } else if (a === 'loop') {
      flow = B.toggleLoop(flow, id);
      renderLane(`[data-a="loop"][data-uid="${id}"]`);
      stale();
      announce(flow.loops.includes(id) ? 'Marked as back and forth.' : 'Marked as one way.');
    }
  });

  /* ---------- undo ---------- */
  function showUndo(msg: string, before: Flow) {
    undoState = before;
    $('#pb-undo-msg').textContent = msg;
    $('#pb-undo-bar').hidden = !before.steps.length;
    announce(msg + (before.steps.length ? ' Undo is available.' : ''));
  }
  on($('#pb-undo'), 'click', () => {
    if (!undoState) return;
    flow = undoState;
    undoState = null;
    root.querySelectorAll('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    $('#pb-undo-bar').hidden = true;
    renderLane();
    stale();
    announce('Your previous steps are back.');
    root.querySelector<HTMLElement>('[data-preset]')?.focus();
  });

  /* ---------- add my own ---------- */
  function addOwn() {
    const inp = $<HTMLInputElement>('#pb-own');
    try {
      const st = B.customStep(CFG, inp.value);
      flow = B.add(flow, st);
      inp.value = '';
      renderLane('#pb-own');
      stale();
      $('#pb-own-msg').textContent = `Added "${st.label}", treated as ${KIND_WORDS[st.kind] || st.kind}.`;
    } catch (err) {
      $('#pb-own-msg').textContent = (err as Error).message;
      inp.focus();
    }
  }
  on($('#pb-own-add'), 'click', addOwn);
  on($('#pb-own'), 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      e.preventDefault();
      addOwn();
    }
  });

  /* ---------- drag to reorder ---------- */
  const lane = $('#pb-lane');
  on(lane, 'dragstart', (e) => {
    const ev = e as DragEvent;
    const li = (ev.target as HTMLElement).closest('.step');
    if (!li) return;
    dragId = li.getAttribute('data-uid');
    li.classList.add('dragging');
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', dragId ?? '');
    }
  });
  on(lane, 'dragend', () => {
    dragId = null;
    lane.querySelectorAll('.step').forEach((li) => li.classList.remove('dragging', 'drop-before', 'drop-after'));
  });
  function dropIndex(e: DragEvent) {
    const items = [...lane.querySelectorAll('.step')];
    for (let i = 0; i < items.length; i++) {
      const r = items[i].querySelector('.chip')!.getBoundingClientRect();
      if (e.clientY < r.top - 6) return i;
      if (e.clientY <= r.bottom + 6 && e.clientX < r.left + r.width / 2) return i;
    }
    return items.length;
  }
  on(lane, 'dragover', (e) => {
    if (!dragId) return;
    e.preventDefault();
    const idx = dropIndex(e as DragEvent),
      items = lane.querySelectorAll('.step');
    items.forEach((li, i) => {
      li.classList.toggle('drop-before', i === idx);
      li.classList.toggle('drop-after', idx === items.length && i === items.length - 1);
    });
  });
  on(lane, 'drop', (e) => {
    if (!dragId) return;
    e.preventDefault();
    const idx = dropIndex(e as DragEvent),
      from = uidIndex(dragId);
    flow = B.moveTo(flow, dragId, idx > from ? idx - 1 : idx);
    renderLane();
    stale();
    announce('Moved.');
  });

  /* ---------- generate ---------- */
  const diagramWidth = () => {
    const w = $('#pb-diagram').clientWidth || 1200;
    return w < 700 ? Math.max(340, w) : 1200;
  };
  function renderResult(animate: boolean) {
    if (!result) return;
    $('#pb-diagram').innerHTML = B.renderSVG(CFG, flow, result, { width: diagramWidth(), animate });
    let html = result.nodes
      .filter((n) => n.id !== 'customer')
      .map(
        (n) =>
          `<li><h3>${esc(n.label)}${n.area ? ` <span class="area">${esc(n.area)}</span>` : ''}</h3>` +
          (n.replacesText ? `<p class="inst">Instead of: ${esc(n.replacesText)}</p>` : '') +
          '<ul class="tags">' +
          n.tags
            .map((t) => {
              const c = (CFG.tags as Record<string, { colour: string }>)[t.tag]?.colour ?? 'currentColor';
              return `<li><span class="tg" style="color:${c};border-color:${c}">${esc(t.tag)}</span>${esc(t.text)}</li>`;
            })
            .join('') +
          '</ul></li>',
      )
      .join('');
    if (result.review.length)
      html += `<li><h3>To look at together</h3><p class="inst">${esc(result.review.map((s) => s.label).join(', '))} didn't fit a standard pattern. The full blueprint covers it.</p></li>`;
    $('#pb-changes').innerHTML = html;
    const link = $<HTMLAnchorElement>('#pb-cta-link');
    link.href = opts.builderUrl ? B.builderLink(opts.builderUrl, CFG, flow, result) : '/contact';
    $('#pb-cta-areas').textContent = result.areas.length ? `It would start with: ${result.areas.join(', ')}.` : '';
  }
  on($('#pb-generate'), 'click', () => {
    const r = B.transform(CFG, flow);
    if (!r.ok) {
      $('#pb-gen-msg').textContent = r.reason;
      announce(r.reason);
      return;
    }
    $('#pb-gen-msg').textContent = '';
    result = r;
    $('#pb-result').hidden = false;
    $('#pb-cta').hidden = false;
    $('#pb-stale').hidden = true;
    renderResult(true);
    const h = $('#pb-r-h');
    h.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    h.focus({ preventScroll: true });
    announce(`Blueprint ready: ${r.metrics.stepsBefore} steps become ${r.metrics.stepsAfter}, with ${r.metrics.manualBefore} manual hand-offs removed from the normal path.`);
  });
  on($('#pb-regen'), 'click', () => $('#pb-generate').click());
  let rz = 0,
    lastNarrow: boolean | null = null;
  on(window, 'resize', () => {
    clearTimeout(rz);
    rz = window.setTimeout(() => {
      if (!result) return;
      const n = diagramWidth() < 700;
      if (n !== lastNarrow) {
        lastNarrow = n;
        renderResult(false);
      }
    }, 200);
  });

  /* ---------- downloads ---------- */
  function dl(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    later(() => URL.revokeObjectURL(a.href), 2000);
  }
  on($('#pb-dl-svg'), 'click', () => {
    if (result) dl(new Blob([B.renderSVG(CFG, flow, result, { width: 1200, animate: false })], { type: 'image/svg+xml' }), 'my-process-blueprint.svg');
  });
  on($('#pb-dl-png'), 'click', () => {
    if (!result) return;
    const svg = B.renderSVG(CFG, flow, result, { width: 1200, animate: false });
    const m = svg.match(/height="(\d+(?:\.\d+)?)"/);
    const h = m ? +m[1] : 800;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 2400;
      c.height = Math.round(h * 2);
      const ctx = c.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, 1200, h);
      c.toBlob((b) => {
        if (b) {
          dl(b, 'my-process-blueprint.png');
          announce('Image downloaded.');
        }
      }, 'image/png');
    };
    img.onerror = () => announce("The image couldn't be created in this browser. Try Download SVG.");
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

  renderLane();

  return () => {
    ac.abort();
    clearTimeout(rz);
    timers.forEach(clearTimeout);
  };
}
