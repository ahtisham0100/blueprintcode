/* What happens when an Instantly contact signs the NDA: the acceptance is
   stored in Postgres (same Neon database as contact-form leads, its own
   table) and James is emailed via Resend. Either side may be unconfigured
   (local dev); the handler treats "neither recorded" as a failure so nobody
   enters the room without a trace. The signer is then emailed a private
   access code, whose hash is kept in a second table. */

import { neon } from '@neondatabase/serverless';
import { brandMail, recipientList, SITE_ORIGIN, ukTime } from '@/lib/brandMail';
import { ACCESS_CODE_TTL, isInternalEmail, PARTNERSHIP_PATH, type NdaSession } from './nda';

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

let codesReady: Promise<void> | null = null;

async function codesTable(databaseUrl: string) {
  const sql = neon(databaseUrl);
  if (!codesReady) {
    codesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS medusa_access_codes (
          code_hash    text PRIMARY KEY,
          created_at   timestamptz NOT NULL DEFAULT now(),
          expires_at   timestamptz NOT NULL,
          name         text NOT NULL,
          email        text NOT NULL,
          nda_version  text NOT NULL,
          last_used_at timestamptz
        )`;
    })().catch((e) => {
      codesReady = null;
      throw e;
    });
  }
  await codesReady;
  return sql;
}

/** Keeps a code's hash so it can be redeemed on any device until it expires. */
export async function storeAccessCode(
  codeHash: string,
  s: NdaSession,
  databaseUrl = process.env.DATABASE_URL,
): Promise<boolean> {
  if (!databaseUrl) return false;
  const sql = await codesTable(databaseUrl);
  const expiresAt = new Date(Date.now() + ACCESS_CODE_TTL * 1000).toISOString();
  await sql`
    INSERT INTO medusa_access_codes (code_hash, expires_at, name, email, nda_version)
    VALUES (${codeHash}, ${expiresAt}, ${s.name}, ${s.email}, ${s.ndaVersion})`;
  return true;
}

/** The signer a stored, unexpired code was issued to, or null. */
export async function redeemAccessCode(codeHash: string, databaseUrl = process.env.DATABASE_URL): Promise<NdaSession | null> {
  if (!databaseUrl) return null;
  const sql = await codesTable(databaseUrl);
  const rows = (await sql`
    UPDATE medusa_access_codes SET last_used_at = now()
    WHERE code_hash = ${codeHash} AND expires_at > now()
    RETURNING name, email, nda_version`) as { name: string; email: string; nda_version: string }[];
  const r = rows[0];
  return r ? { name: r.name, email: r.email, ndaVersion: r.nda_version } : null;
}

/** MEDUSA_NDA_NOTIFY_TO is one address or a comma-separated list. */
export const recipients = (raw: string | undefined) => recipientList(raw, DEFAULT_NOTIFY_TO);

/** `code` is the access code emailed to the signer, shown so admins can quote it. */
export function ndaMail(a: NdaAcceptance, code?: string): { subject: string; html: string; text: string } {
  const internal = isInternalEmail(a.email);
  const firstName = a.name.split(' ')[0] || 'the signer';
  const { html, text } = brandMail({
    tag: 'MEDUSA × INSTANTLY',
    kicker: internal ? 'INTERNAL PREVIEW · NDA SIGNED' : 'NDA SIGNED · ACCESS CODE SENT',
    headline: internal ? `${a.name} previewed the NDA gate` : `${a.name} has signed the NDA`,
    lede: internal
      ? 'A Blueprint Code AI address went through the NDA gate. This is a preview, not an Instantly acceptance.'
      : 'An Instantly contact has accepted the confidentiality agreement and has been emailed a private access code for the Medusa Heads × Instantly partner room.',
    rows: [
      { label: 'Signed by', value: a.name },
      { label: 'Email', value: a.email, kind: 'email' },
      { label: 'Access code', value: code ?? '' },
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

/** The signer's email: their private code and where to enter it. */
export function accessCodeMail(name: string, code: string): { subject: string; html: string; text: string } {
  const firstName = name.split(' ')[0] || 'there';
  const { html, text } = brandMail({
    tag: 'MEDUSA HEADS',
    kicker: 'CONFIDENTIAL PARTNER ROOM · ACCESS CODE',
    headline: `Your access code, ${firstName}`,
    lede: 'Thank you for accepting the confidentiality undertaking. Enter this code on the partner page to open the confidential room: IP, current indicative pricing, commercial model and technical material.',
    rows: [
      { label: 'Access code', value: code },
      { label: 'Valid for', value: '7 days, on any device' },
    ],
    buttons: [{ label: 'Enter the partner room', href: `${SITE_ORIGIN}${PARTNERSHIP_PATH}?access=code`, primary: true }],
    footnote: 'Please keep this code to yourself; it is tied to your NDA acceptance. Questions: james@blueprintcode.ai',
  });
  return { subject: `Your Medusa Heads partner room access code: ${code}`, html, text };
}

/** Returns "sent", "skipped" (no API key) or "error: …". */
async function sendMail(
  env: NodeJS.ProcessEnv,
  m: { to: string[]; subject: string; html: string; text: string; replyTo: string },
): Promise<string> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';
  const from = env.LEADS_FROM || 'Blueprint Code AI <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: m.to, subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
    });
    if (!res.ok) return `error: ${res.status} ${(await res.text()).slice(0, 160)}`;
    return 'sent';
  } catch (e) {
    return `error: ${String(e).slice(0, 160)}`;
  }
}

/** Returns "sent", "skipped" (no API key) or "error: …". */
export function emailNdaAcceptance(
  a: NdaAcceptance,
  code?: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  return sendMail(env, { to: recipients(env.MEDUSA_NDA_NOTIFY_TO), replyTo: a.email, ...ndaMail(a, code) });
}

/** Returns "sent", "skipped" (no API key) or "error: …". Only the signer gets
 *  this; the admins see the code in the NDA-signed notification instead. */
export function emailAccessCode(
  to: string,
  name: string,
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  return sendMail(env, { to: [to], replyTo: DEFAULT_NOTIFY_TO, ...accessCodeMail(name, code) });
}
