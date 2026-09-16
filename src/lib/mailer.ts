/* Admin notification email for a new contact-form lead, sent via the Resend API
   (plain fetch — no SDK dependency).

   Env:
     RESEND_API_KEY    Resend API key. If unset, email is skipped (no-op).
     LEADS_FROM        From address. Default: onboarding@resend.dev (works before
                       you verify a domain). After verifying send.blueprintcode.ai
                       in Resend, set e.g. "Blueprint Code <hello@send.blueprintcode.ai>".
     LEADS_NOTIFY_TO   Recipient. Default: hello@blueprintcode.ai
*/

export interface LeadEmailData {
  ref: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  projectLink: string;
  groups: string[];
  also: string[];
  buildOther: string;
  stage: string;
  outcome: string;
  budget: string;
  timeframe: string;
  browserTimezone: string;
  submittedAt: string | null;
  file?: { name: string; type: string; base64: string } | null;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function row(label: string, value: string): string {
  if (!value) return '';
  return `<tr>
    <td style="padding:6px 14px 6px 0;color:#5F7C9E;font:12px/1.5 monospace;vertical-align:top;white-space:nowrap;">${esc(label)}</td>
    <td style="padding:6px 0;color:#0B1A2E;font:14px/1.6 system-ui,sans-serif;">${esc(value).replace(/\n/g, '<br>')}</td>
  </tr>`;
}

/** Returns a short status string recorded against the lead ("sent", "skipped", "error: …"). */
export async function sendLeadNotification(d: LeadEmailData): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';

  const from = process.env.LEADS_FROM || 'Blueprint Code <onboarding@resend.dev>';
  const to = process.env.LEADS_NOTIFY_TO || 'hello@blueprintcode.ai';

  const build = [...d.groups, ...d.also].filter(Boolean);
  if (d.buildOther) build.push(`Something else: ${d.buildOther}`);

  const html = `<div style="max-width:640px;margin:0 auto;font-family:system-ui,sans-serif;">
    <p style="font:12px/1.4 monospace;letter-spacing:.12em;color:#5F7C9E;margin:0 0 4px;">NEW PROJECT ENQUIRY</p>
    <h2 style="font:600 20px/1.3 system-ui,sans-serif;color:#0B1A2E;margin:0 0 16px;">${esc(d.company || d.name || 'Enquiry')} — ${esc(d.ref)}</h2>
    <table style="border-collapse:collapse;width:100%;">
      ${row('Name', d.name)}
      ${row('Company', d.company)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
      ${row('Location', d.location)}
      ${row('Building', build.join(', '))}
      ${row('Stage', d.stage)}
      ${row('Outcome', d.outcome)}
      ${row('Budget', d.budget)}
      ${row('Timeframe', d.timeframe)}
      ${row('Link', d.projectLink)}
      ${row('Description', d.description)}
      ${row('File', d.file ? d.file.name : '')}
      ${row('Time zone', d.browserTimezone)}
      ${row('Reference', d.ref)}
    </table>
    <p style="font:12px/1.5 system-ui,sans-serif;color:#5F7C9E;margin:20px 0 0;">Reply directly to this email to reach ${esc(d.name || 'the sender')}.</p>
  </div>`;

  const text =
    `New project enquiry ${d.ref}\n\n` +
    `Name: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone: ${d.phone}\n` +
    `Location: ${d.location}\nBuilding: ${build.join(', ')}\nStage: ${d.stage}\n` +
    `Outcome: ${d.outcome}\nBudget: ${d.budget}\nTimeframe: ${d.timeframe}\n` +
    `Link: ${d.projectLink}\n\nDescription:\n${d.description}\n`;

  const payload: Record<string, unknown> = {
    from,
    to,
    subject: `Project enquiry ${d.ref}: ${d.company || d.name || 'New enquiry'}`,
    html,
    text,
    reply_to: d.email || undefined,
  };
  if (d.file) {
    payload.attachments = [{ filename: d.file.name, content: d.file.base64 }];
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 160);
      return `error: ${res.status} ${detail}`;
    }
    return 'sent';
  } catch (e) {
    return `error: ${String(e).slice(0, 160)}`;
  }
}
