import { describe, expect, it } from 'vitest';
import { renderDemoDocument, seoHeadTags, stripManagedHeadTags, type DemoForRender } from './render';

const base: DemoForRender = {
  slug: 'signet-ring-configurator',
  title: 'Signet Ring Configurator',
  html: `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<title>Old title</title>
<meta name="description" content="old description">
<link rel="canonical" href="https://elsewhere.example/x">
<meta property="og:title" content="old og">
<style>body{}</style>
</head><body><div id="app"></div><script>run()</script></body></html>`,
};
const opts = { siteUrl: 'https://blueprintcode.ai', headerTpl: '<div>H __LABEL__</div>', footerTpl: '<div>F __DOC__ __METAKEY__ __METAVAL__</div>' };

describe('stripManagedHeadTags', () => {
  it('removes title, description, robots, canonical, og:* and twitter:* but nothing else', () => {
    const out = stripManagedHeadTags(base.html);
    expect(out).not.toMatch(/<title/);
    expect(out).not.toMatch(/name="description"/);
    expect(out).not.toMatch(/rel="canonical"/);
    expect(out).not.toMatch(/og:title/);
    expect(out).toContain('<meta charset="utf-8">');
    expect(out).toContain('<style>body{}</style>');
    expect(out).toContain('<script>run()</script>');
  });
});

describe('seoHeadTags', () => {
  it('generates title, description, robots, canonical, og and JSON-LD from the fields', () => {
    const head = seoHeadTags({ ...base, seo: { description: 'Configure a signet ring in 3D.' } }, { siteUrl: opts.siteUrl });
    expect(head).toContain('<title>Signet Ring Configurator</title>');
    expect(head).toContain('<meta name="description" content="Configure a signet ring in 3D.">');
    expect(head).toContain('<meta name="robots" content="index, follow, max-image-preview:large">');
    expect(head).toContain('<link rel="canonical" href="https://blueprintcode.ai/signet-ring-configurator">');
    expect(head).toContain('<meta property="og:url" content="https://blueprintcode.ai/signet-ring-configurator">');
    expect(head).toContain('<meta property="og:title" content="Signet Ring Configurator">');
    expect(head).toContain('<meta name="twitter:card" content="summary">');
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(head)![1]);
    expect(ld).toMatchObject({ '@type': 'WebPage', name: 'Signet Ring Configurator', url: 'https://blueprintcode.ai/signet-ring-configurator' });
  });

  it('honours overrides: metaTitle, canonical, noindex, og image and custom JSON-LD', () => {
    const head = seoHeadTags(
      {
        ...base,
        seo: {
          metaTitle: 'Ring demo — BPC',
          canonical: 'https://blueprintcode.ai/other',
          noindex: true,
          ogImage: { url: 'https://media.blueprintcode.ai/media/x/ring-a1b2c3d4-1600x900.webp', width: 1600, height: 900, alt: 'Ring' },
          jsonLd: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Ring' },
        },
      },
      { siteUrl: opts.siteUrl },
    );
    expect(head).toContain('<title>Ring demo — BPC</title>');
    expect(head).toContain('href="https://blueprintcode.ai/other"');
    expect(head).toContain('content="noindex, nofollow"');
    expect(head).toContain('og:image:width" content="1600"');
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(head.match(/application\/ld\+json/g)).toHaveLength(2);
    expect(head).toContain('"@type":"SoftwareApplication"');
  });

  it('escapes attribute values and never lets </script> out of JSON-LD', () => {
    const head = seoHeadTags({ ...base, title: 'A "quoted" <b>title</b>', seo: { jsonLd: { x: '</script><script>alert(1)</script>' } } }, { siteUrl: opts.siteUrl });
    expect(head).toContain('<title>A &quot;quoted&quot; &lt;b&gt;title&lt;/b&gt;</title>');
    expect(head).not.toContain('</script><script>alert');
    expect(head).toContain('\\u003c/script>');
  });

  it('forces noindex and drops the canonical in preview mode', () => {
    const head = seoHeadTags(base, { siteUrl: opts.siteUrl, preview: true });
    expect(head).toContain('noindex');
    expect(head).not.toContain('rel="canonical"');
  });
});

describe('renderDemoDocument', () => {
  it('produces one document with managed head, chrome, watermark and the original body intact', () => {
    const { html, warnings } = renderDemoDocument({ ...base, label: 'RING' }, opts);
    expect(warnings).toEqual([]);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<title>Signet Ring Configurator</title>');
    expect(html).toContain('<div>H RING</div>');
    expect(html).toContain('<div>F SIGNET RING CONFIGURATOR FORMAT LIVE DEMO</div>');
    expect(html).toContain('/partials/watermark.js');
    expect(html).toContain('<div id="app"></div><script>run()</script>');
    expect(html.indexOf('BPC:SEO:START')).toBeLessThan(html.indexOf('<meta charset'));
  });

  it('is idempotent when re-rendered from already-rendered HTML', () => {
    const once = renderDemoDocument(base, opts).html;
    const twice = renderDemoDocument({ ...base, html: once, title: 'Renamed' }, opts).html;
    expect(twice.match(/BPC:SEO:START/g)).toHaveLength(1);
    expect(twice.match(/<title>/g)).toHaveLength(1);
    expect(twice).toContain('<title>Renamed</title>');
    expect(twice.match(/BPC:HEADER:START/g)).toHaveLength(1);
  });
});
