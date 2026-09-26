/* One-off: put the first admin(s) on the CMS allowlist.
 *
 * Nobody can sign in to /cms until their email exists in cms.users, and
 * only an admin can add users — so the very first admins are inserted here,
 * straight into the table Payload created. Idempotent: an email that already
 * exists is left alone. Uses DATABASE_URL.
 *
 *   node --env-file=.env.local scripts/seed-cms-admins.mjs you@blueprintcode.ai [other@blueprintcode.ai]
 *
 * For production, run it once with the production DATABASE_URL in the
 * environment (never commit it). Talks SQL directly rather than through
 * Payload because Payload's CLI does not run on this machine's Node version.
 */

import { neon } from '@neondatabase/serverless';

const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
if (emails.length === 0) {
  console.error('Usage: node --env-file=.env.local scripts/seed-cms-admins.mjs <email> [email...]');
  process.exit(1);
}
const bad = emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
if (bad.length) {
  console.error('Not an email address:', bad.join(', '));
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (pass --env-file=.env.local).');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

for (const email of emails) {
  const rows = await sql`
    insert into cms.users (email, name, role, active, created_at, updated_at)
    values (${email}, ${email.split('@')[0]}, 'admin', true, now(), now())
    on conflict (email) do nothing
    returning id`;
  console.log(rows.length ? `added   ${email} (id ${rows[0].id}, admin)` : `exists  ${email} (unchanged)`);
}

const all = await sql`select email, role, active from cms.users order by id`;
console.log('\ncms.users now:');
for (const u of all) console.log(`  ${u.email}  ${u.role}  ${u.active ? 'active' : 'inactive'}`);
