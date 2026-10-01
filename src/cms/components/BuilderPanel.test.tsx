import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuilderPanel, type BuilderSummary } from './BuilderPanel';

const data: BuilderSummary = {
  counts: { clients: 2, projects: 3, submitted: 1 },
  recent: [
    { id: 'BP-AAAAAAAAAA', name: 'Cinema <room>', rev: 4, createdAt: '2026-09-29T10:00:00Z', updatedAt: '2026-09-30T10:00:00Z', submittedAt: '2026-09-30T10:00:00Z', clientEmail: 'a@example.com', submissions: 2 },
    { id: 'BP-BBBBBBBBBB', name: '', rev: 1, createdAt: '2026-09-29T10:00:00Z', updatedAt: '2026-09-29T10:00:00Z', submittedAt: null, clientEmail: 'b@example.com', submissions: 0 },
  ],
};

describe('BuilderPanel', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('lists projects with a review link each, escaping client text', () => {
    vi.stubEnv('BUILDER_PUBLIC', '');
    const html = renderToStaticMarkup(<BuilderPanel data={data} />);
    expect(html).toContain('href="/api/cms/builder-review/BP-AAAAAAAAAA"');
    expect(html).toContain('Cinema &lt;room&gt;');
    expect(html).toContain('Untitled project');
    expect(html).toContain('sent 2 times');
    expect(html).toContain('<dt>Projects in progress</dt><dd>2</dd>');
    expect(html).toContain('off (BUILDER_PUBLIC)');
  });

  it('says when there are no projects', () => {
    const html = renderToStaticMarkup(<BuilderPanel data={{ counts: { clients: 0, projects: 0, submitted: 0 }, recent: [] }} />);
    expect(html).toContain('No projects yet.');
  });
});
