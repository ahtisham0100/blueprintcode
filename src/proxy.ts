import { NextResponse, type NextRequest } from 'next/server';
import { adminResponseHeaders, parseAdminHosts, resolveAdminRequest } from '@/lib/adminHost';
import { SITE_URL } from '@/lib/seo';

// Splits admin.<domain> from the public site. See src/lib/adminHost.ts for the
// rules; this file only maps decisions onto NextResponse. Runs before the
// filesystem routes and next.config rewrites, so a /cms rewrite here wins over
// the /:slug demo rewrite.
//
// Proxy is a fast first gate, not the auth boundary: every CMS page and API
// still verifies the session itself.

const adminHosts = parseAdminHosts(process.env.ADMIN_HOST);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const decision = resolveAdminRequest({
    host: request.headers.get('host') ?? '',
    pathname,
    search,
    adminHosts,
    siteUrl: SITE_URL,
  });

  switch (decision.kind) {
    case 'notFound':
      return new NextResponse('Not Found', { status: 404 });
    case 'redirect':
      return NextResponse.redirect(decision.to, decision.status);
    case 'rewrite':
      return withAdminHeaders(NextResponse.rewrite(new URL(decision.to, request.url)));
    case 'next': {
      const res = NextResponse.next();
      // Only admin-host requests reach 'next' with a CMS path or via the
      // admin host itself; the main site is left completely untouched.
      return adminHosts.includes(hostOf(request)) ? withAdminHeaders(res) : res;
    }
  }
}

function hostOf(request: NextRequest): string {
  return (request.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
}

function withAdminHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(adminResponseHeaders())) res.headers.set(k, v);
  return res;
}

export const config = {
  // Skip Next internals and any file with an extension (public/ assets, demo
  // media, favicons). robots.txt is the one file the admin host must handle.
  matcher: ['/((?!_next/|.*\\.(?!txt$)[a-zA-Z0-9]+$).*)'],
};
