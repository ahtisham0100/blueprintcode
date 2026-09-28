import { describe, expect, it } from 'vitest';
import { escapeHtml, postBodyToHtml } from './renderHtml';

const text = (t: string, format = 0) => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 });
const el = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({ type, version: 1, format: '', indent: 0, direction: 'ltr', children, ...extra });
const p = (...children: unknown[]) => el('paragraph', children, { textFormat: 0, textStyle: '' });
const root = (...children: unknown[]) => ({ root: el('root', children) }) as never;
const block = (fields: Record<string, unknown>) => ({ type: 'block', version: 2, format: '', fields: { id: 'x', blockName: '', ...fields } });

describe('postBodyToHtml', () => {
  it('renders text, headings with ids, lists, quotes and links', () => {
    const out = postBodyToHtml(
      root(
        el('heading', [text('Why start?')], { tag: 'h2' }),
        p(text('Bold', 1), text(' & '), text('<code>', 16)),
        el('list', [el('listitem', [text('one')], { value: 1 })], { listType: 'bullet', tag: 'ul' }),
        el('quote', [text('Quoted')]),
        p(el('link', [text('post')], { fields: { linkType: 'internal', newTab: false, doc: { relationTo: 'posts', value: { id: 1, slug: 'a' } } } })),
      ),
    );
    expect(out).toContain('<h2 id="why-start">Why start?</h2>');
    expect(out).toContain('<p><strong>Bold</strong> &amp; <code>&lt;code&gt;</code></p>');
    expect(out).toContain('<ul><li>one</li></ul>');
    expect(out).toContain('<blockquote>Quoted</blockquote>');
    expect(out).toContain('<a href="/blog/a">post</a>');
    expect(out).not.toContain('style=');
  });

  it('renders tables, image figures and file links', () => {
    const cell = (t: string, headerState = 0) => el('tablecell', [p(text(t))], { headerState, colSpan: 1, rowSpan: 1 });
    const out = postBodyToHtml(
      root(
        el('table', [el('tablerow', [cell('A', 1)]), el('tablerow', [cell('1')])]),
        { type: 'upload', version: 3, relationTo: 'media', value: { url: 'https://m/x.jpg', alt: 'X "q"', mimeType: 'image/jpeg', width: 800, height: 600 }, fields: { caption: 'Cap' } },
        { type: 'upload', version: 3, relationTo: 'media', value: { url: 'https://m/s.pdf', mimeType: 'application/pdf', filename: 's.pdf' }, fields: null },
      ),
    );
    expect(out).toContain('<table><tbody><tr><th><p>A</p></th></tr><tr><td><p>1</p></td></tr></tbody></table>');
    expect(out).toContain('<figure><img src="https://m/x.jpg" alt="X &quot;q&quot;" width="800" height="600" /><figcaption>Cap</figcaption></figure>');
    expect(out).toContain('<p><a href="https://m/s.pdf">s.pdf</a></p>');
  });

  it('renders each custom block for feed readers', () => {
    const out = postBodyToHtml(
      root(
        block({ blockType: 'callout', label: 'Note', body: root(p(text('Inside'))) }),
        block({ blockType: 'cta', heading: 'Start', text: 'Go', buttons: [{ label: 'Contact', href: '/contact' }] }),
        block({ blockType: 'demoEmbed', demo: 'woodlawn', title: 'Woodlawn' }),
        block({ blockType: 'code', language: 'html', code: '<b>x</b>' }),
      ),
    );
    expect(out).toContain('<aside><p><strong>Note</strong></p><p>Inside</p></aside>');
    expect(out).toContain('<div><h3>Start</h3><p>Go</p><p><a href="/contact">Contact</a></p></div>');
    expect(out).toContain('<p><a href="/woodlawn">Open the live prototype: Woodlawn →</a></p>');
    expect(out).toContain('<pre><code class="language-html">&lt;b&gt;x&lt;/b&gt;</code></pre>');
  });

  it('is empty for no body, and escapes what it is given', () => {
    expect(postBodyToHtml(null)).toBe('');
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});
