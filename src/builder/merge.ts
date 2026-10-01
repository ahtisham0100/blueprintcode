/* Who may change what in a saved project. The browser sends the whole
   project; the server keeps the parts the sender's role does not own from
   the stored copy, so nobody can forge the other side's decisions.

   Client (signed in by magic link) owns: every answer, tool, rule and
   connection; its own approvals (reviews[doc].client); its own comments;
   marking a clarification as answered. It can never create, change or
   delete a BPC approval, a clarification request or a BPC comment, with one
   exception the engine itself makes: approving a document again clears the
   earlier BPC approval, because BPC must look at the new wording.

   BPC reviewer (a review session opened from the CMS) owns: BPC approvals,
   clarification requests and BPC comments. Everything else comes from the
   stored copy. */

import type { BuilderProject, ProjectComment, ProjectReview } from './engines';

export type Role = 'client' | 'bpc';

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const commentKey = (c: ProjectComment) => JSON.stringify([c.at, c.doc ?? null, c.text]);

function isComment(c: unknown): c is ProjectComment {
  const x = c as ProjectComment;
  return !!x && typeof x === 'object' && typeof x.at === 'string' && typeof x.text === 'string';
}

function keys(...objs: (object | undefined)[]): string[] {
  return [...new Set(objs.flatMap((o) => (o ? Object.keys(o) : [])))];
}

export function mergeForRole(stored: BuilderProject | null, incoming: BuilderProject, role: Role): BuilderProject {
  if (role === 'bpc') {
    if (!stored) throw new Error('A reviewer can only change an existing project.');
    return mergeReviewer(stored, incoming);
  }
  return mergeClient(stored, incoming);
}

function mergeClient(stored: BuilderProject | null, incoming: BuilderProject): BuilderProject {
  const out = clone(incoming);
  const sReviews = stored?.reviews ?? {};
  const iReviews = incoming.reviews ?? {};
  const reviews: Record<string, ProjectReview> = {};
  for (const id of keys(sReviews, iReviews)) {
    const s = sReviews[id] ?? {};
    const i = iReviews[id] ?? {};
    const r: ProjectReview = {};
    if (i.client) r.client = clone(i.client);
    const reapproved = !!i.client && !same(i.client, s.client);
    // BPC approval: kept as stored; dropped only when the client approved again.
    if (s.bpc && !reapproved) r.bpc = clone(s.bpc);
    // Clarification: BPC's request, as stored; the client may only mark it answered.
    if (s.clarify) r.clarify = { ...clone(s.clarify), resolved: !!s.clarify.resolved || i.clarify?.resolved === true || reapproved };
    if (Object.keys(r).length) reviews[id] = r;
  }
  out.reviews = reviews;
  out.comments = mergeComments(stored?.comments, incoming.comments, 'client');
  return out;
}

function mergeReviewer(stored: BuilderProject, incoming: BuilderProject): BuilderProject {
  const out = clone(stored);
  const sReviews = stored.reviews ?? {};
  const iReviews = incoming.reviews ?? {};
  const reviews: Record<string, ProjectReview> = {};
  for (const id of keys(sReviews, iReviews)) {
    const s = sReviews[id] ?? {};
    const i = iReviews[id] ?? {};
    const r: ProjectReview = {};
    if (s.client) r.client = clone(s.client);
    // BPC can only approve what the client approved.
    if (i.bpc && s.client && typeof i.bpc.hash === 'string' && typeof i.bpc.at === 'string') r.bpc = { at: i.bpc.at, hash: i.bpc.hash };
    const c = i.clarify ?? s.clarify;
    if (c && typeof c.text === 'string' && typeof c.at === 'string') {
      // Once the client has answered, the reviewer's stale copy can't reopen it; a new request can.
      const resolved = same(c.text, s.clarify?.text) && same(c.at, s.clarify?.at) ? !!s.clarify?.resolved || !!c.resolved : !!c.resolved;
      r.clarify = { at: c.at, text: c.text, resolved };
    }
    if (Object.keys(r).length) reviews[id] = r;
  }
  out.reviews = reviews;
  out.comments = mergeComments(stored.comments, incoming.comments, 'bpc');
  if (Array.isArray(incoming.events)) out.events = clone(incoming.events).slice(0, 500);
  out.version = Math.max(Number(stored.version) || 1, Number(incoming.version) || 1);
  if (typeof incoming.updated === 'string') out.updated = incoming.updated;
  return out;
}

/** Comments the role owns come from `incoming` (so it can add them, and a
 *  client can remove its own); the other side's come from `stored` only. */
function mergeComments(
  stored: Record<string, ProjectComment[]> | undefined,
  incoming: Record<string, ProjectComment[]> | undefined,
  role: Role,
): Record<string, ProjectComment[]> {
  const out: Record<string, ProjectComment[]> = {};
  for (const item of keys(stored, incoming)) {
    const theirs = (stored?.[item] ?? []).filter((c) => isComment(c) && (c.by === 'bpc') !== (role === 'bpc'));
    const mine = (incoming?.[item] ?? [])
      .filter(isComment)
      .filter((c) => (role === 'bpc' ? c.by === 'bpc' : c.by !== 'bpc'))
      .map((c) => ({ at: c.at, by: role, ...(c.doc !== undefined ? { doc: String(c.doc) } : {}), text: c.text }) as ProjectComment);
    // A reviewer keeps every BPC comment already stored, even if its copy lacks one.
    const kept = role === 'bpc' ? [...(stored?.[item] ?? []).filter((c) => isComment(c) && c.by === 'bpc'), ...mine] : mine;
    const seen = new Set<string>();
    const all = [...theirs, ...kept]
      .filter((c) => {
        const k = c.by + commentKey(c);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    if (all.length) out[item] = clone(all);
  }
  return out;
}
