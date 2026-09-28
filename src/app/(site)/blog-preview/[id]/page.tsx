/* /blog-preview/<id>?token=… — a post's latest draft, for editors. On the
   PUBLIC host (so it renders exactly as the live page will) with a
   30-minute token bound to this post (cms/blog/preview.ts). Not gated by
   BLOG_PUBLIC: writers need to see posts before launch. Never cached,
   never indexed (headers in next.config.ts; robots in metadata).
   Invalid/expired token → 403 (forbidden.tsx); valid token, missing post
   → the site's 404. */

import type { Metadata } from 'next';
import { forbidden, notFound } from 'next/navigation';
import { sessionSecret } from '@/cms/auth/session';
import { loadPostDraft } from '@/cms/blog/load';
import { postMetadata } from '@/cms/blog/metadata';
import { resolvePreview } from '@/cms/blog/previewRoute';
import '../../(content)/site.css';
import '../../blog/blog.css';
import { PostArticle } from '../../blog/ui';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

async function resolve(ctx: Ctx) {
  const [{ id }, { token }] = await Promise.all([ctx.params, ctx.searchParams]);
  return resolvePreview({ id, token, secret: sessionSecret(), load: (i) => loadPostDraft(i) });
}

export async function generateMetadata(ctx: Ctx): Promise<Metadata> {
  const r = await resolve(ctx);
  if (r.kind !== 'ok') return { robots: { index: false, follow: false } };
  return postMetadata(r.post, { preview: true });
}

export default async function BlogPreviewPage(ctx: Ctx) {
  const r = await resolve(ctx);
  if (r.kind === 'forbidden') forbidden();
  if (r.kind === 'missing') notFound();
  return (
    <main id="main" className="blog">
      <div className="preview-banner">
        <b>Preview</b> · {r.post._status === 'published' ? 'latest saved version' : 'draft'} — not public
      </div>
      <PostArticle post={r.post} preview />
    </main>
  );
}
