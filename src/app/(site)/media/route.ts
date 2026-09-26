/* /media with no key — the bare root of media.<domain> after the host
   rewrite. A file host has nothing to show here. */

import { mediaHostSpecialResponse } from '@/cms/media/serve';

export const dynamic = 'force-dynamic';

export function GET() {
  return mediaHostSpecialResponse('')!;
}

export const HEAD = GET;
