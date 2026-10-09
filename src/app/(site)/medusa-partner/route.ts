/* GET /medusa-partner — the Medusa Heads partnership proposal: three panels
   (the path, the Hunt, the ecosystem) behind the NDA gate (src/medusa/). A
   private pitch page: reachable by link, noindex, not in the sitemap.

   Without a valid NDA session the panels stay hidden and only the gate shows;
   with one (the room cookie, set once an access code is entered) the page is
   served unlocked and the last panel links straight to the partner room. */

import { NDA_COOKIE, ndaSecret, readCookie, verifyNdaSession } from '@/medusa/nda';
import { PRIVATE_HTML_HEADERS, partnershipHtml } from '@/medusa/pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const session = await verifyNdaSession(readCookie(req.headers.get('cookie'), NDA_COOKIE), ndaSecret());
  const html = partnershipHtml();
  return new Response(session ? html.replace('<html lang="en">', '<html lang="en" data-nda="ok">') : html, {
    headers: PRIVATE_HTML_HEADERS,
  });
}
