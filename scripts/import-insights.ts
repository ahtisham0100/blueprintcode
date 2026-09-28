/* Import the legacy /insights field notes (src/app/(site)/(content)/insights/
 * notes.tsx) into the blog as DRAFT posts with their original publish dates,
 * plus their categories and authors. Nothing changes publicly: /insights
 * keeps serving, the blog is gated by BLOG_PUBLIC, and each post goes live
 * only when someone publishes it. The /insights → /blog redirects are added
 * at switch-over, not here.
 *
 *   npm run blog:import-insights                # plan + import (skips slugs already in the CMS)
 *   IMPORT_DRY=1 npm run blog:import-insights   # plan only (payload's CLI drops extra argv)
 *
 * Runs through Payload's CLI so it has the local API and the TypeScript
 * helpers; guarded by scripts/db-guard.mjs like every DB-changing command. */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { getPayload, type Payload } from 'payload';
import { AUTHORS, NOTES } from '../src/app/(site)/(content)/insights/notes';
import { authorPlan, planInsightPost } from '../src/cms/blog/importInsights';
import config from '../src/payload.config';

async function findOrCreate<T extends { id: number }>(payload: Payload, collection: 'categories' | 'authors', slug: string, data: Record<string, unknown>, dry: boolean): Promise<T | null> {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  if (found.docs[0]) return found.docs[0] as unknown as T;
  console.log(`${dry ? 'plan   ' : 'create '} ${collection === 'categories' ? 'category' : 'author'} "${data.name}" (${slug})`);
  if (dry) return null;
  return (await payload.create({ collection, data: { ...data, slug } as never, overrideAccess: true })) as unknown as T;
}

async function uploadAvatar(payload: Payload, imagePath: string, alt: string): Promise<number | undefined> {
  const file = path.join(process.cwd(), 'public', imagePath);
  if (!existsSync(file)) return undefined;
  const existing = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.docs[0]) return existing.docs[0].id as number;
  try {
    const doc = await payload.create({ collection: 'media', data: { alt }, filePath: file, overrideAccess: true });
    return doc.id as number;
  } catch (err) {
    console.warn(`        avatar upload failed for ${imagePath}: ${String(err)}`);
    return undefined;
  }
}

export const script = async (payload: Payload) => {
  const dry = process.env.IMPORT_DRY === '1';
  const existing = new Set(
    (await payload.find({ collection: 'posts', limit: 1000, depth: 0, overrideAccess: true, draft: true })).docs.map((d) => (d as { slug: string }).slug),
  );

  // Authors first, from the profiles the /insights pages already publish as schema.org Person.
  const authorIds = new Map<string, number>();
  for (const a of Object.values(AUTHORS)) {
    const plan = authorPlan(a);
    const avatar = !dry && plan.imagePath ? await uploadAvatar(payload, plan.imagePath, `${plan.name}, portrait`) : undefined;
    const doc = await findOrCreate<{ id: number }>(payload, 'authors', plan.slug, { name: plan.name, title: plan.title, links: plan.links, ...(avatar ? { avatar } : {}) }, dry);
    if (doc) authorIds.set(plan.name, doc.id);
  }

  let created = 0;
  for (const note of NOTES) {
    const html = renderToStaticMarkup(note.content);
    const plan = planInsightPost(note, html);
    if ('skipped' in plan) {
      console.log(`skip    ${note.slug}: ${plan.skipped}`);
      continue;
    }
    if (existing.has(plan.slug)) {
      console.log(`exists  ${plan.slug}`);
      continue;
    }
    const category = await findOrCreate<{ id: number }>(payload, 'categories', plan.category.slug, { name: plan.category.name }, dry);
    console.log(
      `${dry ? 'plan   ' : 'import '} ${plan.slug}  "${plan.title}"  ${plan.publishedAt.slice(0, 10)} · ${plan.category.name} · ${plan.authorName} · ${plan.readingTime} min · ${plan.body.root.children.length} blocks` +
        (plan.notes.length ? `\n          - ${plan.notes.join('\n          - ')}` : ''),
    );
    if (dry) continue;
    await payload.create({
      collection: 'posts',
      draft: true,
      overrideAccess: true,
      data: {
        title: plan.title,
        slug: plan.slug,
        excerpt: plan.excerpt,
        body: plan.body as never,
        publishedAt: plan.publishedAt,
        category: category?.id,
        author: authorIds.get(plan.authorName),
        seo: plan.seo,
        _status: 'draft',
      },
    });
    created++;
  }
  console.log(`\n${NOTES.length} note(s); ${created} imported as drafts, ${existing.size} post(s) already present.`);
};

// `payload run` executes this file with the environment loaded.
const payload = await getPayload({ config });
await script(payload);
process.exit(0);
