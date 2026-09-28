/* Building blocks for the blog pages: cards, listing, pager, the post
   article with its byline/author box/share links/prev-next, and the JSON-LD
   script. Server components; the data comes from cms/blog/load.ts. */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Author, Category, Media, Post } from '@/payload-types';
import { humanDate, readLabel, rel, shareLinks, stampDate } from '@/cms/blog/format';
import { loadCategoriesInUse, loadCategory, loadPublishedPost, loadPublishedPosts } from '@/cms/blog/load';
import { postDescription, shareImage } from '@/cms/blog/metadata';
import { blogPageHref } from '@/cms/blog/paginate';
import { PostBody, imageSources } from '@/cms/blog/render';
import { BLOG_DESCRIPTION, BLOG_URL, SITE_URL, blogJsonLd, blogPostingJsonLd, breadcrumbListJsonLd, jsonLdScript } from '@/lib/seo';

/* ---- data helpers ------------------------------------------------------------ */

export { rel };

// Deduplicate the page's and generateMetadata's loads within one request.
export const getPost = cache(loadPublishedPost);
export const getCategory = cache(loadCategory);
/** One listing page; primitive args so React.cache dedupes across metadata and page. */
export const getPosts = cache((page: number, categoryId?: number) => loadPublishedPosts({ page, categoryId }));
export const getCategoriesInUse = cache(loadCategoriesInUse);

/* ---- small pieces ------------------------------------------------------------- */

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && (
            <span className="crumbs-sep" aria-hidden="true">
              /
            </span>
          )}
          {it.href ? <Link href={it.href}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
        </span>
      ))}
    </nav>
  );
}

function postStamp(post: Post): string {
  const cat = rel<Category>(post.category)?.name;
  return [cat?.toUpperCase(), stampDate(post.publishedAt), readLabel(post.readingTime)].filter(Boolean).join(' · ');
}

export function PostCard({ post }: { post: Post }) {
  const cover = rel<Media>(post.cover);
  const img = cover ? imageSources({ ...cover, sizes: cover.sizes ?? undefined }) : null;
  return (
    <article className="post-card">
      <Link href={`/blog/${post.slug}`}>
        <div className={`post-card__media${img ? '' : ' is-empty'}`} aria-hidden={!img}>
          {img ? <img src={cover?.sizes?.medium?.url ?? img.src} srcSet={img.srcSet} sizes="(max-width: 719px) 100vw, (max-width: 1039px) 50vw, 400px" alt="" loading="lazy" decoding="async" /> : <span>BPC</span>}
        </div>
        <span className="lbl">{postStamp(post)}</span>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="go">READ →</span>
      </Link>
    </article>
  );
}

export function Pager({ base, page, totalPages }: { base: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link href={blogPageHref(base, page - 1)}>← Newer</Link> : <span aria-disabled="true">← Newer</span>}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <Link href={blogPageHref(base, page + 1)}>Older →</Link> : <span aria-disabled="true">Older →</span>}
    </nav>
  );
}

export function CategoryNav({ categories, active, total }: { categories: { category: Category; count: number }[]; active?: string | null; total: number }) {
  if (!categories.length) return null;
  return (
    <nav className="blog-cats" aria-label="Categories">
      <Link href="/blog" aria-current={active ? undefined : 'page'}>
        All<small>{total}</small>
      </Link>
      {categories.map(({ category, count }) => (
        <Link key={category.id} href={`/blog/category/${category.slug}`} aria-current={active === category.slug ? 'page' : undefined}>
          {category.name}
          <small>{count}</small>
        </Link>
      ))}
    </nav>
  );
}

/* ---- the listing (index, page n, category, category page n) ------------------- */

export async function BlogListing({ page, category }: { page: number; category?: Category | null }) {
  const [result, cats] = await Promise.all([getPosts(page, category?.id), getCategoriesInUse()]);
  if (page > 1 && page > result.totalPages) notFound();
  const total = cats.reduce((n, c) => n + c.count, 0);
  const base = category ? `/blog/category/${category.slug}` : '/blog';
  const title = category ? category.name : 'Notes from the build.';
  const standfirst = category?.description || BLOG_DESCRIPTION;
  const crumbs = [{ name: 'Home', href: '/' }, category ? { name: 'Blog', href: '/blog' } : { name: 'Blog' }, ...(category ? [{ name: category.name }] : [])];
  const year = new Date().getUTCFullYear();

  return (
    <main id="main" className="blog">
      <JsonLd
        data={blogJsonLd(
          result.docs.map((p) => ({
            title: p.title,
            url: `${BLOG_URL}/${p.slug}`,
            description: postDescription(p) || null,
            datePublished: p.publishedAt,
            dateModified: p.updatedAt,
            category: rel<Category>(p.category)?.name,
            author: rel<Author>(p.author) ? { name: rel<Author>(p.author)!.name } : null,
          })),
        )}
      />
      <JsonLd data={breadcrumbListJsonLd(crumbs.map((c) => ({ name: c.name, url: c.href ? `${SITE_URL}${c.href === '/' ? '/' : c.href}` : `${SITE_URL}${base}` })))} />

      <div className="sheet title-block">
        <Crumbs items={crumbs} />
        <dl className="stamp">
          <div className="row">
            <dt>SERIES</dt>
            <dd>Blog — notes from the build</dd>
          </div>
          <div className="row">
            <dt>DISCIPLINE</dt>
            <dd>Interactive commerce</dd>
          </div>
          <div className="row">
            <dt>ENTRIES</dt>
            <dd>
              {result.totalDocs} published{category ? ` in ${category.name}` : ''}
            </dd>
          </div>
          <div className="row">
            <dt>ISSUE</dt>
            <dd>{year}</dd>
          </div>
        </dl>
        <h1>{title}</h1>
        <p className="standfirst">{standfirst}</p>
      </div>

      <section className="blog-index" id="index">
        <div className="sheet">
          <p className="sheet-no">
            INDEX — {result.totalDocs} {result.totalDocs === 1 ? 'ENTRY' : 'ENTRIES'}
            {result.totalPages > 1 ? ` · PAGE ${page} OF ${result.totalPages}` : ''}
          </p>
          <CategoryNav categories={cats} active={category?.slug} total={total} />
          {result.docs.length ? (
            <div className="post-grid">
              {result.docs.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="post-empty">Nothing published here yet.</p>
          )}
          <Pager base={base} page={page} totalPages={result.totalPages} />
        </div>
      </section>

      <section className="close" id="contact">
        <div className="sheet">
          <p className="sheet-no">START HERE</p>
          <h2>What is your product making customers work too hard to understand?</h2>
          <p>Prove the difficult part first, in a focused Prototype Sprint — £625 to £3,000 + VAT, credited in full against the build.</p>
          <div className="actions">
            <a className="button solid" href="/contact">
              Discuss your project
            </a>
            <a className="button" href="/configurators">
              What we build
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---- the post ------------------------------------------------------------------- */

export function authorPerson(author: Author | null) {
  if (!author) return null;
  const avatar = rel<Media>(author.avatar);
  return {
    name: author.name,
    jobTitle: author.title,
    url: `${SITE_URL}/about#${author.slug}`,
    image: avatar?.url ?? null,
    sameAs: (author.links ?? []).map((l) => l.url),
  };
}

export function PostArticle({ post, prev, next, preview = false }: { post: Post; prev?: Post | null; next?: Post | null; preview?: boolean }) {
  const url = `${BLOG_URL}/${post.slug}`;
  const category = rel<Category>(post.category);
  const author = rel<Author>(post.author);
  const avatar = rel<Media>(author?.avatar);
  const cover = rel<Media>(post.cover);
  const coverImg = cover ? imageSources({ ...cover, sizes: cover.sizes ?? undefined }) : null;
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, ...(category ? [{ name: category.name, href: `/blog/category/${category.slug}` }] : []), { name: post.title }];

  return (
    <article className="post">
      {!preview && (
        <>
          <JsonLd
            data={blogPostingJsonLd({
              title: post.title,
              url,
              description: postDescription(post) || null,
              datePublished: post.publishedAt,
              dateModified: post.updatedAt,
              image: shareImage(post)?.url ?? null,
              author: authorPerson(author),
              category: category?.name ?? null,
            })}
          />
          <JsonLd data={breadcrumbListJsonLd(crumbs.map((c) => ({ name: c.name, url: c.href ? `${SITE_URL}${c.href === '/' ? '/' : c.href}` : url })))} />
        </>
      )}

      <div className="sheet post-head">
        <Crumbs items={crumbs} />
        <span className="lbl">{postStamp(post)}</span>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="standfirst">{post.excerpt}</p>}
        <div className="byline">
          {avatar?.url && <img src={avatar.sizes?.thumb?.url ?? avatar.url} alt="" width={40} height={40} />}
          <div>
            {author ? <b>{author.name}</b> : <b>Blueprint Code AI</b>}
            <span>
              {author?.title ? `${author.title} · ` : ''}
              {post.publishedAt ? `Published ${humanDate(post.publishedAt)}` : 'Draft'}
              {post.updatedAt && post.publishedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) ? ` · Updated ${humanDate(post.updatedAt)}` : ''}
            </span>
          </div>
        </div>
      </div>

      {coverImg && (
        <div className="sheet post-cover">
          <figure className="media">
            <i />
            <i />
            <i />
            <i />
            <img src={coverImg.src} srcSet={coverImg.srcSet} sizes="(max-width: 1240px) 100vw, 1240px" alt={cover?.alt ?? ''} width={coverImg.width} height={coverImg.height} fetchPriority="high" decoding="async" />
          </figure>
          {cover?.caption && <figcaption className="media-caption sheet">{cover.caption}</figcaption>}
        </div>
      )}

      <div className="post-body">
        <div className="inner">
          <PostBody data={post.body} />
        </div>
      </div>

      <div className="sheet post-foot">
        <div className="post-share">
          <span>Share</span>
          {shareLinks(url, post.title).map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>

        {author && (
          <div className="author-box">
            {avatar?.url ? <img src={avatar.sizes?.thumb?.url ?? avatar.url} alt="" width={64} height={64} /> : <span />}
            <div>
              <span className="lbl">WRITTEN BY</span>
              <h3>{author.name}</h3>
              {author.title && <div className="role">{author.title}</div>}
              {author.bio && <p>{author.bio}</p>}
              {author.links && author.links.length > 0 && (
                <div className="links">
                  {author.links.map((l) => (
                    <a key={l.id ?? l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!preview && (prev || next) && (
          <nav className="post-nav" aria-label="More posts">
            {next ? (
              <Link href={`/blog/${next.slug}`}>
                <span className="lbl">← NEWER</span>
                <b>{next.title}</b>
              </Link>
            ) : (
              <Link href="/blog" className="post-nav__empty">
                <span className="lbl">← NEWER</span>
                <b>You are reading the latest</b>
              </Link>
            )}
            {prev ? (
              <Link href={`/blog/${prev.slug}`}>
                <span className="lbl">OLDER →</span>
                <b>{prev.title}</b>
              </Link>
            ) : (
              <Link href="/blog" className="post-nav__empty">
                <span className="lbl">ALL POSTS →</span>
                <b>Back to the index</b>
              </Link>
            )}
          </nav>
        )}
      </div>
    </article>
  );
}
