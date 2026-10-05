/* What happens when an Instantly contact signs the NDA: the acceptance is
   stored in Postgres (same Neon database as contact-form leads, its own
   table) and James is emailed via Resend. Either side may be unconfigured
   (local dev); the handler treats "neither recorded" as a failure so nobody
   enters the room without a trace. */

import { neon } from '@neondatabase/serverless';
import { isInternalEmail } from './nda';

export type NdaAcceptance = {
  name: string;
  email: string;
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
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  await schemaReady;
  await sql`
    INSERT INTO medusa_nda_acceptances (accepted_at, name, email, nda_version, ip, user_agent)
    VALUES (${a.acceptedAt}, ${a.name}, ${a.email}, ${a.ndaVersion}, ${a.ip}, ${a.userAgent})`;
  return true;
}

/** MEDUSA_NDA_NOTIFY_TO is one address or a comma-separated list. */
export function recipients(raw: string | undefined): string[] {
  const list = (raw ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  return list.length ? list : [DEFAULT_NOTIFY_TO];
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Brand palette from the site chrome (src/app/(site)/chrome.css). Email
   clients ignore stylesheets and web fonts, so everything is inline and the
   display face falls back to a condensed system font. */
const GROUND = '#0B1A2E';
const INK = '#EAF1F8';
const INK_2 = '#8FA9C6';
const INK_3 = '#5F7C9E';
const LINE = '#2C4A6E';
const LINE_SOFT = '#1D3552';
const RULE = '#DCE5EF';
const SANS = "'IBM Plex Sans','Instrument Sans',Helvetica,Arial,sans-serif";
const MONO = "'DM Mono',Menlo,Consolas,'Courier New',monospace";
const DISPLAY = "'Bebas Neue','Arial Narrow',Impact,Helvetica,Arial,sans-serif";
const LOGO = 'https://blueprintcode.ai/blueprintcode-ai.png';
const PROPOSAL_URL = 'https://blueprintcode.ai/medusa-instantly';

export function ndaMail(a: NdaAcceptance): { subject: string; html: string; text: string } {
  const internal = isInternalEmail(a.email);
  const when = new Date(a.acceptedAt);
  const stamp = Number.isNaN(when.getTime())
    ? a.acceptedAt
    : when.toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'long', timeStyle: 'short' }) + ' UK';

  const rows = (
    [
      ['Signed by', a.name],
      ['Email', a.email],
      ['Accepted', stamp],
      ['NDA version', a.ndaVersion],
      ['IP address', a.ip ?? ''],
      ['Browser', a.userAgent ?? ''],
    ] as [string, string][]
  ).filter(([, v]) => v);

  const cells = rows
    .map(([k, v], i) => {
      const border = `border-top:1px solid ${i ? RULE : 'transparent'};`;
      const value =
        k === 'Email'
          ? `<a href="mailto:${esc(v)}" style="color:${GROUND};text-decoration:underline;">${esc(v)}</a>`
          : esc(v);
      return `<tr>
          <td style="padding:11px 18px 11px 0;${border}font:11px/1.4 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};vertical-align:top;white-space:nowrap;">${esc(k)}</td>
          <td style="padding:11px 0;${border}font:15px/1.5 ${SANS};color:${GROUND};vertical-align:top;word-break:break-word;">${value}</td>
        </tr>`;
    })
    .join('');

  const kicker = internal ? 'INTERNAL PREVIEW · NDA SIGNED' : 'NDA SIGNED · CONFIDENTIAL PARTNER ROOM';
  const headline = internal ? `${a.name} previewed the partner room` : `${a.name} has entered the partner room`;
  const lede = internal
    ? 'A Blueprint Code AI address went through the NDA gate. This is a preview, not an Instantly acceptance.'
    : 'An Instantly contact has accepted the confidentiality agreement and can now read the Medusa Heads × Instantly partner brief.';
  const firstName = a.name.split(' ')[0] || 'the signer';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(headline)}</title></head>
<body style="margin:0;padding:0;background:#E9EFF6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9EFF6;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">

  <tr><td style="background:${GROUND};padding:26px 32px 22px;border-bottom:1px solid ${LINE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;"><a href="https://blueprintcode.ai" style="text-decoration:none;"><img src="${LOGO}" width="176" height="25" alt="BlueprintCode.ai" style="display:block;width:176px;height:auto;border:0;"></a></td>
      <td align="right" style="vertical-align:middle;font:11px/1.4 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${INK_3};">MEDUSA × INSTANTLY</td>
    </tr></table>
  </td></tr>

  <tr><td style="background:${GROUND};padding:30px 32px 34px;background-image:linear-gradient(${LINE_SOFT} 1px,transparent 1px),linear-gradient(90deg,${LINE_SOFT} 1px,transparent 1px);background-size:40px 40px;">
    <p style="margin:0 0 12px;font:11px/1.4 ${MONO};letter-spacing:.18em;text-transform:uppercase;color:${INK_2};">${esc(kicker)}</p>
    <h1 style="margin:0 0 14px;font:400 40px/1 ${DISPLAY};letter-spacing:.02em;text-transform:uppercase;color:${INK};">${esc(headline)}</h1>
    <p style="margin:0;font:15px/1.6 ${SANS};color:${INK_2};max-width:480px;">${esc(lede)}</p>
  </td></tr>

  <tr><td style="background:#FFFFFF;padding:10px 32px 28px;border-left:1px solid ${RULE};border-right:1px solid ${RULE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${cells}</table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr>
      <td style="background:${GROUND};"><a href="mailto:${esc(a.email)}" style="display:inline-block;padding:13px 22px;font:600 13px/1 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${INK};text-decoration:none;">Reply to ${esc(firstName)}</a></td>
      <td style="width:10px;"></td>
      <td style="border:1px solid ${LINE};"><a href="${PROPOSAL_URL}" style="display:inline-block;padding:12px 22px;font:600 13px/1 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${GROUND};text-decoration:none;">View the proposal</a></td>
    </tr></table>
  </td></tr>

  <tr><td style="background:${GROUND};padding:18px 32px;border-top:1px solid ${LINE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font:10px/1.6 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};">Blueprint Code AI — Making the complex simple</td>
      <td align="right" style="font:10px/1.6 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};">Confidential</td>
    </tr></table>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const text =
    `${kicker}\n${headline}\n\n${lede}\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nReply to this email to reach ${a.name}.\nProposal: ${PROPOSAL_URL}\n`;

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
