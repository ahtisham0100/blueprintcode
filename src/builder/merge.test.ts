import { describe, expect, it } from 'vitest';
import { CTX, Documents, demoProject, type BuilderProject } from './engines';
import { mergeForRole } from './merge';

const T0 = '2026-09-30T10:00:00.000Z';
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Demo project with P-TECH (a document BPC reviews) approved by the client.
 *  approve() records whatever it is given; the merge doesn't depend on state. */
function approvedByClient(): { p: BuilderProject; docId: string } {
  const p = demoProject(T0);
  const d = Documents.documentSet(p, CTX).find((x) => x.id === 'P-TECH')!;
  Documents.approve(p, d, 'client', T0);
  return { p, docId: d.id };
}

function docState(p: BuilderProject, id: string): string {
  return Documents.documentSet(p, CTX).find((d) => d.id === id)!.state;
}

describe('mergeForRole: client saves', () => {
  it('keeps the client’s own work, approvals and comments', () => {
    const { p: stored, docId } = approvedByClient();
    const incoming = copy(stored);
    incoming.name = 'Renamed by client';
    Documents.comment(incoming, 'REQ-X', docId, 'client', 'Looks good', T0);
    const out = mergeForRole(stored, incoming, 'client');
    expect(out.name).toBe('Renamed by client');
    expect(out.reviews![docId].client).toEqual(stored.reviews![docId].client);
    expect(out.comments!['REQ-X']).toEqual([{ at: T0, by: 'client', doc: docId, text: 'Looks good' }]);
  });

  it('cannot forge a BPC approval', () => {
    const { p: stored, docId } = approvedByClient();
    const incoming = copy(stored);
    const d = Documents.documentSet(incoming, CTX).find((x) => x.id === docId)!;
    Documents.approve(incoming, d, 'bpc', T0);
    expect(docState(incoming, docId)).toBe('bpc_approved');
    const out = mergeForRole(stored, incoming, 'client');
    expect(out.reviews![docId].bpc).toBeUndefined();
    expect(docState(out, docId)).not.toBe('bpc_approved');
  });

  it('cannot change, remove or forge BPC comments, clarifications or approvals', () => {
    const { p: stored, docId } = approvedByClient();
    stored.reviews![docId].bpc = { at: T0, hash: 'h1' };
    stored.reviews![docId].clarify = { at: T0, text: 'Which regions?', resolved: false };
    stored.comments = { 'REQ-A': [{ at: T0, by: 'bpc', doc: docId, text: 'BPC note' }] };
    const incoming = copy(stored);
    incoming.reviews![docId].bpc = { at: T0, hash: 'forged' };
    incoming.reviews![docId].clarify = { at: T0, text: 'Rewritten question', resolved: false };
    incoming.reviews!['P-NEW'] = { clarify: { at: T0, text: 'Invented', resolved: false }, bpc: { at: T0, hash: 'x' } };
    incoming.comments = { 'REQ-A': [], 'REQ-B': [{ at: T0, by: 'bpc', text: 'Fake BPC comment' }] };
    const out = mergeForRole(stored, incoming, 'client');
    expect(out.reviews![docId].bpc).toEqual({ at: T0, hash: 'h1' });
    expect(out.reviews![docId].clarify).toEqual({ at: T0, text: 'Which regions?', resolved: false });
    expect(out.reviews!['P-NEW']).toBeUndefined();
    expect(out.comments).toEqual({ 'REQ-A': [{ at: T0, by: 'bpc', doc: docId, text: 'BPC note' }] });
  });

  it('may mark a clarification as answered, but not reopen or reword it', () => {
    const { p: stored, docId } = approvedByClient();
    stored.reviews![docId].clarify = { at: T0, text: 'Which regions?', resolved: false };
    const incoming = copy(stored);
    incoming.reviews![docId].clarify!.resolved = true;
    const out = mergeForRole(stored, incoming, 'client');
    expect(out.reviews![docId].clarify).toEqual({ at: T0, text: 'Which regions?', resolved: true });
    const back = copy(out);
    back.reviews![docId].clarify!.resolved = false;
    expect(mergeForRole(out, back, 'client').reviews![docId].clarify!.resolved).toBe(true);
  });

  it('approving again clears the old BPC approval, as the engine does', () => {
    const { p: stored, docId } = approvedByClient();
    stored.reviews![docId].bpc = { at: T0, hash: 'h1' };
    const incoming = copy(stored);
    incoming.reviews![docId].client = { at: '2026-10-01T09:00:00.000Z', hash: 'h2', text: 'new' };
    delete incoming.reviews![docId].bpc;
    const out = mergeForRole(stored, incoming, 'client');
    expect(out.reviews![docId].bpc).toBeUndefined();
    expect(out.reviews![docId].client!.hash).toBe('h2');
  });

  it('strips every BPC item from a brand-new project', () => {
    const p = demoProject(T0);
    p.reviews = { 'P-IDEA': { bpc: { at: T0, hash: 'x' }, clarify: { at: T0, text: 'q', resolved: false } } };
    p.comments = { X: [{ at: T0, by: 'bpc', text: 'no' }, { at: T0, by: 'client', text: 'yes' }] };
    const out = mergeForRole(null, p, 'client');
    expect(out.reviews).toEqual({});
    expect(out.comments).toEqual({ X: [{ at: T0, by: 'client', text: 'yes' }] });
  });

  it('treats an unknown comment author as the client', () => {
    const p = demoProject(T0);
    p.comments = { X: [{ at: T0, by: 'admin' as 'client', text: 'hi' }] };
    expect(mergeForRole(null, p, 'client').comments!.X[0].by).toBe('client');
  });
});

describe('mergeForRole: BPC reviewer saves', () => {
  it('can approve a client-approved document and comment, nothing else', () => {
    const { p: stored, docId } = approvedByClient();
    stored.comments = { 'REQ-A': [{ at: T0, by: 'client', doc: docId, text: 'client note' }] };
    const incoming = copy(stored);
    const d = Documents.documentSet(incoming, CTX).find((x) => x.id === docId)!;
    Documents.approve(incoming, d, 'bpc', '2026-10-01T09:00:00.000Z');
    Documents.comment(incoming, 'REQ-A', docId, 'bpc', 'BPC reply', '2026-10-01T09:01:00.000Z');
    incoming.name = 'Reviewer renamed it';
    incoming.description = 'Reviewer edit';
    incoming.tools = [];
    incoming.comments!['REQ-A'][0].text = 'rewritten client note';
    const out = mergeForRole(stored, incoming, 'bpc');
    expect(out.name).toBe(stored.name);
    expect(out.description).toBe(stored.description);
    expect(out.tools).toEqual(stored.tools);
    expect(out.reviews![docId].client).toEqual(stored.reviews![docId].client);
    expect(docState(out, docId)).toBe('bpc_approved');
    expect(out.comments!['REQ-A']).toEqual([
      { at: T0, by: 'client', doc: docId, text: 'client note' },
      { at: '2026-10-01T09:01:00.000Z', by: 'bpc', doc: docId, text: 'BPC reply' },
    ]);
  });

  it('cannot approve on the client’s behalf or approve what the client has not', () => {
    const stored = demoProject(T0);
    const incoming = copy(stored);
    incoming.reviews = { 'P-IDEA': { client: { at: T0, hash: 'x', text: 't' }, bpc: { at: T0, hash: 'x' } } };
    const out = mergeForRole(stored, incoming, 'bpc');
    expect(out.reviews!['P-IDEA']).toBeUndefined();
  });

  it('can ask for clarification; the client’s answer is not undone by a stale copy', () => {
    const { p: stored, docId } = approvedByClient();
    const asked = copy(stored);
    asked.reviews![docId].clarify = { at: T0, text: 'Which regions?', resolved: false };
    const afterAsk = mergeForRole(stored, asked, 'bpc');
    expect(afterAsk.reviews![docId].clarify).toEqual({ at: T0, text: 'Which regions?', resolved: false });
    const answered = copy(afterAsk);
    answered.reviews![docId].clarify!.resolved = true;
    const afterAnswer = mergeForRole(afterAsk, answered, 'client');
    expect(mergeForRole(afterAnswer, afterAsk, 'bpc').reviews![docId].clarify!.resolved).toBe(true);
  });

  it('cannot delete client comments or impersonate the client', () => {
    const stored = demoProject(T0);
    stored.comments = { A: [{ at: T0, by: 'client', text: 'keep me' }] };
    const incoming = copy(stored);
    incoming.comments = { A: [], B: [{ at: T0, by: 'client', text: 'forged client' }] };
    expect(mergeForRole(stored, incoming, 'bpc').comments).toEqual({ A: [{ at: T0, by: 'client', text: 'keep me' }] });
  });

  it('needs a stored project', () => {
    expect(() => mergeForRole(null, demoProject(T0), 'bpc')).toThrow();
  });
});
