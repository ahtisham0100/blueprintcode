/* GET /medusa-partner — the Medusa Heads × Instantly partnership proposal:
   three panels (the path, the Hunt, the ecosystem) and the "Sign NDA & Enter" gate (src/medusa/). A
   private pitch page: reachable by link, noindex, not in the sitemap. */

import { PRIVATE_HTML_HEADERS, partnershipHtml } from '@/medusa/pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return new Response(partnershipHtml(), { headers: PRIVATE_HTML_HEADERS });
}
