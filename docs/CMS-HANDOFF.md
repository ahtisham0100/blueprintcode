# Blueprint Code CMS — handoff (after Phase 5, Blog)

Read this whole file before writing any code. It is the single source of truth for
what exists, how it is built and tested, and what is next.
Last updated 2026-09-28 after Phase 5 shipped (blog built, **gated off in production by `BLOG_PUBLIC`**).

---

## 1. What this project is

`blueprintcode.ai` — a Next.js 16.3.4 (App Router, Turbopack) marketing site on
Vercel, with a Payload CMS 3.90.2 admin being built alongside the old `/admin`.
DNS is at GoDaddy, hosting on Vercel, database on Neon Postgres, media on
Cloudflare R2, email via Resend (not wired yet).

Three hosts, one Next app, split by `src/proxy.ts` and `next.config.ts`:

| Host | What | Notes |
|---|---|---|
| `blueprintcode.ai` | public site | `/cms` and `/api/cms` are 404 here |
| `admin.blueprintcode.ai` | Payload admin at `/cms`, API at `/api/cms` | everything else 301s to the main site; noindex |
| `media.blueprintcode.ai` | files from R2 via the `/media/[...key]` route | Vercel domain, host-rewritten in next.config |

Locally (one dev server, port 5000): **`http://localhost:5000` is the ADMIN host**
(`/cms`) because Google OAuth only accepts `http://localhost` as a redirect;
**the public site is `http://127.0.0.1:5000`**. Media is `http://localhost:5000/media/...`.

## 2. Phases

| # | Phase | Status |
|---|---|---|
| 1 | Admin host wiring (`proxy.ts`, `(site)`/`(cms)` route groups, Vitest) | done, prod |
| 2 | Payload + Google Workspace sign-in, roles, blueprint theme | done, prod |
| 3 | Media library on R2 (gallery, immutable keys, `/media` route) | done, prod |
| 4 | Demos (paste HTML → `/<slug>`, SEO, preview, redirects, dashboard, import script) | done, prod; **public exposure behind `CMS_PUBLIC` (off in prod)** |
| 5 | Blog (Posts/Categories/Authors, `/blog` + categories + RSS + sitemap, previews, insights import) | done, prod; **public exposure behind `BLOG_PUBLIC` (unset in prod)** — launch is the user's call, see §8 |
| **6** | Leads + replies inbox (Resend inbound on `reply.blueprintcode.ai`) | **next** |
| 7 | Email campaigns (Resend Broadcasts) | later |
| 8 | Ops: backups (pg_dump, R2→B2), Neon branch previews, audit log, rate limits | later |
| — | Switch-over: import demos to prod, `CMS_PUBLIC=on`, 301 `/admin`, retire static files + old uploader; wire `/prototypes` to `gallery.show`; `/insights/<slug>` → `/blog/<slug>` redirects (`redirectsForSwitchOver`) and drop `/insights` from the sitemap | later, user decides |

## 3. Repo map (what matters)

```
src/proxy.ts                        host split (admin vs public); pure rules in src/lib/adminHost.ts
src/lib/flags.ts                    isCmsPublic() (demos) and isBlogPublic() (blog) ← gates for anything CMS-driven on the public site
src/lib/seo.ts                      SITE_URL, JSON-LD helpers (org, website, BlogPosting, Blog, BreadcrumbList, jsonLdScript)
src/lib/staticDemos.ts              lists public/<slug>/index.html → next.config afterFiles rewrite
src/payload.config.ts               Payload config (routes /cms + /api/cms, cookiePrefix bpc, schema "cms", migrations, plugins)
src/payload-types.ts                GENERATED (`npm run generate:types`) — commit it after collection changes
src/cms/settings.ts                 CMS_ROUTES, CMS_COOKIE_PREFIX, CMS_DB_SCHEMA, cmsServerUrl(), publicSiteOrigin()
src/cms/branding.ts                 wordmark/theme facts
src/cms/auth/                       Google OIDC: google.ts, authorize.ts (domain + allowlist + active), handlers.ts (OAuth routes),
                                    session.ts (bpc-token HS256 cookie; sessionSecret() = raw PAYLOAD_SECRET), strategy.ts (Payload auth strategy), deps.ts
src/cms/collections/                Users (admin/writer, allowlist; canWrite, readPublishedOrEditor, hiddenFromWriters), Media (R2, sizes, gallery view),
                                    Demos, Redirects, Posts (Lexical editor, blocks, hooks), Categories, Authors
src/cms/fields/seo.ts               the SEO tab (seoPreviewField + seoGroupField) shared by Demos and Posts
src/cms/revalidate.ts               revalidateTargets(): revalidatePath wrapper (route patterns, quiet outside Next)
src/cms/blog/                       slug.ts (BLOG_RESERVED_SLUGS), blocks.ts (Callout, CTA, DemoEmbed, Code), readingTime.ts, revalidate.ts (planner),
                                    preview.ts (post token audience), previewRoute.ts, render.tsx (Lexical→React), renderHtml.ts (Lexical→HTML, feed),
                                    metadata.ts (Next Metadata), rss.ts, sitemap.ts, paginate.ts, format.ts, load.ts (Payload local API),
                                    htmlToLexical.ts + importInsights.ts (insights import), limits.ts
src/cms/media/                      keys.ts (allowlist, immutable names), serve.ts (/media response rules), storage.ts (R2 + move), hooks.ts, gallery.ts, urls.ts
src/cms/demos/                      slug.ts (RESERVED_SLUGS), html.ts (validate + extract), render.ts (SEO head + chrome), preview.ts (signed tokens),
                                    revalidate.ts (paths to revalidate / ping), redirects.ts, sitemap.ts, import.ts, load.ts (Payload local API), partials.ts
src/cms/components/                 admin UI: GoogleSignIn, Logo, Icon, LogoutAction, Dashboard, MediaGalleryView(+ .client), SeoPreview.client
src/cms/migrations/                 Payload migrations — the ONLY way schema changes reach any DB
src/app/(site)/                     public site (root layout with header/footer); [slug]/route.ts = CMS demos; demo-preview/[id]; media/[...key]; sitemap.ts; not-found-page;
                                    blog/ (page, [slug], page/[n], category/[slug](/page/[n]), feed.xml/route.ts, ui.tsx, blog.css); blog-preview/[id]; forbidden.tsx (403)
src/app/(cms)/                      Payload root layout, cms/[[...segments]], api/cms/[...slug], OAuth routes, custom.css (blueprint theme), importMap.js (GENERATED by dev server)
src/app/(site)/admin/, api/deploy-demo, api/demos, api/leads   OLD admin — do not touch until switch-over
scripts/lib/chrome.mjs              shared header/footer injection (used by scripts/inject-chrome.mjs at build AND by cms/demos/render.ts)
scripts/lib/indexnow.mjs            shared IndexNow submit (used by scripts/indexnow.mjs and the Demos publish hook)
scripts/db-guard.mjs                refuses DB-changing commands locally unless DATABASE_URL is the dev branch
scripts/seed-cms-admins.mjs         first admins; scripts/import-static-demos.ts (payload run); scripts/r2-sync.mjs
scripts/import-insights.ts          `npm run blog:import-insights` (IMPORT_DRY=1 to plan): /insights notes → draft posts + categories + authors
docs/CMS-HANDOFF.md                 this file
```

## 4. Conventions (follow these exactly)

- **Tests first.** Every pure module gets a `*.test.ts` beside it (Vitest, node env, `npm test`). Keep logic pure and inject I/O (see `serve.ts`, `handlers.ts`, `hooks.ts`). Current suite: 54 files / 310 tests, all green; keep it that way. Component tests render with `react-dom/server` in the node env (see `Dashboard.test.tsx`, `blog/render.test.tsx`).
- **Type-check** with `npx tsc --noEmit -p tsconfig.json` (ignore errors under `.next/` only if they are stale; a build regenerates them).
- **Build** with `npm run build` before committing anything that touches routing/config. Prebuild runs chrome injection + db-guard + `payload migrate`.
- **Schema changes = migrations.** `npm run migrate:create <name>` → review the file → `npm run migrate` (applies to the dev branch). Never rely on dev push (`push: false`). If Payload ever prompts about "dev mode … data loss", the dev DB was pushed: drop schema `cms`, `npm run migrate`, `npm run seed:admins`.
- **After collection changes:** `npm run generate:types` and commit `src/payload-types.ts`. The dev server regenerates `src/app/(cms)/cms/importMap.js` when you reference new components — commit it too.
- **Restart the dev server** after changing collection configs/hooks/strategies (Payload caches its instance; hot reload is not enough). Use the `bpcode-dev` launch config (`preview_start`), never `npm run dev` in a shell. Only one `next dev` can run per folder (Next 16 locks `.next/dev`); if another session holds it, verify against a production build instead: `npm run build`, then `next start -p 5001` with `PUBLIC_SITE_URL`/`CMS_SERVER_URL`/`MEDIA_PUBLIC_URL` pointed at 5001 (this also exercises real ISR + `revalidatePath`).
- **Commits:** small, one concern each, message explains why, end with the attribution line the session's system reminder specifies. `git fetch` + rebase before push — the old `/admin` uploader commits demo files to `main` from production. Never commit the 22 `public/*.html` files that `prebuild` stamps in the working tree.
- **Never touch production data from local.** `.env.local` points at the Neon `development` branch and the `cms-local-testing-bucket`; `db-guard` enforces it. `ALLOW_PROD_DB=1` only for a deliberate, user-approved one-off.
- **Public exposure of anything CMS-driven goes behind a flag** (`isCmsPublic()` for demos; `isBlogPublic()` for the blog) until the user launches it.
- **Pasted/raw HTML must never run on the admin origin.** That is why previews are served on the public host with a signed token.
- **Blueprint theme:** admin styling lives in `src/app/(cms)/custom.css` via Payload CSS variables (navy `#0B1A2E`, ink `#EAF1F8`, Bebas Neue titles, DM Mono labels, IBM Plex body, 2px radii). New admin components use the existing `.bpc-*` patterns.

## 5. Environment

`.env.local` (gitignored) has: `ADMIN_HOST=localhost`, `CMS_PUBLIC=on` (local testing only; `BLOG_PUBLIC` is not set — add `BLOG_PUBLIC=on` to test the public blog), `PAYLOAD_SECRET`,
`CMS_SERVER_URL=http://localhost:5000`, `CMS_ALLOWED_DOMAIN=blueprintcode.ai`, `GOOGLE_CLIENT_ID/SECRET`,
`DATABASE_URL` (Neon **development** branch, host `ep-jolly-union-za9a29lj…`), `DEV_DATABASE_HOST`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=cms-local-testing-bucket`,
`MEDIA_PUBLIC_URL=http://localhost:5000/media`, `PUBLIC_SITE_URL=http://127.0.0.1:5000`.
`.env.example` documents each. Production values are in Vercel (`CMS_PUBLIC=off` there; `BLOG_PUBLIC` unset = off).

Neon dev branch currently holds: 2 admin users (james@, hello@), ~22 media (incl. the two author portraits), 22 demos (21 imported static demos as drafts + one test demo),
1 redirect (Phase 4 test), and the blog: 4 draft posts imported from /insights, 4 categories (Cost & scope, Visual method, Strategy, Operator note),
2 authors (James Michaelson, Muhammad Ahtisham Arif). Production has the empty blog tables (migration `add_blog`) and no posts.

## 6. Testing the admin without Google (local)

Mint a session for user id 1 and use it as the `bpc-token` cookie:
```bash
node --env-file=.env.local --input-type=module -e "
import { SignJWT } from 'jose'; const now=Math.floor(Date.now()/1000);
process.stdout.write(await new SignJWT({ email:'james@blueprintcode.ai' }).setProtectedHeader({alg:'HS256',typ:'JWT'}).setSubject('1').setIssuer('bpc-cms').setAudience('bpc-cms-session').setIssuedAt(now).setExpirationTime(now+8*3600).sign(new TextEncoder().encode(process.env.PAYLOAD_SECRET)));"
```
- curl: `-H "Cookie: bpc-token=<token>"` against `http://localhost:5000/api/cms/...`
- browser pane: from a `/cms/login` page run `document.cookie='bpc-token=<token>; path=/; SameSite=Lax'` — **always with `path=/`** (a cookie without it lands on `/cms` and shadows the real one).
- A writer: create a `users` row with `role: 'writer'` as admin, then mint the same token with that id as `sub` (a writer cannot sign in with Google unless the email is real).
- Post preview token (audience `bpc-post-preview`, sub = post id; demos use `bpc-demo-preview`): same `SignJWT` with `.setAudience('bpc-post-preview').setSubject('<id>')` and no email → `http://127.0.0.1:5000/blog-preview/<id>?token=…`. Or copy the Preview button's link in the post editor.
- REST cheat sheet: `POST /api/cms/<collection>?draft=true` (draft), `PATCH /api/cms/<c>/<id>` with `{"_status":"published"}` (publish) or `{"_status":"draft"}` (unpublish — a plain update; `?draft=true` only saves a draft version and does NOT unpublish), `DELETE /api/cms/<c>/<id>`.
- Client uploads: `POST /api/cms/storage-s3-generate-signed-url` → `PUT` to the URL → `POST /api/cms/media` multipart with `_payload` + `file` JSON (see `src/cms/media/gallery.ts`).

## 7. Known gotchas (each cost real time)

- Payload's CLI needs `"type": "module"` in package.json; `payload run script.ts` executes the file (make it self-run) and drops extra argv (use env vars).
- `payload.secret` is a sha256-derived value; sessions sign/verify with the RAW `PAYLOAD_SECRET` via `sessionSecret()` — never mix.
- Underscore-prefixed folders under `app/` are private (unroutable). Route handlers' `notFound()` renders only the bare 404; the demo route fetches `/not-found-page` instead, with a loop guard.
- `req.url` in route handlers normalises to `localhost` in dev → use `PUBLIC_SITE_URL`/`SITE_URL` for self-fetches.
- The `afterFiles` static-demo rewrite runs BEFORE dynamic routes; it is generated from `public/*/index.html` so only real static demos are rewritten.
- The storage plugin stores browser uploads under the browser's filename in a `media/<uuid>/` folder; `hooks.ts` moves them to the immutable name after save. Admin thumbnails must include that folder.
- `payload migrate` output is verbose; the `add_*` migration for a new collection must be reviewed (the first one needed `CREATE SCHEMA`).
- Google Cloud OAuth "Internal" requires the project to live under the Workspace org.
- Next forbids `react-dom/server` in route handlers (build error). The RSS feed renders bodies with Payload's HTML converter (`blog/renderHtml.ts`); keep `render.tsx` (React) and `renderHtml.ts` (string) in step when adding a block.
- Route segment config must be a literal: `export const revalidate = 86400`, not an imported constant.
- `forbidden()` (403 from a page) needs `experimental.authInterrupts` (on in next.config) and renders `(site)/forbidden.tsx`.
- `chrome.css` styles every `footer` element (and hides it when embedded); page content must not use `<footer>`/`<header>` for its own parts.
- `React.cache` compares arguments by reference: cached loaders take primitives (`getPosts(page, categoryId)`), not objects.
- `revalidatePath` throws "static generation store missing" outside a Next request (CLI scripts); `revalidateTargets` ignores exactly that.
- The Lexical editor's text uses `--font-serif` (Georgia by default); `custom.css` maps it to Plex.
- The blog pages are prerendered at build time, so flipping `BLOG_PUBLIC` needs a redeploy (as with any Vercel env change). Draft previews are not gated.
- Hooks see relationship fields as ids at depth 0: the Posts revalidation hook looks the category slug up (`withCategorySlug`).
- A published post keeps showing as "Draft (has published version)" in the list after an autosave; that is Payload's normal state, the live version is unchanged.
- Payload's `convertHTMLToLexical` needs `jsdom` (not installed); the insights import uses its own small converter for the notes' markup.
- Production sitemap baseline is 41 URLs (the old uploader added `james-catalogue-demo` after Phase 4).


## 8. Phase 5 — Blog: what exists

**Collections** (`admin.group: 'Content'`; migration `20260928_083710_add_blog`):
- **Posts** — Content tab: title, slug (auto from title; blog reserved list `feed.xml`, `category`, `page`, …), excerpt (≤ 200), cover, body
  (Lexical: h2–h4, bold/italic/underline/strike/inline code, links incl. internal to posts, lists, quote, rule, **Media uploads with caption**,
  tables, and blocks **Callout**, **Call to action**, **Demo embed** (demo slug → iframe), **Code block**), category, author, publishedAt
  (stamped on first publish, editable), readingTime (computed on save, read-only). SEO tab: the shared `seo` group + live preview at `/blog/<slug>`.
  Drafts + autosave + scheduled publishing; Preview button → `/blog-preview/<id>?token=` on the public host.
  Access: create/update admin **or writer**, delete admin, read published (public) / everything (signed in).
  Hooks: readingTime + publishedAt (beforeChange); redirect row on rename of a published post (`/blog/old` → `/blog/new`);
  revalidation of the post, its category(ies), `/blog`, every listing page/category/post pattern, the feed and the sitemap; IndexNow in production.
- **Categories** (name, slug, description) and **Authors** (name, slug = About-page anchor, title, bio, avatar, links → schema.org sameAs):
  admin + writer create/update, admin delete, public read. Changes revalidate the listings.
- Writers: nav is Posts, Categories, Authors, Media (Demos, Redirects, Users are `hidden` for them and 404 in the admin; their API access is unchanged: denied).

**Public routes** (all `notFound()` / 404 while `BLOG_PUBLIC` is off, except the preview):
- `/blog`, `/blog/page/<n>` (12 per page, newest first), `/blog/category/<slug>` (+ `/page/<n>`); empty categories are noindexed.
- `/blog/<slug>` — cover, stamp (category · date · reading time), byline, body, share links, author box, prev/next; 308 via redirect rows.
- `/blog/feed.xml` — RSS 2.0 with full HTML (`content:encoded`), absolute links.
- Metadata: title, description, canonical, robots, OG article tags, Twitter card (large when there is a cover/SEO image);
  JSON-LD `BlogPosting` + `BreadcrumbList` on posts, `Blog` + `BreadcrumbList` on listings.
- Sitemap: `/blog`, extra index pages, categories with posts, posts (only when `BLOG_PUBLIC` is on; `/insights` stays until switch-over).
- `/blog-preview/<id>?token=` — latest draft, `no-store` + `noindex`; bad/expired token → **403** (`forbidden.tsx`), missing post → 404.
- All static + ISR (`revalidate = 86400` as a safety net); publish/rename/unpublish revalidate within seconds.

**Admin:** dashboard leads with a Blog posts panel (published/drafts/scheduled + recent) and "New post"; demos panel and CMS_PUBLIC line are
admin-only; site status shows BLOG_PUBLIC. The editor uses Plex with Bebas h2/h3.

**Insights import:** `npm run blog:import-insights` has been run on the dev branch (4 drafts). It has **not** been run on production.

**Verified** locally against a production build (`next start`): draft not public → preview 200 (+403/404 cases) → publish → post 200 with the
right head tags and JSON-LD → on `/blog`, category page, sitemap, feed → rename → old URL 308 → unpublish → custom 404 and gone from listings,
feed and sitemap; writer permissions via `/api/cms/access` and the admin UI; 1280×900 and 375px layouts (no horizontal overflow, 16px gutters);
with `BLOG_PUBLIC` unset every blog URL is 404 and the rest of the site is unchanged.

### Launching the blog (the user decides; not done)
1. In production, run the insights import once (`ALLOW_PROD_DB=1` with the production `DATABASE_URL`, deliberate one-off), or write posts in the admin.
2. Decide how the imported posts relate to `/insights` before publishing them: either do the `/insights/<slug>` → `/blog/<slug>` redirects at the same
   time (`redirectsForSwitchOver()` gives the rows; also remove the `/insights` entries from `sitemap.ts`), or keep `/insights` and leave the
   imported copies unpublished — publishing both without a redirect or canonical is duplicate content.
3. Publish the posts, set `BLOG_PUBLIC=on` in Vercel, redeploy, then check `/blog`, one post, the feed and the sitemap on production.
4. Consider adding "Blog" to the site header (`src/app/(site)/_chrome/`, `public/partials/site-header.html`) and linking the feed
   (`<link rel="alternate" type="application/rss+xml">`) in the root layout.

## 9. Next: Phase 6 (leads + replies inbox)
Not specified in detail yet. Scope from §2: Resend inbound on `reply.blueprintcode.ai`, leads from the contact form visible and answerable in the CMS
(today they live in `public.leads`, shown by the old `/admin/leads`). Follow §4: tests first, a reviewed migration, admin-only access unless the user
says otherwise, nothing public changes without a flag.
