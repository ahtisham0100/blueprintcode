/* Reads demos for the public routes through Payload's local API. */

import config from '@payload-config';
import { getPayload } from 'payload';
import type { DemoForRender } from './render';

type Doc = DemoForRender & { id: number | string; _status?: string | null };

/** The published demo at /<slug>, or null. */
export async function loadPublishedDemo(slug: string): Promise<Doc | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'demos',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  return (docs[0] as Doc | undefined) ?? null;
}

/** Latest version (draft or published) of a demo by id, for previews. */
export async function loadDemoDraft(id: string | number): Promise<Doc | null> {
  const payload = await getPayload({ config });
  try {
    const doc = await payload.findByID({ collection: 'demos', id, depth: 1, draft: true, overrideAccess: true });
    return (doc as Doc | null) ?? null;
  } catch {
    return null;
  }
}

/** A redirect row for a site path ("/old-slug"), or null. */
export async function loadRedirect(fromPath: string): Promise<{ to: string; permanent: boolean } | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: 'redirects', where: { from: { equals: fromPath } }, limit: 1, overrideAccess: true });
  const r = docs[0] as { to?: string; permanent?: boolean | null } | undefined;
  return r?.to ? { to: r.to, permanent: r.permanent !== false } : null;
}
