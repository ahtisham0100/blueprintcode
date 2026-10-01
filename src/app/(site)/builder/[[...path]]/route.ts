/* /builder, /builder/sign-in and /builder/review — Blueprint Builder's pages
   on the public host (src/builder/pages.ts). 404 while BUILDER_PUBLIC is off. */

import { pageDeps } from '@/builder/deps';
import { handleBuilderPage } from '@/builder/pages';
import { isBuilderPublic } from '@/lib/flags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, { params }: Ctx): Promise<Response> {
  if (!isBuilderPublic()) return new Response('Not Found', { status: 404 });
  const { path } = await params;
  return handleBuilderPage(req, path ?? [], pageDeps());
}
