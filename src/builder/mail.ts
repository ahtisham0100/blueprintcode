/* Builder emails: the sign-in link, the submission to BPC (with the
   handover JSON and full blueprint attached) and the client's copy. The
   messages are composed by pure functions; sending goes through Resend with
   plain fetch, like src/lib/mailer.ts. */

export type Mail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
};
export type SendResult = { ok: true; id: string } | { ok: false; error: string };
export type Mailer = (m: Mail) => Promise<SendResult>;

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const shell = (label: string, body: string) =>
  `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#0B1A2E;">
  <p style="font:12px/1.4 monospace;letter-spacing:.12em;color:#5F7C9E;margin:0 0 6px;">${esc(label)}</p>${body}
</div>`;

export function signInMail(o: { from: string; to: string; link: string; minutes: number }): Mail {
  return {
    from: o.from,
    to: o.to,
    subject: 'Your Blueprint Builder sign-in link',
    html: shell(
      'BLUEPRINT BUILDER',
      `<h2 style="font:600 20px/1.3 system-ui,sans-serif;margin:0 0 14px;">Sign in to Blueprint Builder</h2>
  <p style="font:15px/1.6 system-ui,sans-serif;margin:0 0 18px;">Use the button below to sign in. The link works once and expires in ${o.minutes} minutes.</p>
  <p style="margin:0 0 18px;"><a href="${esc(o.link)}" style="display:inline-block;background:#0B1A2E;color:#EAF1F8;text-decoration:none;font:600 15px system-ui,sans-serif;padding:11px 18px;border-radius:2px;">Sign in</a></p>
  <p style="font:13px/1.6 system-ui,sans-serif;color:#5F7C9E;margin:0;">If you didn't ask for this, ignore this email; nobody can sign in without the link.</p>`,
    ),
    text: `Sign in to Blueprint Builder:\n${o.link}\n\nThe link works once and expires in ${o.minutes} minutes. If you didn't ask for this, ignore this email.\n`,
  };
}

export type SubmissionFacts = {
  projectId: string;
  projectName: string;
  description: string;
  clientEmail: string;
  version: number;
  tools: { id: string; name: string }[];
  documents: { total: number; byState: Record<string, number> };
  markdown: string;
  handover: Record<string, unknown>;
  reviewUrl: string;
};

const slug = (s: string) => (s || 'blueprint').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blueprint';

export function submissionMailToBpc(o: { from: string; to: string } & SubmissionFacts): Mail {
  const name = o.projectName || 'Untitled project';
  const states = Object.entries(o.documents.byState)
    .map(([k, n]) => `${n} ${k.replace(/_/g, ' ')}`)
    .join(', ');
  const row = (k: string, v: string) =>
    `<tr><td style="padding:5px 14px 5px 0;color:#5F7C9E;font:12px/1.5 monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:5px 0;font:14px/1.6 system-ui,sans-serif;">${esc(v).replace(/\n/g, '<br>')}</td></tr>`;
  const base = `${slug(o.projectName)}-v${o.version}`;
  return {
    from: o.from,
    to: o.to,
    replyTo: o.clientEmail,
    subject: `Blueprint submitted: ${name} (${o.projectId})`,
    html: shell(
      'BLUEPRINT SUBMITTED',
      `<h2 style="font:600 20px/1.3 system-ui,sans-serif;margin:0 0 14px;">${esc(name)}</h2>
  <table style="border-collapse:collapse;width:100%;">${row('Client', o.clientEmail)}${row('Project', `${o.projectId}, version ${o.version}`)}${row('Tools', o.tools.map((t) => `${t.id} ${t.name}`).join('\n') || 'None')}${row('Documents', `${o.documents.total}: ${states}`)}${row('Description', o.description || '(none)')}</table>
  <p style="font:14px/1.6 system-ui,sans-serif;margin:18px 0 0;">The full blueprint and the developer handover are attached. Review it in the CMS: <a href="${esc(o.reviewUrl)}">${esc(o.reviewUrl)}</a></p>
  <p style="font:12px/1.5 system-ui,sans-serif;color:#5F7C9E;margin:12px 0 0;">Reply to this email to reach the client.</p>`,
    ),
    text: `Blueprint submitted: ${name} (${o.projectId}, version ${o.version})\nClient: ${o.clientEmail}\nTools: ${o.tools.map((t) => `${t.id} ${t.name}`).join(', ') || 'None'}\nDocuments: ${o.documents.total} (${states})\n\n${o.description}\n\nReview in the CMS: ${o.reviewUrl}\n`,
    attachments: [
      { filename: `${base}-blueprint.md`, content: b64(o.markdown) },
      { filename: `${base}-handover.json`, content: b64(JSON.stringify(o.handover, null, 2)) },
    ],
  };
}

/** The client's copy: the blueprint they sent, without BPC's internal handover. */
export function submissionMailToClient(o: { from: string; to: string; replyTo: string; projectUrl: string } & Pick<SubmissionFacts, 'projectName' | 'version' | 'markdown'>): Mail {
  const name = o.projectName || 'Untitled project';
  return {
    from: o.from,
    to: o.to,
    replyTo: o.replyTo,
    subject: `We've received your blueprint: ${name}`,
    html: shell(
      'BLUEPRINT BUILDER',
      `<h2 style="font:600 20px/1.3 system-ui,sans-serif;margin:0 0 14px;">Thanks, we've got your blueprint</h2>
  <p style="font:15px/1.6 system-ui,sans-serif;margin:0 0 14px;">"${esc(name)}" (version ${o.version}) has reached Blueprint Code. A copy is attached. We'll review it and reply to this email.</p>
  <p style="font:15px/1.6 system-ui,sans-serif;margin:0 0 14px;">You can keep working on it in <a href="${esc(o.projectUrl)}">Blueprint Builder</a>; send it again when you change something important.</p>
  <p style="font:13px/1.6 system-ui,sans-serif;color:#5F7C9E;margin:0;">This is a specification, not a quote or an approved design.</p>`,
    ),
    text: `Thanks, we've got your blueprint "${name}" (version ${o.version}). A copy is attached. We'll review it and reply to this email.\n\nKeep working on it: ${o.projectUrl}\n\nThis is a specification, not a quote or an approved design.\n`,
    attachments: [{ filename: `${slug(o.projectName)}-v${o.version}-blueprint.md`, content: b64(o.markdown) }],
  };
}

/** Resend over fetch. Without an API key nothing is sent: outside production
 *  the message is logged instead (so sign-in works in local dev), and the
 *  result is a failure either way, so the UI never claims an email went. */
export function resendMailer(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): Mailer {
  return async (m) => {
    const key = env.RESEND_API_KEY;
    if (!key) {
      if (env.NODE_ENV !== 'production') console.info(`[builder] email not sent (no RESEND_API_KEY) to ${m.to}: ${m.subject}\n${m.text}`);
      return { ok: false, error: 'email is not configured' };
    }
    try {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: m.from,
          to: m.to,
          subject: m.subject,
          html: m.html,
          text: m.text,
          reply_to: m.replyTo,
          attachments: m.attachments,
        }),
      });
      if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 160)}` };
      const body = (await res.json().catch(() => ({}))) as { id?: string };
      return body.id ? { ok: true, id: body.id } : { ok: false, error: 'no message id from Resend' };
    } catch (e) {
      return { ok: false, error: String(e).slice(0, 160) };
    }
  };
}
