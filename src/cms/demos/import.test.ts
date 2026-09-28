import { describe, expect, it } from 'vitest';
import { planImport, titleFromSlug } from './import';

const SITE = 'https://blueprintcode.ai';
const doc = (head: string) => `<!DOCTYPE html><html><head>${head}</head><body><p>x</p></body></html>`;

describe('planImport', () => {
  it('uses the document’s own title, description and noindex', () => {
    const plan = planImport({ slug: 'woodlawn', html: doc('<title>Woodlawn Hub</title><meta name="description" content="A youth hub.">') }, SITE);
    expect(plan).toMatchObject({ slug: 'woodlawn', title: 'Woodlawn Hub', seo: { description: 'A youth hub.', noindex: false }, notes: [] });
  });

  it('derives a title, flags a missing description, trims a long one', () => {
    const plan = planImport({ slug: 'max-kpi-japan', html: doc('') }, SITE) as { title: string; notes: string[]; seo: { description?: string } };
    expect(plan.title).toBe('Max Kpi Japan');
    expect(plan.notes).toEqual(expect.arrayContaining([expect.stringMatching(/no <title>/), expect.stringMatching(/no meta description/)]));
    const long = planImport({ slug: 'a', html: doc(`<meta name="description" content="${'word '.repeat(50)}">`) }, SITE) as { seo: { description?: string } };
    expect(long.seo.description!.length).toBeLessThanOrEqual(160);
    expect(long.seo.description!.endsWith('…')).toBe(true);
  });

  it('keeps a canonical only when it points somewhere else', () => {
    const self = planImport({ slug: 'a', html: doc('<link rel="canonical" href="https://blueprintcode.ai/a/">') }, SITE) as { seo: { canonical?: string } };
    expect(self.seo.canonical).toBeUndefined();
    const other = planImport({ slug: 'signet-ring-configurator-demo', html: doc('<link rel="canonical" href="https://blueprintcode.ai/signet-ring-configurator">') }, SITE) as { seo: { canonical?: string }; notes: string[] };
    expect(other.seo.canonical).toBe('https://blueprintcode.ai/signet-ring-configurator');
    expect(other.notes).toEqual(expect.arrayContaining([expect.stringMatching(/canonical points elsewhere/)]));
  });

  it('skips folders whose name is not a valid slug', () => {
    expect(planImport({ slug: 'bpc-capabilities-demo-test-delte', html: doc('') }, SITE)).not.toHaveProperty('skipped');
    expect(planImport({ slug: 'Bad Name', html: doc('') }, SITE)).toMatchObject({ skipped: expect.stringMatching(/lowercase/) });
  });

  it('titleFromSlug', () => {
    expect(titleFromSlug('premium-muay-thai-customiser')).toBe('Premium Muay Thai Customiser');
  });
});
