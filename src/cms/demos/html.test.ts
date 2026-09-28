import { describe, expect, it } from 'vitest';
import { extractCanonical, extractDescription, extractMeta, extractNoindex, extractTitle, validateDemoHtml } from './html';

const DOC = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Signet Ring &amp; Band Configurator — Demo</title>
  <meta content="Configure a signet ring in 3D." name="description">
  <meta property="og:title" content='Signet Ring Configurator'>
  <link href="https://blueprintcode.ai/signet-ring-configurator" rel="canonical">
  <meta name="robots" content="index, follow">
</head>
<body><h1>Hi</h1><script>console.log(1)</script></body>
</html>`;

describe('validateDemoHtml', () => {
  it('accepts a complete document', () => {
    expect(validateDemoHtml(DOC)).toBeNull();
  });
  it('rejects empties, fragments and oversized documents with a useful message', () => {
    expect(validateDemoHtml('')).toMatch(/full HTML/);
    expect(validateDemoHtml('<div>hello</div>')).toMatch(/<html>/);
    expect(validateDemoHtml('<html><body>x</body></html>')).toMatch(/<head>/);
    expect(validateDemoHtml('<html><head></head><p>x</p></html>')).toMatch(/<body>/);
    expect(validateDemoHtml('<html><head></head><body>x</html>')).toMatch(/<\/body>/);
    expect(validateDemoHtml('<html><head></head><body>' + 'x'.repeat(5 * 1024 * 1024) + '</body></html>')).toMatch(/5 MB/);
  });
});

describe('extractors', () => {
  it('reads the title with entities decoded and whitespace collapsed', () => {
    expect(extractTitle(DOC)).toBe('Signet Ring & Band Configurator — Demo');
    expect(extractTitle('<html><head></head><body></body></html>')).toBeNull();
  });
  it('reads meta description and og:* regardless of attribute order or quotes', () => {
    expect(extractDescription(DOC)).toBe('Configure a signet ring in 3D.');
    expect(extractMeta(DOC, 'og:title', 'property')).toBe('Signet Ring Configurator');
    expect(extractMeta(DOC, 'missing')).toBeNull();
  });
  it('reads the canonical link', () => {
    expect(extractCanonical(DOC)).toBe('https://blueprintcode.ai/signet-ring-configurator');
    expect(extractCanonical('<html><head><link rel="stylesheet" href="/x.css"></head><body></body></html>')).toBeNull();
  });
  it('detects noindex', () => {
    expect(extractNoindex(DOC)).toBe(false);
    expect(extractNoindex(DOC.replace('index, follow', 'noindex, nofollow'))).toBe(true);
  });
});
