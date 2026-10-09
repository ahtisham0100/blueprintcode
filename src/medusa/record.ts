/* What happens when an Instantly contact signs the NDA: the acceptance is
   stored in Postgres (same Neon database as contact-form leads, its own
   table) and James is emailed via Resend. Either side may be unconfigured
   (local dev); the handler treats "neither recorded" as a failure so nobody
   enters the room without a trace. */

import { neon } from '@neondatabase/serverless';
import { brandMail, recipientList, SITE_ORIGIN, ukTime } from '@/lib/brandMail';
import { isInternalEmail, PARTNERSHIP_PATH } from './nda';

export type NdaAcceptance = {
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  ndaVersion: string;
  acceptedAt: string;
  ip: string | null;
  userAgent: string | null;
};

export const DEFAULT_NOTIFY_TO = 'james@blueprintcode.ai';

let schemaReady: Promise<void> | null = null;

export async function storeNdaAcceptance(a: NdaAcceptance, databaseUrl = process.env.DATABASE_URL): Promise<boolean> {
  if (!databaseUrl) return false;
  const sql = neon(databaseUrl);
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS medusa_nda_acceptances (
          id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          created_at  timestamptz NOT NULL DEFAULT now(),
          accepted_at timestamptz NOT NULL,
          name        text NOT NULL,
          email       text NOT NULL,
          nda_version text NOT NULL,
          ip          text,
          user_agent  text
        )`;
      // Added when the form started asking for company and role.
      await sql`ALTER TABLE medusa_nda_acceptances ADD COLUMN IF NOT EXISTS company text, ADD COLUMN IF NOT EXISTS role text`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
  await sql`
    INSERT INTO medusa_nda_acceptances (accepted_at, name, email, company, role, nda_version, ip, user_agent)
    VALUES (${a.acceptedAt}, ${a.name}, ${a.email}, ${a.company}, ${a.role}, ${a.ndaVersion}, ${a.ip}, ${a.userAgent})`;
  return true;
}

/** MEDUSA_NDA_NOTIFY_TO is one address or a comma-separated list. */
export const recipients = (raw: string | undefined) => recipientList(raw, DEFAULT_NOTIFY_TO);

export function ndaMail(a: NdaAcceptance): { subject: string; html: string; text: string } {
  const internal = isInternalEmail(a.email);
  const firstName = a.name.split(' ')[0] || 'the signer';
  const { html, text } = brandMail({
    tag: 'MEDUSA × INSTANTLY',
    kicker: internal ? 'INTERNAL PREVIEW · NDA SIGNED' : 'NDA SIGNED · CONFIDENTIAL PARTNER ROOM',
    headline: internal ? `${a.name} previewed the partner room` : `${a.name} has entered the partner room`,
    lede: internal
      ? 'A Blueprint Code AI address went through the NDA gate. This is a preview, not an Instantly acceptance.'
      : 'An Instantly contact has accepted the confidentiality agreement and can now read the Medusa Heads × Instantly partner brief.',
    rows: [
      { label: 'Signed by', value: a.name },
      { label: 'Email', value: a.email, kind: 'email' },
      { label: 'Company', value: a.company ?? '' },
      { label: 'Role', value: a.role ?? '' },
      { label: 'Accepted', value: ukTime(a.acceptedAt) },
      { label: 'NDA version', value: a.ndaVersion },
      { label: 'IP address', value: a.ip ?? '' },
      { label: 'Browser', value: a.userAgent ?? '' },
    ],
    buttons: [
      { label: `Reply to ${firstName}`, href: `mailto:${a.email}`, primary: true },
      { label: 'View the proposal', href: `${SITE_ORIGIN}${PARTNERSHIP_PATH}` },
    ],
  });
  const subject = `${internal ? '[Internal preview] ' : ''}NDA signed: ${a.name} (${a.email}) — Medusa × Instantly`;
  return { subject, html, text };
}

/** Returns "sent", "skipped" (no API key) or "error: …". */
export async function emailNdaAcceptance(a: NdaAcceptance, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';
  const from = env.LEADS_FROM || 'Blueprint Code AI <onboarding@resend.dev>';
  const to = recipients(env.MEDUSA_NDA_NOTIFY_TO);
  const { subject, html, text } = ndaMail(a);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, text, reply_to: a.email }),
    });
    if (!res.ok) return `error: ${res.status} ${(await res.text()).slice(0, 160)}`;
    return 'sent';
  } catch (e) {
    return `error: ${String(e).slice(0, 160)}`;
  }
}
