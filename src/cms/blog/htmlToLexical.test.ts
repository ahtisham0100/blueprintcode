import { describe, expect, it } from 'vitest';
import { decodeEntities, headingSlugs, htmlToLexical, parseHtml } from './htmlToLexical';
import { lexicalPlainText } from './readingTime';
import { postBodyToHtml } from './renderHtml';

type N = Record<string, unknown> & { type: string; children?: N[]; fields?: Record<string, unknown> };
const kids = (html: string) => htmlToLexical(html).root.children as N[];

describe('parseHtml', () => {
  it('builds a tree with attributes, void elements and decoded text', () => {
    const t = parseHtml('<p class="intro">A &amp; B<br/><a href="/x?a=1&amp;b=2" target="_blank">l</a></p><!-- c -->');
    expect(t).toEqual([
      {
        tag: 'p',
        attrs: { class: 'intro' },
        children: [{ text: 'A & B' }, { tag: 'br', attrs: {}, children: [] }, { tag: 'a', attrs: { href: '/x?a=1&b=2', target: '_blank' }, children: [{ text: 'l' }] }],
      },
    ]);
  });
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('&lt;&gt;&quot;&#x27;&#39;&#8212;&nbsp;')).toBe('<>"\'\'— ');
  });
});

describe('htmlToLexical', () => {
  it('maps paragraphs with bold, italic, code and links', () => {
    const [p] = kids('<p>Plain <strong>bold</strong> <em>it</em> <code>c</code> <a href="/pricing">rates</a> <a href="https://a.example" target="_blank" rel="noopener">ext</a></p>');
    expect(p.type).toBe('paragraph');
    expect(p.children!.map((c) => (c.type === 'link' ? [c.type, (c.fields as { url: string }).url, (c.fields as { newTab: boolean }).newTab] : [c.type, c.text, c.format]))).toEqual([
      ['text', 'Plain ', 0],
      ['text', 'bold', 1],
      ['text', ' ', 0],
      ['text', 'it', 2],
      ['text', ' ', 0],
      ['text', 'c', 16],
      ['text', ' ', 0],
      ['link', '/pricing', false],
      ['text', ' ', 0],
      ['link', 'https://a.example', true],
    ]);
  });

  it('drops the panel head (label + h1), keeps h2/h3 and folds h5/h6 into h4', () => {
    const out = kids('<div class="panel-head"><span class="lbl">INS-001</span><h1>Title</h1></div><h2>Two</h2><h3>Three</h3><h5>Five</h5>');
    expect(out.map((n) => [n.type, n.tag])).toEqual([
      ['heading', 'h2'],
      ['heading', 'h3'],
      ['heading', 'h4'],
    ]);
  });

  it('maps lists, quotes and tables (header cells from th)', () => {
    const out = kids(
      '<ul><li><strong>A:</strong> one</li><li>two</li></ul><ol><li>x</li></ol><blockquote>Q</blockquote>' +
        '<div class="table-wrap"><table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table></div>',
    );
    expect(out.map((n) => n.type)).toEqual(['list', 'list', 'quote', 'table']);
    expect(out[0]).toMatchObject({ listType: 'bullet', tag: 'ul' });
    expect(out[0].children!.map((li) => li.value)).toEqual([1, 2]);
    expect(out[1]).toMatchObject({ listType: 'number', tag: 'ol' });
    const rows = out[3].children!;
    expect(rows.map((r) => r.children!.map((c) => c.headerState))).toEqual([
      [1, 1],
      [0, 0],
    ]);
    expect(rows[1].children![1].children![0].children![0]).toMatchObject({ type: 'text', text: 'b' });
  });

  it('turns .note into a callout block and .panel-foot into a CTA block', () => {
    const out = kids(
      '<div class="note"><span class="data">Planning note</span>Prepare a <a href="/x">product set</a>.</div>' +
        '<div class="panel-foot"><a class="button" href="/pricing">See the rates</a><a class="button solid" href="/contact">Talk</a></div>',
    );
    expect(out[0]).toMatchObject({ type: 'block', fields: { blockType: 'callout', label: 'Planning note' } });
    expect(lexicalPlainText((out[0].fields as { body: unknown }).body)).toBe('Prepare a product set .');
    expect(out[1]).toMatchObject({
      type: 'block',
      fields: {
        blockType: 'cta',
        buttons: [
          { label: 'See the rates', href: '/pricing', style: 'outline' },
          { label: 'Talk', href: '/contact', style: 'solid' },
        ],
      },
    });
    expect((out[0].fields as { id: string }).id).not.toBe((out[1].fields as { id: string }).id);
  });

  it('round-trips through the feed renderer with nothing lost', () => {
    const html = '<p class="intro">Intro &amp; more</p><h2>Head</h2><ul><li>One</li></ul><blockquote>Quote</blockquote><div class="note"><span class="data">N</span>Body</div>';
    const back = postBodyToHtml(htmlToLexical(html) as never);
    expect(back).toContain('<p>Intro &amp; more</p>');
    expect(back).toContain('<h2 id="head">Head</h2>');
    expect(back).toContain('<ul><li>One</li></ul>');
    expect(back).toContain('<blockquote>Quote</blockquote>');
    expect(back).toContain('<aside><p><strong>N</strong></p><p>Body</p></aside>');
    expect(headingSlugs(htmlToLexical(html))).toEqual(['head']);
  });
});
