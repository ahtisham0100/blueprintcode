import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PostBody, imageSources, internalHref, nodeText } from './render';

const text = (t: string, format = 0) => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 });
const el = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({ type, version: 1, format: '', indent: 0, direction: 'ltr', children, ...extra });
const p = (...children: unknown[]) => el('paragraph', children, { textFormat: 0, textStyle: '' });
const root = (...children: unknown[]) => ({ root: el('root', children) }) as never;
const html = (state: unknown) => renderToStaticMarkup(<PostBody data={state as never} />);

const media = {
  id: 1,
  url: 'https://media.blueprintcode.ai/media/cover.jpg',
  alt: 'A cover',
  mimeType: 'image/jpeg',
  width: 2000,
  height: 1200,
  sizes: {
    thumb: { url: 'https://media.blueprintcode.ai/media/cover-400.webp', width: 400, height: 240 },
    medium: { url: 'https://media.blueprintcode.ai/media/cover-800.webp', width: 800, height: 480 },
    large: { url: 'https://media.blueprintcode.ai/media/cover-1600.webp', width: 1600, height: 960 },
  },
};

describe('PostBody', () => {
  it('renders paragraphs with inline formatting and headings with anchor ids', () => {
    const out = html(root(el('heading', [text('The four practical price levels')], { tag: 'h2' }), p(text('Bold', 1), text(' and '), text('code', 16)), el('heading', [text('H5 not allowed')], { tag: 'h5' })));
    expect(out).toContain('<h2 id="the-four-practical-price-levels">The four practical price levels</h2>');
    expect(out).toContain('<p><strong>Bold</strong> and <code>code</code></p>');
    // Unsupported heading levels fall back to h2 rather than h1 (the page owns its h1).
    expect(out).toContain('<h2 id="h5-not-allowed">');
  });

  it('renders lists, quotes, rules and links (custom, new-tab and internal)', () => {
    const out = html(
      root(
        el('list', [el('listitem', [text('one')], { value: 1 }), el('listitem', [text('two')], { value: 2 })], { listType: 'number', tag: 'ol', start: 1 }),
        el('quote', [text('Quoted')]),
        { type: 'horizontalrule', version: 1 },
        p(
          el('link', [text('pricing')], { fields: { linkType: 'custom', url: '/pricing', newTab: false } }),
          el('link', [text('amazon')], { fields: { linkType: 'custom', url: 'https://amazon.example', newTab: true } }),
          el('link', [text('post')], { fields: { linkType: 'internal', newTab: false, doc: { relationTo: 'posts', value: { id: 2, slug: '2d-vs-3d' } } } }),
        ),
      ),
    );
    expect(out).toContain('<ol><li>one</li><li>two</li></ol>');
    expect(out).toContain('<blockquote>Quoted</blockquote>');
    expect(out).toContain('<hr');
    expect(out).toContain('<a href="/pricing">pricing</a>');
    expect(out).toContain('<a href="https://amazon.example" rel="noopener noreferrer" target="_blank">amazon</a>');
    expect(out).toContain('<a href="/blog/2d-vs-3d">post</a>');
  });

  it('renders tables in the site’s wrapper with header cells', () => {
    const cell = (t: string, headerState = 0) => el('tablecell', [p(text(t))], { headerState, colSpan: 1, rowSpan: 1, backgroundColor: null });
    const out = html(root(el('table', [el('tablerow', [cell('Level', 1), cell('Price', 1)]), el('tablerow', [cell('Sprint'), cell('£625')])])));
    expect(out).toContain('<div class="table-wrap"><table><tbody><tr><th scope="col"><p>Level</p></th><th scope="col"><p>Price</p></th></tr><tr><td><p>Sprint</p></td><td><p>£625</p></td></tr></tbody></table></div>');
    expect(out).not.toContain('style=');
  });

  it('renders uploads as responsive figures with the WebP sizes, or a link for files', () => {
    const out = html(root({ type: 'upload', version: 3, relationTo: 'media', value: media, fields: { caption: 'Shown in situ' } }));
    expect(out).toContain('<figure class="post-figure"><img src="https://media.blueprintcode.ai/media/cover-1600.webp"');
    expect(out).toContain('srcSet="https://media.blueprintcode.ai/media/cover-800.webp 800w, https://media.blueprintcode.ai/media/cover-1600.webp 1600w"');
    expect(out).toContain('alt="A cover" width="1600" height="960" loading="lazy"');
    expect(out).toContain('<figcaption class="media-caption">Shown in situ</figcaption>');

    const pdf = html(root({ type: 'upload', version: 3, relationTo: 'media', value: { url: 'https://media.blueprintcode.ai/media/spec.pdf', mimeType: 'application/pdf', filename: 'spec.pdf' }, fields: null }));
    expect(pdf).toContain('<a href="https://media.blueprintcode.ai/media/spec.pdf" rel="noopener noreferrer">spec.pdf</a>');
    // Unpopulated upload (id only) renders nothing rather than crashing.
    expect(html(root({ type: 'upload', version: 3, relationTo: 'media', value: 7, fields: null }))).toBe('');
  });

  it('renders the callout, CTA, demo embed and code blocks', () => {
    const out = html(
      root(
        { type: 'block', version: 2, format: '', fields: { id: 'b1', blockName: '', blockType: 'callout', label: 'Planning note', body: root(p(text('Prepare '), el('link', [text('data')], { fields: { linkType: 'custom', url: '/x', newTab: false } }))) } },
        { type: 'block', version: 2, format: '', fields: { id: 'b2', blockName: '', blockType: 'cta', heading: 'Start here', text: 'Prove the difficult part first.', buttons: [{ label: 'Discuss', href: '/contact', style: 'solid' }, { label: 'Rates', href: '/pricing', style: 'outline' }] } },
        { type: 'block', version: 2, format: '', fields: { id: 'b3', blockName: '', blockType: 'demoEmbed', demo: 'premium-muay-thai-customiser', title: 'Fight shorts', caption: 'PROTO-01', height: 720 } },
        { type: 'block', version: 2, format: '', fields: { id: 'b4', blockName: '', blockType: 'code', language: 'json', code: '{"a":<1>}' } },
      ),
    );
    expect(out).toContain('<aside class="note"><span class="data">Planning note</span><p>Prepare <a href="/x">data</a></p></aside>');
    expect(out).toContain('<div class="post-cta"><h3>Start here</h3><p>Prove the difficult part first.</p><div class="actions"><a class="button solid" href="/contact">Discuss</a><a class="button" href="/pricing">Rates</a></div></div>');
    expect(out).toContain('<iframe src="/premium-muay-thai-customiser" title="Fight shorts" loading="lazy" allow="fullscreen">');
    expect(out).toContain('height:720px');
    expect(out).toContain('<figcaption class="media-caption"><span>PROTO-01</span><a href="/premium-muay-thai-customiser" target="_blank" rel="noopener">');
    expect(out).toContain('<pre class="post-code" data-language="json"><code>{&quot;a&quot;:&lt;1&gt;}</code></pre>');
  });

  it('renders nothing for an empty body', () => {
    expect(renderToStaticMarkup(<PostBody data={null} />)).toBe('');
    expect(renderToStaticMarkup(<PostBody data={undefined} />)).toBe('');
  });
});

describe('helpers', () => {
  it('imageSources prefers the large WebP and lists medium/large in the srcset', () => {
    expect(imageSources(media)).toEqual({
      src: 'https://media.blueprintcode.ai/media/cover-1600.webp',
      srcSet: 'https://media.blueprintcode.ai/media/cover-800.webp 800w, https://media.blueprintcode.ai/media/cover-1600.webp 1600w',
      width: 1600,
      height: 960,
    });
    expect(imageSources({ url: 'https://m/x.png', width: 300, height: 200 })).toEqual({ src: 'https://m/x.png', srcSet: undefined, width: 300, height: 200 });
    expect(imageSources({ url: null })).toBeNull();
  });

  it('internalHref resolves posts and demos, and falls back to the blog index', () => {
    const link = (doc: unknown) => ({ type: 'link', fields: { linkType: 'internal', newTab: false, doc }, children: [] }) as never;
    expect(internalHref(link({ relationTo: 'posts', value: { id: 1, slug: 'a' } }))).toBe('/blog/a');
    expect(internalHref(link({ relationTo: 'demos', value: { id: 1, slug: 'woodlawn' } }))).toBe('/woodlawn');
    expect(internalHref(link({ relationTo: 'posts', value: 3 }))).toBe('/blog');
    expect(internalHref(link(null))).toBe('/blog');
  });

  it('nodeText flattens descendants', () => {
    expect(nodeText(el('heading', [text('A '), el('link', [text('b')], { fields: {} })], { tag: 'h2' }))).toBe('A b');
  });
});
