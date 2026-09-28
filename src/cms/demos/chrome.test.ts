import { describe, expect, it } from 'vitest';
import { CSS_LINK, JS_TAG, WATERMARK_TAG, injectChrome, metaFromSlug, stripPartialComment } from '../../../scripts/lib/chrome.mjs';

const headerTpl = '<div class="bpc-head"><a href="/">BLUEPRINT CODE<span>__LABEL__</span></a><a href="/pricing">Pricing</a></div>';
const footerTpl = '<div class="bpc-footer">DOC __DOC__ / __METAKEY__ __METAVAL__</div>';
const DOC = '<!DOCTYPE html><html><head><title>x</title></head><body><main>hi</main></body></html>';
const meta = metaFromSlug('maison-cacao-demo');

describe('injectChrome', () => {
  it('adds css link, header, footer, script and watermark to a demo', () => {
    const { html, warnings } = injectChrome(DOC, meta, { headerTpl, footerTpl, watermark: true });
    expect(warnings).toEqual([]);
    expect(html).toContain(`<!--BPC:ASSETS:START-->\n${CSS_LINK}\n<!--BPC:ASSETS:END-->`);
    expect(html.indexOf('BPC:ASSETS:END')).toBeLessThan(html.indexOf('</head>'));
    expect(html.indexOf(WATERMARK_TAG)).toBeLessThan(html.indexOf('</head>'));
    expect(html).toMatch(/<body>\n<!--BPC:HEADER:START-->[\s\S]*MAISON CACAO DEMO[\s\S]*<!--BPC:HEADER:END-->/);
    expect(html).toMatch(/<!--BPC:FOOTER:START-->[\s\S]*DOC MAISON CACAO DEMO \/ FORMAT LIVE DEMO[\s\S]*<!--BPC:FOOTER:END-->/);
    expect(html).toContain(`<!--BPC:SCRIPT:START-->\n${JS_TAG}\n<!--BPC:SCRIPT:END-->\n</body>`);
    expect(html).toContain(WATERMARK_TAG);
    // Header comes right after <body>, footer + script right before </body>
    expect(html.indexOf('BPC:HEADER:START')).toBeLessThan(html.indexOf('<main>'));
    expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('BPC:FOOTER:START'));
  });

  it('is idempotent: re-injecting replaces the blocks instead of duplicating them', () => {
    const once = injectChrome(DOC, meta, { headerTpl, footerTpl, watermark: true }).html;
    const twice = injectChrome(once, { ...meta, label: 'CHANGED' }, { headerTpl, footerTpl, watermark: true }).html;
    expect(twice.match(/BPC:HEADER:START/g)).toHaveLength(1);
    expect(twice.match(/watermark\.js/g)).toHaveLength(1);
    expect(twice).toContain('CHANGED');
    expect(twice).not.toContain('MAISON CACAO DEMO</span>');
  });

  it('reports what it could not place instead of throwing', () => {
    const { warnings } = injectChrome('<html><head></head><p>no body</p></html>', meta, { headerTpl, footerTpl, watermark: true });
    expect(warnings).toEqual(expect.arrayContaining(['no <body>', 'no </body> (footer)', 'no </body> (script)']));
  });

  it('marks the active nav link for content pages', () => {
    const { html } = injectChrome(DOC, { ...meta, route: '/pricing' }, { headerTpl, footerTpl, isContent: true });
    expect(html).toContain('href="/pricing" aria-current="page"');
  });
});

describe('metaFromSlug / stripPartialComment', () => {
  it('derives readable labels and honours overrides', () => {
    expect(metaFromSlug('premium-muay-thai-customiser')).toMatchObject({ label: 'PREMIUM MUAY THAI CUSTOMISER', doc: 'PREMIUM MUAY THAI CUSTOMISER', metaKey: 'FORMAT', metaVal: 'LIVE DEMO' });
    expect(metaFromSlug('x', { label: 'DEMO SUITE', doc: 'MAISON CACAO — DEMO SUITE' })).toMatchObject({ label: 'DEMO SUITE', doc: 'MAISON CACAO — DEMO SUITE' });
  });
  it('drops the authoring comment at the top of a partial', () => {
    expect(stripPartialComment('<!-- note -->\n<div>x</div>\n')).toBe('<div>x</div>');
  });
});
