import { describe, expect, it } from 'vitest';
import { authorPlan, categoryFromRef, planInsightPost, publishDate, redirectsForSwitchOver } from './importInsights';

const note = {
  slug: 'configurator-cost',
  refB: 'COST & SCOPE',
  title: 'What does a product configurator cost in 2026?',
  desc: 'Realistic price bands, the variables that move them, and how to avoid paying production money before the difficult idea is proven.',
  author: 'James Michaelson',
  datePublished: '2026-08-19',
  dateModified: '2026-09-12',
};
const html =
  '<div class="panel-head"><span class="lbl">INS-001 · COST &amp; SCOPE · 3 MIN READ</span><h1>What does a product configurator cost in 2026?</h1></div>' +
  '<p class="intro">In 2026, a credible configurator can begin at around <strong>£2,500</strong>.</p><h2>The four practical price levels</h2>' +
  '<div class="note"><span class="data">Planning note</span>Prepare a representative product set.</div>' +
  '<div class="panel-foot"><a class="button" href="/pricing">See the rates</a></div>';

describe('planInsightPost', () => {
  it('turns a note into a draft-ready post plan with its original date', () => {
    const plan = planInsightPost(note, html);
    if ('skipped' in plan) throw new Error(plan.skipped);
    expect(plan).toMatchObject({
      slug: 'configurator-cost',
      title: note.title,
      excerpt: note.desc,
      publishedAt: '2026-08-19T09:00:00.000Z',
      category: { name: 'Cost & scope', slug: 'cost-scope' },
      authorName: 'James Michaelson',
      seo: { description: note.desc },
      readingTime: 1,
    });
    const types = (plan.body.root.children as { type: string; fields?: { blockType: string } }[]).map((n) => n.fields?.blockType ?? n.type);
    // The panel head (label + h1) is dropped: title and category are fields.
    expect(types).toEqual(['paragraph', 'heading', 'callout', 'cta']);
    expect(plan.notes).toEqual(['was updated 2026-09-12; the CMS records its own updatedAt']);
  });

  it('trims a long description into the excerpt and leaves the meta description empty', () => {
    const long = { ...note, desc: 'word '.repeat(60).trim() };
    const plan = planInsightPost(long, html);
    if ('skipped' in plan) throw new Error(plan.skipped);
    expect(plan.excerpt.length).toBeLessThanOrEqual(200);
    expect(plan.excerpt.endsWith('…')).toBe(true);
    expect(plan.seo).toEqual({});
    expect(plan.notes.join(' ')).toMatch(/excerpt trimmed/);
  });

  it('skips notes with an invalid slug or no body', () => {
    expect(planInsightPost({ ...note, slug: 'category' }, html)).toMatchObject({ skipped: expect.stringMatching(/reserved/) });
    expect(planInsightPost(note, '<div class="panel-head"><h1>x</h1></div>')).toEqual({ slug: 'configurator-cost', skipped: 'empty body' });
  });
});

describe('helpers', () => {
  it('maps the index labels to categories', () => {
    expect(categoryFromRef('VISUAL METHOD')).toEqual({ name: 'Visual method', slug: 'visual-method' });
    expect(categoryFromRef('OPERATOR NOTE')).toEqual({ name: 'Operator note', slug: 'operator-note' });
  });

  it('maps the notes.tsx author profiles, keeping the About-page anchor as the slug', () => {
    expect(
      authorPlan({
        name: 'James Michaelson',
        jobTitle: 'Founder & Solutions Architect',
        url: 'https://blueprintcode.ai/about#james-michaelson',
        image: 'https://blueprintcode.ai/james.jpeg',
        sameAs: ['https://www.linkedin.com/in/james-michaelson-phoenix-projectors-av/'],
      }),
    ).toEqual({
      name: 'James Michaelson',
      slug: 'james-michaelson',
      title: 'Founder & Solutions Architect',
      links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/james-michaelson-phoenix-projectors-av/' }],
      imagePath: 'james.jpeg',
    });
    expect(authorPlan({ name: 'A B', jobTitle: 'x', url: 'https://blueprintcode.ai/about', image: 'https://cdn.example/a.jpg', sameAs: ['https://www.example.com/a'] })).toMatchObject({
      slug: 'a-b',
      links: [{ label: 'example.com', url: 'https://www.example.com/a' }],
      imagePath: undefined,
    });
  });

  it('formats publish dates and rejects anything else', () => {
    expect(publishDate('2026-09-03')).toBe('2026-09-03T09:00:00.000Z');
    expect(() => publishDate('3 Sept')).toThrow();
  });

  it('plans the switch-over redirects without applying them', () => {
    expect(redirectsForSwitchOver(['a', 'b'])).toEqual([
      { from: '/insights/a', to: '/blog/a', permanent: true },
      { from: '/insights/b', to: '/blog/b', permanent: true },
    ]);
  });
});
