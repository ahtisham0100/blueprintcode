/* Refuses to run a database-changing command locally against anything but
 * the development branch.
 *
 * Local dev and production share one Neon project; the only thing telling
 * them apart is the host in DATABASE_URL. Vercel builds (VERCEL=1) are
 * allowed through unconditionally — that is where production migrations
 * run. Anywhere else, the host must match DEV_DATABASE_HOST (.env.local),
 * or ALLOW_PROD_DB=1 must be set deliberately for a one-off such as
 * seeding the first production admins.
 *
 *   node --env-file=.env.local scripts/db-guard.mjs && payload migrate
 */

export function checkDatabaseTarget(env) {
  if (env.VERCEL) return { ok: true, reason: 'Vercel build' };
  const url = env.DATABASE_URL;
  if (!url) return { ok: false, reason: 'DATABASE_URL is not set' };
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, reason: 'DATABASE_URL is not a valid URL' };
  }
  if (env.ALLOW_PROD_DB === '1') return { ok: true, reason: `ALLOW_PROD_DB=1 (host ${host})` };
  const dev = env.DEV_DATABASE_HOST?.trim();
  if (!dev) return { ok: false, reason: 'DEV_DATABASE_HOST is not set; add the development branch host to .env.local' };
  if (host !== dev) return { ok: false, reason: `DATABASE_URL host "${host}" is not the development branch "${dev}"` };
  return { ok: true, reason: `development branch ${host}` };
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  const result = checkDatabaseTarget(process.env);
  if (!result.ok) {
    console.error(`db-guard: refusing to touch this database — ${result.reason}.`);
    console.error('db-guard: set ALLOW_PROD_DB=1 only for a deliberate one-off against production.');
    process.exit(1);
  }
  console.log(`db-guard: ok (${result.reason})`);
}
