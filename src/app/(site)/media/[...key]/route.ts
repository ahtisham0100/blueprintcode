/* GET/HEAD /media/<key> — public media from the private R2 bucket.
   In production next.config rewrites media.<domain>/<key> here. */

import type { NextRequest } from 'next/server';
import { mediaHostSpecialResponse, serveMedia } from '@/cms/media/serve';
import { r2ObjectStore } from '@/cms/media/storage';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string[] }> };

// Lazy: the key is validated (and bad ones rejected) before any R2 config
// is read, so a misconfigured environment fails only on real lookups.
const lazyStore = { get: (key: string, range?: string) => r2ObjectStore().get(key, range) };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { key } = await params;
  const joined = key.join('/');
  const special = mediaHostSpecialResponse(joined);
  if (special) return special;
  try {
    return await serveMedia(req, joined, lazyStore);
  } catch (err) {
    if (err instanceof Error && /^R2_[A-Z_]+ is not set$/.test(err.message)) {
      return new Response('Media storage is not configured', { status: 503, headers: { 'cache-control': 'no-store' } });
    }
    throw err;
  }
}

export const HEAD = GET;
