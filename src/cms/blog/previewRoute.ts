/* What /blog-preview/<id>?token=… should do. Pure apart from the injected
   loader, so the token rules are testable without Next or Payload. The
   page maps `forbidden` and `missing` both to the site's 404 (a page cannot
   send 403, and revealing that a draft exists is not wanted anyway). */

import { verifyPostPreviewToken } from './preview';

export type PreviewDecision<T> = { kind: 'forbidden' } | { kind: 'missing' } | { kind: 'ok'; post: T };

export async function resolvePreview<T>(args: {
  id: string;
  token: string | null | undefined;
  secret: string;
  load: (id: string) => Promise<T | null>;
  now?: number;
}): Promise<PreviewDecision<T>> {
  if (!/^\d+$/.test(args.id)) return { kind: 'missing' };
  if (!(await verifyPostPreviewToken(args.token ?? '', args.id, args.secret, { now: args.now }))) return { kind: 'forbidden' };
  const post = await args.load(args.id);
  return post ? { kind: 'ok', post } : { kind: 'missing' };
}

/** Response headers every preview carries (set in next.config for the page). */
export const PREVIEW_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } as const;
