/* Pasted demo HTML: what we accept, and what we can read out of it (used by
   the editor for defaults and by the import script for the existing static
   demos). Pure string work, no DOM. */

export const MAX_DEMO_HTML_BYTES = 5 * 1024 * 1024;

/** null when acceptable, otherwise a message for the editor. A demo must be
 *  a complete document: fragments cannot carry the site chrome or SEO tags. */
export function validateDemoHtml(html: unknown): string | null {
  if (typeof html !== 'string' || !html.trim()) return 'Paste the demo’s full HTML.';
  if (Buffer.byteLength(html, 'utf8') > MAX_DEMO_HTML_BYTES) return 'HTML is over 5 MB. Move large assets to the Media library and reference them by URL.';
  if (!/<html[\s>]/i.test(html)) return 'This is not a full HTML document (no <html> tag).';
  if (!/<head[\s>]/i.test(html)) return 'This is not a full HTML document (no <head> tag).';
  if (!/<body[\s>]/i.test(html)) return 'This is not a full HTML document (no <body> tag).';
  if (!/<\/body>/i.test(html)) return 'The document has no closing </body> tag.';
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function clean(s: string): string {
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

export function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? clean(m[1]) || null : null;
}

/** A <meta name="…" content="…"> value, attribute order agnostic. */
export function extractMeta(html: string, name: string, attr: 'name' | 'property' = 'name'): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const n = new RegExp(`\\b${attr}\\s*=\\s*["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
    if (!n.test(tag)) continue;
    const c = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (c) return clean(c[1] ?? c[2] ?? '') || null;
  }
  return null;
}

export function extractDescription(html: string): string | null {
  return extractMeta(html, 'description');
}

export function extractCanonical(html: string): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!/\brel\s*=\s*["']canonical["']/i.test(tag)) continue;
    const h = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (h) return (h[1] ?? h[2] ?? '').trim() || null;
  }
  return null;
}

/** True when the document declares itself noindex. */
export function extractNoindex(html: string): boolean {
  const robots = extractMeta(html, 'robots');
  return Boolean(robots && /noindex/i.test(robots));
}
