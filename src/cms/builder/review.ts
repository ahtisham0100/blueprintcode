/* GET /api/cms/builder-review/<project id> on the admin host: a signed-in CMS
   admin is sent to the PUBLIC site with a 5-minute link that opens a BPC
   review session for that one project (src/builder/pages.ts). The builder
   never runs on the admin host, and the admin's CMS cookie never reaches the
   public site: only the short link crosses over. */

import type { Endpoint, PayloadRequest } from 'payload';
import { signReviewLink } from '@/builder/auth/session';
import { BUILDER_PATH, builderSecret } from '@/builder/settings';
import { CMS_ROUTES, cmsServerUrl, publicSiteOrigin } from '../settings';

export type ReviewUser = { email?: string; role?: string } | null | undefined;

export type ReviewDecision =
  | { kind: 'login'; to: string }
  | { kind: 'forbidden' }
  | { kind: 'notFound' }
  | { kind: 'redirect'; to: string };

export async function decideReview(o: {
  user: ReviewUser;
  id: unknown;
  projectExists: (id: string) => Promise<boolean>;
  secret: string;
  siteOrigin: string;
  cmsOrigin: string;
}): Promise<ReviewDecision> {
  if (!o.user?.email) return { kind: 'login', to: `${o.cmsOrigin}${CMS_ROUTES.admin}/login` };
  if (o.user.role !== 'admin') return { kind: 'forbidden' };
  if (typeof o.id !== 'string' || !/^BP-[A-Z2-9]{10}$/.test(o.id) || !(await o.projectExists(o.id))) return { kind: 'notFound' };
  const token = await signReviewLink({ projectId: o.id, email: o.user.email }, o.secret);
  return { kind: 'redirect', to: `${o.siteOrigin}${BUILDER_PATH}/review?token=${token}` };
}

export const builderReviewEndpoint: Endpoint = {
  path: '/builder-review/:id',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { builderStore } = await import('@/builder/deps');
    const d = await decideReview({
      user: req.user as ReviewUser,
      id: req.routeParams?.id,
      projectExists: async (id) => !!(await builderStore().getProject(id)),
      secret: builderSecret(),
      siteOrigin: publicSiteOrigin(),
      cmsOrigin: cmsServerUrl(),
    });
    const headers = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
    if (d.kind === 'login' || d.kind === 'redirect') return new Response(null, { status: 302, headers: { ...headers, location: d.to } });
    if (d.kind === 'forbidden') return new Response('Only CMS admins can review Blueprint Builder projects.', { status: 403, headers });
    return new Response('Project not found.', { status: 404, headers });
  },
};
