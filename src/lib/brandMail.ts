/* The Blueprint Code AI email template, shared by every notification the
   site sends (contact-form leads, Medusa × Instantly NDA signings). Palette
   from the site chrome (src/app/(site)/chrome.css). Email clients ignore
   stylesheets and web fonts, so everything is inline and the display face
   falls back to a condensed system font. Pure: compose here, send elsewhere. */

export const SITE_ORIGIN = 'https://blueprintcode.ai';

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
const LOGO = `${SITE_ORIGIN}/blueprintcode-ai.png`;

export const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A notification recipient list from an env var: one address or a
 *  comma-separated list; the fallback when it is unset or blank. */
export function recipientList(raw: string | undefined, fallback: string): string[] {
  const list = (raw ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  return list.length ? list : [fallback];
}

/** A timestamp as the team reads it: UK local time. Falls back to the raw
 *  string when it does not parse. */
export function ukTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'long', timeStyle: 'short' }) + ' UK';
}

export type MailRow = { label: string; value: string; kind?: 'text' | 'email' | 'link' | 'multiline' };
export type MailButton = { label: string; href: string; primary?: boolean };

export type BrandMail = {
  /** Small mono line in the header's right corner, e.g. "MEDUSA × INSTANTLY". */
  tag: string;
  /** Mono line above the headline, e.g. "NEW PROJECT ENQUIRY". */
  kicker: string;
  headline: string;
  lede: string;
  rows: MailRow[];
  buttons?: MailButton[];
  /** Small mono line under the data card, e.g. how to reach the sender. */
  footnote?: string;
};

function cell(r: MailRow, i: number): string {
  const border = `border-top:1px solid ${i ? RULE : 'transparent'};`;
  const v = esc(r.value);
  const value =
    r.kind === 'email'
      ? `<a href="mailto:${v}" style="color:${GROUND};text-decoration:underline;">${v}</a>`
      : r.kind === 'link'
        ? `<a href="${v}" style="color:${GROUND};text-decoration:underline;">${v}</a>`
        : r.kind === 'multiline'
          ? v.replace(/\r?\n/g, '<br>')
          : v;
  return `<tr>
          <td style="padding:11px 18px 11px 0;${border}font:11px/1.4 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};vertical-align:top;white-space:nowrap;">${esc(r.label)}</td>
          <td style="padding:11px 0;${border}font:15px/1.5 ${SANS};color:${GROUND};vertical-align:top;word-break:break-word;">${value}</td>
        </tr>`;
}

function button(b: MailButton): string {
  return b.primary
    ? `<td style="background:${GROUND};"><a href="${esc(b.href)}" style="display:inline-block;padding:13px 22px;font:600 13px/1 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${INK};text-decoration:none;">${esc(b.label)}</a></td>`
    : `<td style="border:1px solid ${LINE};"><a href="${esc(b.href)}" style="display:inline-block;padding:12px 22px;font:600 13px/1 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:${GROUND};text-decoration:none;">${esc(b.label)}</a></td>`;
}

/** The HTML and plain-text bodies for a notification. Rows with an empty
 *  value are left out of both. */
export function brandMail(m: BrandMail): { html: string; text: string } {
  const rows = m.rows.filter((r) => r.value.trim() !== '');
  const buttons = (m.buttons ?? []).map(button).join('<td style="width:10px;"></td>');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.headline)}</title></head>
<body style="margin:0;padding:0;background:#E9EFF6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9EFF6;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">

  <tr><td style="background:${GROUND};padding:26px 32px 22px;border-bottom:1px solid ${LINE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;"><a href="${SITE_ORIGIN}" style="text-decoration:none;"><img src="${LOGO}" width="176" height="25" alt="BlueprintCode.ai" style="display:block;width:176px;height:auto;border:0;"></a></td>
      <td align="right" style="vertical-align:middle;font:11px/1.4 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${INK_3};">${esc(m.tag)}</td>
    </tr></table>
  </td></tr>

  <tr><td style="background:${GROUND};padding:30px 32px 34px;background-image:linear-gradient(${LINE_SOFT} 1px,transparent 1px),linear-gradient(90deg,${LINE_SOFT} 1px,transparent 1px);background-size:40px 40px;">
    <p style="margin:0 0 12px;font:11px/1.4 ${MONO};letter-spacing:.18em;text-transform:uppercase;color:${INK_2};">${esc(m.kicker)}</p>
    <h1 style="margin:0 0 14px;font:400 40px/1 ${DISPLAY};letter-spacing:.02em;text-transform:uppercase;color:${INK};">${esc(m.headline)}</h1>
    <p style="margin:0;font:15px/1.6 ${SANS};color:${INK_2};max-width:480px;">${esc(m.lede)}</p>
  </td></tr>

  <tr><td style="background:#FFFFFF;padding:10px 32px 28px;border-left:1px solid ${RULE};border-right:1px solid ${RULE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows.map(cell).join('')}</table>
    ${buttons ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr>${buttons}</tr></table>` : ''}
    ${m.footnote ? `<p style="margin:22px 0 0;font:11px/1.6 ${MONO};letter-spacing:.06em;color:${INK_3};">${esc(m.footnote)}</p>` : ''}
  </td></tr>

  <tr><td style="background:${GROUND};padding:18px 32px;border-top:1px solid ${LINE};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font:10px/1.6 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};">Blueprint Code AI — Making the complex simple</td>
      <td align="right" style="font:10px/1.6 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${INK_3};">${esc(m.tag)}</td>
    </tr></table>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const text =
    `${m.kicker}\n${m.headline}\n\n${m.lede}\n\n` +
    rows.map((r) => `${r.label}: ${r.value}`).join('\n') +
    (m.buttons?.length ? `\n\n${m.buttons.map((b) => `${b.label}: ${b.href}`).join('\n')}` : '') +
    (m.footnote ? `\n\n${m.footnote}` : '') +
    '\n';

  return { html, text };
}
