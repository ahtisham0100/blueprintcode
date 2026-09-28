/* A small HTML → Lexical converter for the markup the legacy /insights
   notes render to (renderToStaticMarkup of notes.tsx): paragraphs, h2–h4,
   strong/em/code, links, lists, blockquotes, tables, the .note aside and the
   .panel-foot button row. Pure and dependency-free (Payload's own converter
   needs jsdom and cannot produce our blocks). Not a general HTML parser: it
   expects well-formed markup such as React's static output. */

import { slugify } from './slug';

/* ---- parse ----------------------------------------------------------------- */

export type HElement = { tag: string; attrs: Record<string, string>; children: HNode[] };
export type HNode = HElement | { text: string };

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr']);

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of src.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

export function parseHtml(html: string): HNode[] {
  const root: HNode = { tag: '#root', attrs: {}, children: [] };
  const stack: HElement[] = [root as HElement];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)((?:\s+[^>]*?)?)\s*(\/?)>|([^<]+)/g;
  for (const m of html.matchAll(re)) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      // Pop to the matching open tag (tolerates stray closers).
      const i = stack.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
    } else if (m[2]) {
      const node = { tag: m[2].toLowerCase(), attrs: parseAttrs(m[3] ?? ''), children: [] as HNode[] };
      top.children.push(node);
      if (!m[4] && !VOID.has(node.tag)) stack.push(node);
    } else if (m[5]) {
      top.children.push({ text: decodeEntities(m[5]) });
    }
  }
  return (root as HElement).children;
}

/* ---- Lexical node builders --------------------------------------------------- */

type LNode = Record<string, unknown>;
const FORMAT = { strong: 1, b: 1, em: 2, i: 2, s: 4, u: 8, code: 16 } as const;

const base = { version: 1, format: '', indent: 0, direction: 'ltr' as const };
const textNode = (text: string, format: number): LNode => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 });
const paragraph = (children: LNode[]): LNode => ({ ...base, type: 'paragraph', textFormat: 0, textStyle: '', children });
export const editorState = (children: LNode[]) => ({ root: { ...base, type: 'root', children } });

function classes(n: HNode): string[] {
  return 'tag' in n ? (n.attrs.class ?? '').split(/\s+/).filter(Boolean) : [];
}

function textOf(n: HNode): string {
  return 'text' in n ? n.text : n.children.map(textOf).join('');
}

/** Inline content → text/link/linebreak nodes, merging adjacent same-format text. */
function inline(nodes: HNode[], format = 0): LNode[] {
  const out: LNode[] = [];
  const push = (n: LNode) => {
    const last = out[out.length - 1];
    if (n.type === 'text' && last?.type === 'text' && last.format === n.format) last.text = String(last.text) + String(n.text);
    else out.push(n);
  };
  for (const n of nodes) {
    if ('text' in n) {
      const t = n.text.replace(/\s+/g, ' ');
      if (t) push(textNode(t, format));
      continue;
    }
    if (n.tag === 'br') {
      out.push({ type: 'linebreak', version: 1 });
      continue;
    }
    if (n.tag === 'a') {
      const newTab = n.attrs.target === '_blank';
      out.push({ ...base, type: 'link', version: 3, fields: { linkType: 'custom', url: n.attrs.href ?? '', newTab }, children: inline(n.children, format) });
      continue;
    }
    const f = FORMAT[n.tag as keyof typeof FORMAT] ?? 0;
    for (const c of inline(n.children, format | f)) push(c);
  }
  return out;
}

/** Trim leading/trailing whitespace of an inline run. */
function trimRun(nodes: LNode[]): LNode[] {
  const out = nodes.map((n) => ({ ...n }));
  // Only the run's own edges: a space between two links must survive.
  const first = out[0];
  const last = out[out.length - 1];
  if (first?.type === 'text') first.text = String(first.text).replace(/^\s+/, '');
  if (last?.type === 'text') last.text = String(last.text).replace(/\s+$/, '');
  return out.filter((n) => n.type !== 'text' || n.text !== '');
}

function tableNode(table: HElement): LNode {
  const rows: LNode[] = [];
  const walk = (n: HNode) => {
    if (!('tag' in n)) return;
    if (n.tag === 'tr') {
      const cells = n.children.filter((c): c is HElement => 'tag' in c && (c.tag === 'td' || c.tag === 'th'));
      rows.push({
        type: 'tablerow',
        version: 1,
        format: '',
        indent: 0,
        direction: null,
        children: cells.map((c) => ({
          type: 'tablecell',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          headerState: c.tag === 'th' ? 1 : 0,
          colSpan: Number(c.attrs.colspan) || 1,
          rowSpan: Number(c.attrs.rowspan) || 1,
          backgroundColor: null,
          children: [paragraph(trimRun(inline(c.children)))],
        })),
      });
      return;
    }
    n.children.forEach(walk);
  };
  walk(table);
  return { type: 'table', version: 1, format: '', indent: 0, direction: null, children: rows };
}

let blockSeq = 0;
function blockId(): string {
  blockSeq += 1;
  return `imp${Date.now().toString(36)}${blockSeq.toString(36)}`.slice(-24);
}

function calloutBlock(div: HElement): LNode {
  const labelEl = div.children.find((c) => classes(c).includes('data'));
  const rest = div.children.filter((c) => c !== labelEl);
  return {
    type: 'block',
    version: 2,
    format: '',
    fields: { id: blockId(), blockName: '', blockType: 'callout', label: labelEl ? textOf(labelEl).trim() : null, body: editorState([paragraph(trimRun(inline(rest)))]) },
  };
}

function ctaBlock(div: HElement): LNode | null {
  const links = div.children.filter((c): c is HElement => 'tag' in c && c.tag === 'a');
  if (!links.length) return null;
  return {
    type: 'block',
    version: 2,
    format: '',
    fields: {
      id: blockId(),
      blockName: '',
      blockType: 'cta',
      heading: null,
      text: null,
      buttons: links.slice(0, 3).map((a) => ({ label: textOf(a).trim(), href: a.attrs.href ?? '/', style: classes(a).includes('solid') ? 'solid' : 'outline' })),
    },
  };
}

/** Block-level HTML → Lexical root children. */
export function blocksFromHtml(nodes: HNode[]): LNode[] {
  const out: LNode[] = [];
  let pending: HNode[] = []; // stray inline content between blocks
  const flush = () => {
    const run = trimRun(inline(pending));
    if (run.length) out.push(paragraph(run));
    pending = [];
  };
  for (const n of nodes) {
    if ('text' in n || !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'div', 'table', 'hr', 'section', 'figure'].includes(n.tag)) {
      pending.push(n);
      continue;
    }
    flush();
    const cls = classes(n);
    if (n.tag === 'p') out.push(paragraph(trimRun(inline(n.children))));
    else if (/^h[1-6]$/.test(n.tag)) {
      if (n.tag === 'h1') continue; // the post title is its own field
      const tag = n.tag === 'h5' || n.tag === 'h6' ? 'h4' : n.tag;
      out.push({ ...base, type: 'heading', tag, children: trimRun(inline(n.children)) });
    } else if (n.tag === 'ul' || n.tag === 'ol') {
      const items = n.children.filter((c): c is HElement => 'tag' in c && c.tag === 'li');
      out.push({
        ...base,
        type: 'list',
        listType: n.tag === 'ol' ? 'number' : 'bullet',
        tag: n.tag,
        start: 1,
        children: items.map((li, i) => ({ ...base, type: 'listitem', value: i + 1, children: trimRun(inline(li.children)) })),
      });
    } else if (n.tag === 'blockquote') out.push({ ...base, type: 'quote', children: trimRun(inline(n.children)) });
    else if (n.tag === 'table') out.push(tableNode(n));
    else if (n.tag === 'hr') out.push({ type: 'horizontalrule', version: 1 });
    else if (cls.includes('panel-head')) continue; // label + h1: the post's own fields
    else if (cls.includes('note')) out.push(calloutBlock(n));
    else if (cls.includes('panel-foot')) {
      const cta = ctaBlock(n);
      if (cta) out.push(cta);
    } else out.push(...blocksFromHtml(n.children)); // .table-wrap and other wrappers
  }
  flush();
  return out;
}

export function htmlToLexical(html: string) {
  return editorState(blocksFromHtml(parseHtml(html)));
}

/** Heading ids the page will generate, for checking anchors survive the import. */
export function headingSlugs(state: ReturnType<typeof htmlToLexical>): string[] {
  return (state.root.children as LNode[]).filter((n) => n.type === 'heading').map((n) => slugify((n.children as LNode[]).map((c) => String(c.text ?? '')).join('')));
}
