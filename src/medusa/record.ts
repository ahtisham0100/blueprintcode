/* What happens when an Instantly contact signs the NDA: the acceptance is
   stored in Postgres (same Neon database as contact-form leads, its own
   table) and James is emailed via Resend. Either side may be unconfigured
   (local dev); the handler treats "neither recorded" as a failure so nobody
   enters the room without a trace. */

import { neon } from '@neondatabase/serverless';

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

/** Returns "sent", "skipped" (no API key) or "error: …". */
export async function emailNdaAcceptance(a: NdaAcceptance, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';
  const from = env.LEADS_FROM || 'Blueprint Code AI <onboarding@resend.dev>';
  const to = recipients(env.MEDUSA_NDA_NOTIFY_TO);

  const rows: [string, string][] = [
    ['Name', a.name],
    ['Email', a.email],
    ['Accepted at', a.acceptedAt],
    ['NDA version', a.ndaVersion],
    ['IP', a.ip ?? ''],
    ['Browser', a.userAgent ?? ''],
  ];
  const cells = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5F7C9E;font:12px/1.5 monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td>` +
        `<td style="padding:6px 0;color:#0B1A2E;font:14px/1.6 system-ui,sans-serif;">${esc(v)}</td></tr>`,
    )
    .join('');
  const html = `<div style="max-width:640px;margin:0 auto;font-family:system-ui,sans-serif;">
    <p style="font:12px/1.4 monospace;letter-spacing:.12em;color:#5F7C9E;margin:0 0 4px;">MEDUSA × INSTANTLY — NDA SIGNED</p>
    <h2 style="font:600 20px/1.3 system-ui,sans-serif;color:#0B1A2E;margin:0 0 16px;">${esc(a.name)} entered the confidential partner room</h2>
    <table style="border-collapse:collapse;width:100%;">${cells}</table>
  </div>`;
  const text = `Medusa × Instantly — NDA signed\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `NDA signed: ${a.name} (${a.email}) — Medusa × Instantly`,
        html,
        text,
        reply_to: a.email,
      }),
    });
    if (!res.ok) return `error: ${res.status} ${(await res.text()).slice(0, 160)}`;
    return 'sent';
  } catch (e) {
    return `error: ${String(e).slice(0, 160)}`;
  }
}
