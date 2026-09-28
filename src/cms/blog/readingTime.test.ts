import { describe, expect, it } from 'vitest';
import { WORDS_PER_MINUTE, countWords, lexicalPlainText, readingTimeMinutes } from './readingTime';

const text = (t: string) => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 });
const p = (...children: unknown[]) => ({ type: 'paragraph', version: 1, format: '', indent: 0, direction: 'ltr', textFormat: 0, textStyle: '', children });
const root = (...children: unknown[]) => ({ root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children } });

describe('lexicalPlainText', () => {
  it('joins text nodes across block boundaries with spaces', () => {
    const state = root(p(text('Hello'), text(' world')), { type: 'heading', tag: 'h2', children: [text('Next')] });
    expect(lexicalPlainText(state)).toBe('Hello world Next');
  });

  it('descends into links, lists, quotes and tables', () => {
    const state = root(
      { type: 'quote', children: [text('Quoted')] },
      { type: 'list', children: [{ type: 'listitem', children: [{ type: 'link', fields: { url: '/x' }, children: [text('Linked')] }] }] },
      { type: 'table', children: [{ type: 'tablerow', children: [{ type: 'tablecell', children: [p(text('Cell'))] }] }] },
    );
    expect(lexicalPlainText(state)).toBe('Quoted Linked Cell');
  });

  it('counts the words inside our blocks (callout body, CTA copy) but not code or embeds', () => {
    const state = root(
      { type: 'block', fields: { blockType: 'callout', label: 'Planning note', body: root(p(text('Prepare a product set'))) } },
      { type: 'block', fields: { blockType: 'cta', heading: 'Talk to us', text: 'About your project' } },
      { type: 'block', fields: { blockType: 'code', code: 'const a = 1;\nconst b = 2;' } },
      { type: 'block', fields: { blockType: 'demoEmbed', demo: 'woodlawn', title: 'A demo' } },
    );
    expect(lexicalPlainText(state)).toBe('Planning note Prepare a product set Talk to us About your project');
  });

  it('is empty for missing or malformed states', () => {
    expect(lexicalPlainText(null)).toBe('');
    expect(lexicalPlainText({})).toBe('');
    expect(lexicalPlainText('not an editor state')).toBe('');
  });
});

describe('countWords / readingTimeMinutes', () => {
  it('counts whitespace-separated words, ignoring stray punctuation', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  one two\nthree — four ')).toBe(4);
    expect(countWords('£2,500 rising to £7,500–£15,000')).toBe(4);
  });

  it(`rounds to whole minutes at ${WORDS_PER_MINUTE} wpm with a floor of one`, () => {
    expect(readingTimeMinutes(root())).toBe(1);
    expect(readingTimeMinutes(root(p(text('a '.repeat(50)))))).toBe(1);
    expect(readingTimeMinutes(root(p(text('a '.repeat(700)))))).toBe(Math.round(700 / WORDS_PER_MINUTE));
    expect(readingTimeMinutes(root(p(text('a '.repeat(1000)))))).toBe(5);
  });
});
