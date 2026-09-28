import { describe, expect, it } from 'vitest';
import { humanDate, readLabel, rel, shareLinks, stampDate } from './format';

describe('rel', () => {
  it('returns populated relations and null for ids', () => {
    expect(rel({ name: 'x' })).toEqual({ name: 'x' });
    expect(rel(3)).toBeNull();
    expect(rel(null)).toBeNull();
  });
});

describe('date formatting', () => {
  it('formats in UTC so a late-evening publish keeps its calendar day', () => {
    expect(humanDate('2026-09-12T23:30:00.000Z')).toBe('12 September 2026');
    expect(stampDate('2026-08-19T00:00:00.000Z')).toBe('19 AUG 2026');
    expect(humanDate(null)).toBe('');
    expect(humanDate('nope')).toBe('');
  });
  it('labels reading time with a floor of one minute', () => {
    expect(readLabel(3)).toBe('3 MIN READ');
    expect(readLabel(0)).toBe('1 MIN READ');
    expect(readLabel(null)).toBe('1 MIN READ');
  });
});

describe('shareLinks', () => {
  it('encodes the URL and title into the share intents', () => {
    const links = shareLinks('https://blueprintcode.ai/blog/a?b=1', 'Cost & scope');
    expect(links.map((l) => l.label)).toEqual(['LinkedIn', 'X', 'Email']);
    expect(links[0].href).toBe('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fblueprintcode.ai%2Fblog%2Fa%3Fb%3D1');
    expect(links[1].href).toContain('text=Cost%20%26%20scope');
    expect(links[2].href.startsWith('mailto:?subject=Cost%20%26%20scope&body=')).toBe(true);
  });
});
