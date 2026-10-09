/* GET /medusa-partner/partner-room — the confidential partner brief. Served
   only with a valid NDA cookie (set by POST /api/medusa-partner/nda);
   otherwise the visitor is sent back to the proposal with the gate open. */

import { NDA_COOKIE, PARTNERSHIP_PATH, ndaSecret, readCookie, verifyNdaSession } from '@/medusa/nda';
import { PRIVATE_HTML_HEADERS, partnerRoomHtml } from '@/medusa/pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const token = readCookie(req.headers.get('cookie'), NDA_COOKIE);
  const session = await verifyNdaSession(token, ndaSecret());
  if (!session) {
    const to = new URL(`${PARTNERSHIP_PATH}?nda=required`, req.url);
    return new Response(null, { status: 303, headers: { location: to.toString(), 'cache-control': 'private, no-store' } });
  }
  return new Response(partnerRoomHtml(), { headers: PRIVATE_HTML_HEADERS });
}
