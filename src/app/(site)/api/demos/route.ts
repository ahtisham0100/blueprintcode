import { NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';
import { repoConfig, listDemos, deleteDemo, GitHubError, type RepoConfig } from '@/lib/github';

/* Admin-only: the other half of /api/deploy-demo.

   GET     list every demo currently published from the repo (public/<slug>/index.html
           served at /<slug>, plus the loose public/demos/*.html pages).
   DELETE  remove one of them — every file of it, in a single commit, which
           unpublishes it on the next deploy.

   Same single-password model as /api/deploy-demo and /api/leads: checked here,
   server-side, with the password in the `x-admin-password` header so it never
   lands in a URL. /admin/demos is a public shell; nothing is listed or deleted
   without the password. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Shared preamble: password check plus repo config, or the response to send back. */
function authorise(req: Request): { cfg: RepoConfig } | { error: NextResponse } {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: NextResponse.json({ error: 'Server not configured — set ADMIN_PASSWORD.' }, { status: 500 }) };
  }
  if (!checkAdminPassword(req.headers.get('x-admin-password') || '')) {
    return { error: NextResponse.json({ error: 'Wrong password.' }, { status: 401 }) };
  }
  const cfg = repoConfig();
  if (!cfg) {
    return { error: NextResponse.json({ error: 'Server not configured — set GITHUB_TOKEN.' }, { status: 500 }) };
  }
  return { cfg };
}

function upstreamError(e: unknown, what: string): NextResponse {
  if (e instanceof GitHubError) {
    return NextResponse.json({ error: `GitHub ${what} failed (${e.status}).`, detail: e.detail }, { status: 502 });
  }
  return NextResponse.json({ error: `Could not reach GitHub.`, detail: String(e).slice(0, 200) }, { status: 502 });
}

export async function GET(req: Request) {
  const gate = authorise(req);
  if ('error' in gate) return gate.error;

  try {
    const demos = await listDemos(gate.cfg);
    return NextResponse.json({
      ok: true,
      branch: gate.cfg.branch,
      repo: gate.cfg.repo,
      // `paths` is an internal detail of the delete; the UI only needs the shape.
      demos: demos.map(({ id, url, kind, bytes, paths }) => ({ id, url, kind, bytes, files: paths.length })),
    });
  } catch (e) {
    console.error('[demos] list failed:', e);
    return upstreamError(e, 'read');
  }
}

export async function DELETE(req: Request) {
  const gate = authorise(req);
  if ('error' in gate) return gate.error;

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) return NextResponse.json({ error: 'No demo specified.' }, { status: 400 });

  try {
    // Resolve against the live listing rather than trusting the id: only a path
    // this endpoint would itself have listed as a demo can ever be deleted.
    const demos = await listDemos(gate.cfg);
    const demo = demos.find((d) => d.id === id);
    if (!demo) {
      return NextResponse.json({ error: `No such demo: ${id}. It may already be deleted.` }, { status: 404 });
    }

    const commit = await deleteDemo(gate.cfg, demo);
    return NextResponse.json({ ok: true, id: demo.id, files: demo.paths.length, commit });
  } catch (e) {
    console.error('[demos] delete failed:', e);
    return upstreamError(e, 'write');
  }
}
