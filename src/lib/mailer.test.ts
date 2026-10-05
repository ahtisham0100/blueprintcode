import { describe, expect, it } from 'vitest';
import { brandMail, recipientList, ukTime } from './brandMail';
import { leadMail } from './mailer';

describe('brand email template', () => {
  it('parses recipient lists with a fallback', () => {
    expect(recipientList(undefined, 'x@y.com')).toEqual(['x@y.com']);
    expect(recipientList(' , ', 'x@y.com')).toEqual(['x@y.com']);
    expect(recipientList('a@y.com, b@y.com,,c@y.com ', 'x@y.com')).toEqual(['a@y.com', 'b@y.com', 'c@y.com']);
  });
  it('formats times for the UK and passes garbage through', () => {
    expect(ukTime('2026-10-05T14:58:18.435Z')).toBe('5 October 2026 at 15:58 UK');
    expect(ukTime('not a date')).toBe('not a date');
  });
  it('escapes values, drops empty rows and keeps line breaks in multiline fields', () => {
    const { html, text } = brandMail({
      tag: 'T',
      kicker: 'K',
      headline: 'H <b>',
      lede: 'L',
      rows: [
        { label: 'A', value: '<x>' },
        { label: 'B', value: '' },
        { label: 'C', value: 'one\ntwo', kind: 'multiline' },
      ],
    });
    expect(html).toContain('H &lt;b&gt;');
    expect(html).toContain('&lt;x&gt;');
    expect(html).not.toContain('>B<');
    expect(html).toContain('one<br>two');
    expect(text).toContain('A: <x>');
    expect(text).not.toContain('B:');
  });
});

describe('lead notification', () => {
  const lead = {
    ref: 'BPC-TEST1',
    name: 'Ada Lovelace',
    company: 'Analytical Engines',
    email: 'ada@example.com',
    phone: '',
    location: 'London',
    description: 'Line one\nLine two',
    projectLink: 'https://example.com',
    groups: ['3D configurator'],
    also: [],
    buildOther: '',
    stage: 'Idea',
    outcome: '',
    budget: '£10k',
    timeframe: '',
    browserTimezone: 'Europe/London',
    submittedAt: '2026-10-05T14:58:18.435Z',
    file: null,
  };
  it('composes a branded message with the reference and a reply button', () => {
    const m = leadMail(lead);
    expect(m.subject).toBe('Project enquiry BPC-TEST1: Analytical Engines');
    expect(m.html).toContain('Analytical Engines wants to talk');
    expect(m.html).toContain('mailto:ada@example.com');
    expect(m.html).toContain('Line one<br>Line two');
    expect(m.html).toContain('5 October 2026 at 15:58 UK');
    expect(m.html).not.toContain('>Phone<');
    expect(m.text).toContain('Reference: BPC-TEST1');
  });
  it('falls back to the name when there is no company', () => {
    const m = leadMail({ ...lead, company: '' });
    expect(m.subject).toBe('Project enquiry BPC-TEST1: Ada Lovelace');
    expect(m.html).toContain('Ada Lovelace wants to talk');
  });
});
