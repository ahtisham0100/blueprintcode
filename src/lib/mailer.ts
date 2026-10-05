/* Admin notification email for a new contact-form lead, sent via the Resend API
   (plain fetch — no SDK dependency). Composed with the shared brand template
   (src/lib/brandMail.ts).

   Env:
     RESEND_API_KEY    Resend API key. If unset, email is skipped (no-op).
     LEADS_FROM        From address. Default: onboarding@resend.dev (works before
                       you verify a domain). After verifying send.blueprintcode.ai
                       in Resend, set e.g. "Blueprint Code AI <hello@send.blueprintcode.ai>".
     LEADS_NOTIFY_TO   Recipient, or a comma-separated list. Default: hello@blueprintcode.ai
*/

import { brandMail, recipientList, SITE_ORIGIN, ukTime } from './brandMail';

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

export const DEFAULT_LEADS_NOTIFY_TO = 'hello@blueprintcode.ai';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Subject and bodies for a lead notification. Pure, so it can be tested
 *  and previewed without sending. */
export function leadMail(d: LeadEmailData): { subject: string; html: string; text: string } {
  const build = [...d.groups, ...d.also].filter(Boolean);
  if (d.buildOther) build.push(`Something else: ${d.buildOther}`);
  const who = d.company || d.name || 'New enquiry';
  const firstName = d.name.trim().split(/\s+/)[0] || 'the sender';

  const { html, text } = brandMail({
    tag: 'CONTACT FORM',
    kicker: `NEW PROJECT ENQUIRY · ${d.ref}`,
    headline: `${who} wants to talk`,
    lede: d.company && d.name ? `${d.name} at ${d.company} sent an enquiry through the contact form.` : `${who} sent an enquiry through the contact form.`,
    rows: [
      { label: 'Name', value: d.name },
      { label: 'Company', value: d.company },
      { label: 'Email', value: d.email, kind: 'email' },
      { label: 'Phone', value: d.phone },
      { label: 'Location', value: d.location },
      { label: 'Building', value: build.join(', ') },
      { label: 'Stage', value: d.stage },
      { label: 'Outcome', value: d.outcome },
      { label: 'Budget', value: d.budget },
      { label: 'Timeframe', value: d.timeframe },
      { label: 'Link', value: d.projectLink, kind: 'link' },
      { label: 'Description', value: d.description, kind: 'multiline' },
      { label: 'File', value: d.file ? `${d.file.name} (attached)` : '' },
      { label: 'Submitted', value: d.submittedAt ? ukTime(d.submittedAt) : '' },
      { label: 'Time zone', value: d.browserTimezone },
      { label: 'Reference', value: d.ref },
    ],
    buttons: [
      ...(d.email ? [{ label: `Reply to ${firstName}`, href: `mailto:${d.email}`, primary: true }] : []),
      { label: 'Open leads', href: `${SITE_ORIGIN}/admin/leads` },
    ],
    footnote: d.email ? `Replying to this email reaches ${d.name || 'the sender'} directly.` : undefined,
  });

  return { subject: `Project enquiry ${d.ref}: ${who}`, html, text };
}

/** Returns a short status string recorded against the lead ("sent", "skipped", "error: …"). */
export async function sendLeadNotification(d: LeadEmailData): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';

  const from = process.env.LEADS_FROM || 'Blueprint Code AI <onboarding@resend.dev>';
  const to = recipientList(process.env.LEADS_NOTIFY_TO, DEFAULT_LEADS_NOTIFY_TO);
  const { subject, html, text } = leadMail(d);

  const payload: Record<string, unknown> = {
    from,
    to,
    subject,
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
