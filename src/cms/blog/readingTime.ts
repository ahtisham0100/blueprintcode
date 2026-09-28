/* Reading time for a post, from its Lexical body. Pure; the Posts
   beforeChange hook stores the result so lists and cards never recompute it. */

export const WORDS_PER_MINUTE = 200;

type Node = { type?: string; text?: string; children?: unknown; fields?: Record<string, unknown> };

function isNode(v: unknown): v is Node {
  return typeof v === 'object' && v !== null;
}

function collect(node: unknown, out: string[]): void {
  if (!isNode(node)) return;
  if (node.type === 'text' && typeof node.text === 'string') {
    out.push(node.text);
    return;
  }
  if (node.type === 'block' && node.fields) {
    const f = node.fields;
    // Our blocks (cms/blog/blocks.ts): prose fields count, code and embeds do not.
    for (const key of ['label', 'heading', 'text']) if (typeof f[key] === 'string') out.push(f[key] as string);
    if (isNode(f.body)) collect((f.body as { root?: unknown }).root, out);
    return;
  }
  if (Array.isArray(node.children)) for (const c of node.children) collect(c, out);
}

/** All human-readable text in an editor state, block boundaries as spaces. */
export function lexicalPlainText(state: unknown): string {
  if (!isNode(state) || !isNode((state as { root?: unknown }).root)) return '';
  const parts: string[] = [];
  collect((state as { root: unknown }).root, parts);
  // Text nodes inside one paragraph run together ("Hello" + " world"); the
  // space join is only wrong where a node already ends in whitespace, and a
  // doubled space costs nothing to the word count.
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function readingTimeMinutes(state: unknown): number {
  return Math.max(1, Math.round(countWords(lexicalPlainText(state)) / WORDS_PER_MINUTE));
}
