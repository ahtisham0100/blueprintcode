import { describe, expect, it } from 'vitest';
import { ProjectError, blueprintMarkdown, demoProject, documentStates, projectHandover, readProject } from './engines';

const T0 = '2026-09-30T10:00:00.000Z';

describe('builder engines on the server', () => {
  it('reads the demo project and produces its documents and handover', () => {
    const p = readProject(JSON.parse(JSON.stringify(demoProject(T0))));
    expect(p.tools).toHaveLength(3);
    const states = documentStates(p);
    expect(states.total).toBeGreaterThan(20);
    const h = projectHandover(p);
    expect(h.schema).toBe('bpc.handover/1');
    expect((h.tools as unknown[]).length).toBe(3);
  });

  it('writes the full blueprint Markdown like the app export', () => {
    const md = blueprintMarkdown(demoProject(T0), new Date(T0));
    expect(md.startsWith('# Blueprint: Cinema room package\n\nVersion ')).toBe(true);
    expect(md).toContain('30/09/2026');
    expect(md).toContain('_State: ');
    expect(md).toContain('\n\n---\n\n');
  });

  it('rejects things that are not projects, with a message safe to show', () => {
    const bad: unknown[] = [
      null,
      [],
      'text',
      { schema: 'other', tools: [] },
      { schema: 'bpc.project/1' },
      { schema: 'bpc.project/1', tools: ['x'] },
      { schema: 'bpc.project/1', tools: [{ id: 'T-01', module: 'nope' }] },
      { schema: 'bpc.project/1', tools: [], name: 42 },
      { schema: 'bpc.project/1', tools: [], comments: { A: 'not a list' } },
    ];
    for (const b of bad) expect(() => readProject(b), JSON.stringify(b)).toThrow(ProjectError);
  });

  it('accepts a fresh empty project, filling in a missing name or description', () => {
    expect(readProject({ schema: 'bpc.project/1', id: 'P-1', tools: [] })).toMatchObject({ name: '', description: '', tools: [] });
  });
});
