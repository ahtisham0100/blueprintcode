import { describe, expect, it } from 'vitest';
import * as B from './engine';

const CFG = B.DEFAULT_CONFIG;

describe('Process Blueprinter engine', () => {
  it('turns the "quote by email" example into a connected flow', () => {
    const flow = B.fromPreset(CFG, 'trade');
    const r = B.transform(CFG, flow);
    if (!r.ok) throw new Error(r.reason);
    expect(r.nodes[0].label).toBe('Customer');
    expect(r.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['select', 'quote', 'crm']));
    expect(r.metrics.stepsBefore).toBe(8);
    expect(r.metrics.loopsBefore).toBe(1);
    expect(r.metrics.manualAfter).toBe(0);
    // Every step after the customer is accounted for.
    const placed = r.nodes.flatMap((n) => n.replaces).length + r.review.length;
    expect(placed).toBe(flow.steps.length - 1);
  });

  it('needs at least two steps after the customer', () => {
    expect(B.transform(CFG, { steps: [], loops: [] }).ok).toBe(false);
    expect(B.transform(CFG, { steps: [B.stepFromBlock(CFG, 'customer'), B.stepFromBlock(CFG, 'email')], loops: [] }).ok).toBe(false);
  });

  it('classifies the visitor’s own steps by their words', () => {
    expect(B.customStep(CFG, 'Excel price list').kind).toBe('manual_data');
    expect(B.customStep(CFG, 'Instagram DMs').kind).toBe('contact');
    expect(B.customStep(CFG, 'Xero').kind).toBe('system');
    expect(B.customStep(CFG, 'Something unusual').kind).toBe('other');
    expect(() => B.customStep(CFG, '   ')).toThrow('Name the step.');
    expect(B.customStep(CFG, 'x'.repeat(60)).label).toHaveLength(40);
  });

  it('keeps loops attached to real links when steps move or go', () => {
    let flow = B.fromPreset(CFG, 'trade');
    const last = flow.steps[flow.steps.length - 1].uid;
    flow = B.toggleLoop(flow, last);
    expect(flow.loops).not.toContain(last);
    const loopStep = flow.loops[0];
    flow = B.remove(flow, loopStep);
    expect(flow.loops).not.toContain(loopStep);
    const id = flow.steps[1].uid;
    expect(B.move(flow, id, -1).steps[0].uid).toBe(id);
    expect(B.moveTo(flow, id, 99).steps.at(-1)!.uid).toBe(id);
  });

  it('only reads back flows that look like flows', () => {
    expect(B.readFlow(null)).toBeNull();
    expect(B.readFlow({ steps: 'x', loops: [] })).toBeNull();
    expect(B.readFlow({ steps: [{ uid: 1 }], loops: [] })).toBeNull();
    const f = B.fromPreset(CFG, 'shop');
    expect(B.readFlow(JSON.parse(JSON.stringify(f)))).toEqual(f);
  });

  it('writes a builder brief and link from the visitor’s own process', () => {
    const flow = B.fromPreset(CFG, 'trade');
    const r = B.transform(CFG, flow);
    if (!r.ok) throw new Error(r.reason);
    const brief = B.builderBrief(CFG, flow, r);
    expect(brief).toMatch(/^Today our process is: Customer → Website → Email → Staff ↔ Spreadsheet → Quote/);
    expect(brief).toContain("We'd like");
    const link = B.builderLink('/builder', CFG, flow, r);
    expect(link.startsWith('/builder#/start?desc=')).toBe(true);
    expect(decodeURIComponent(link.split('desc=')[1])).toBe(brief);
  });

  it('draws an SVG that escapes the visitor’s text', () => {
    let flow = B.fromPreset(CFG, 'trade');
    flow = B.add(flow, B.customStep(CFG, '<script>alert(1)</script>'));
    const r = B.transform(CFG, flow);
    if (!r.ok) throw new Error(r.reason);
    const svg = B.renderSVG(CFG, flow, r, { width: 1200, animate: false });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(B.renderSVG(CFG, flow, r, { width: 360 })).toMatch(/viewBox="0 0 360 /);
  });
});
