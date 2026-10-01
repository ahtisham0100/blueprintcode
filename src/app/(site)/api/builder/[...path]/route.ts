/* /api/builder/* — Blueprint Builder's API (src/builder/api.ts). 404
   everywhere while BUILDER_PUBLIC is off. */

import { handleBuilderApi } from '@/builder/api';
import { apiDeps } from '@/builder/deps';
import { isBuilderPublic } from '@/lib/flags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: Request, { params }: Ctx): Promise<Response> {
  if (!isBuilderPublic()) return new Response('Not Found', { status: 404 });
  const { path } = await params;
  try {
    return await handleBuilderApi(req, path, apiDeps(req));
  } catch (e) {
    console.error('[builder] API error:', e);
    return Response.json({ error: 'Something went wrong on our side. Your work is still on this device.' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
