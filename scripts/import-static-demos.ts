/* Import the legacy static demos (public/<slug>/index.html) into the CMS as
 * DRAFTS. Nothing changes publicly: the static files keep serving, and each
 * imported demo goes live only when an admin publishes it (and, until
 * switch-over, only where no static file of the same slug exists).
 *
 *   npm run demos:import                # plan + import (skips slugs already in the CMS)
 *   IMPORT_DRY=1 npm run demos:import   # plan only (payload's CLI drops extra argv, so an env var)
 *
 * Runs through Payload's CLI so it has the local API and the TypeScript
 * helpers; guarded by scripts/db-guard.mjs like every DB-changing command. */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import { planImport } from '../src/cms/demos/import';
import { listStaticDemoSlugs } from '../src/lib/staticDemos';
import config from '../src/payload.config';

const SITE_URL = 'https://blueprintcode.ai';

export const script = async (payload: Payload) => {
  const dry = process.env.IMPORT_DRY === '1';
  const publicDir = path.join(process.cwd(), 'public');
  const slugs = listStaticDemoSlugs(publicDir);
  const existing = new Set(
    (await payload.find({ collection: 'demos', limit: 500, depth: 0, overrideAccess: true, draft: true })).docs.map((d) => (d as { slug: string }).slug),
  );

  let created = 0;
  for (const slug of slugs) {
    const html = readFileSync(path.join(publicDir, slug, 'index.html'), 'utf8');
    const plan = planImport({ slug, html }, SITE_URL);
    if ('skipped' in plan) {
      console.log(`skip    ${slug}: ${plan.skipped}`);
      continue;
    }
    if (existing.has(slug)) {
      console.log(`exists  ${slug}`);
      continue;
    }
    console.log(`${dry ? 'plan   ' : 'import '} ${slug}  "${plan.title}"${plan.notes.length ? `\n          - ${plan.notes.join('\n          - ')}` : ''}`);
    if (dry) continue;
    await payload.create({
      collection: 'demos',
      draft: true,
      overrideAccess: true,
      data: {
        title: plan.title,
        slug: plan.slug,
        html: plan.html,
        seo: { description: plan.seo.description, canonical: plan.seo.canonical, noindex: plan.seo.noindex },
        _status: 'draft',
      },
    });
    created++;
  }
  console.log(`\n${slugs.length} static demo(s); ${created} imported as drafts, ${existing.size} already present.`);
};

// `payload run` executes this file with the environment loaded.
const payload = await getPayload({ config });
await script(payload);
process.exit(0);
