import { describe, expect, it, vi } from 'vitest';
import { resendMailer, signInMail, submissionMailToBpc } from './mail';

describe('builder emails', () => {
  it('escapes client-controlled text in the BPC email', () => {
    const m = submissionMailToBpc({
      from: 'f',
      to: 't',
      projectId: 'BP-AAAAAAAAAA',
      projectName: '<img src=x onerror=alert(1)>',
      description: '<script>x</script>',
      clientEmail: 'a@b.com',
      version: 3,
      tools: [{ id: 'T-01', name: '<b>x</b>' }],
      documents: { total: 2, byState: { draft: 2 } },
      markdown: '# md',
      handover: { schema: 'bpc.handover/1' },
      reviewUrl: 'https://admin.blueprintcode.ai/api/cms/builder-review/BP-AAAAAAAAAA',
    });
    expect(m.html).not.toMatch(/<img|<script|<b>/);
    expect(m.replyTo).toBe('a@b.com');
    expect(m.attachments![0].filename).toBe('img-src-x-onerror-alert-1-v3-blueprint.md');
  });

  it('puts the link in both parts of the sign-in email', () => {
    const m = signInMail({ from: 'f', to: 'a@b.com', link: 'https://blueprintcode.ai/builder/sign-in?token=abc', minutes: 15 });
    expect(m.text).toContain('https://blueprintcode.ai/builder/sign-in?token=abc');
    expect(m.html).toContain('href="https://blueprintcode.ai/builder/sign-in?token=abc"');
  });
});

describe('resendMailer', () => {
  const mail = { from: 'f', to: 't', subject: 's', html: 'h', text: 'x' };

  it('reports a failure, and sends nothing, without an API key', async () => {
    const f = vi.fn();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(await resendMailer({ NODE_ENV: 'test' }, f)(mail)).toEqual({ ok: false, error: 'email is not configured' });
    expect(f).not.toHaveBeenCalled();
  });

  it('succeeds only with a message id from Resend', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));
    expect(await resendMailer({ RESEND_API_KEY: 'k' }, ok as unknown as typeof fetch)(mail)).toEqual({ ok: true, id: 'abc' });
    const noId = vi.fn(async () => new Response('{}', { status: 200 }));
    expect((await resendMailer({ RESEND_API_KEY: 'k' }, noId as unknown as typeof fetch)(mail)).ok).toBe(false);
    const bad = vi.fn(async () => new Response('nope', { status: 422 }));
    expect(await resendMailer({ RESEND_API_KEY: 'k' }, bad as unknown as typeof fetch)(mail)).toEqual({ ok: false, error: '422 nope' });
  });
});
