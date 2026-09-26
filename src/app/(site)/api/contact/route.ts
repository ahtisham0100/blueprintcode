import { NextResponse } from 'next/server';
import { insertLead, isDbConfigured } from '@/lib/leads';
import { sendLeadNotification, isEmailConfigured } from '@/lib/mailer';

/* Public contact-form endpoint. Accepts the multipart POST from
   src/app/contact/ContactForm.tsx, stores the lead in Postgres (Neon) and emails
   an admin notification (Resend). The form only needs a 2xx response to show its
   confirmation; on a non-2xx it shows an "email us instead" fallback.

   Note on file uploads: this runs as a Vercel serverless function, which caps the
   request body at ~4.5 MB. An oversized brief_file makes the whole POST fail at the
   platform before it reaches this code, so the client caps the file well under that.

   Env: DATABASE_URL, RESEND_API_KEY, LEADS_FROM, LEADS_NOTIFY_TO (see src/lib/*). */

export const runtime = 'nodejs';

// Largest attachment we forward to Resend. Kept under the serverless body cap.
const MAX_ATTACH_BYTES = 4 * 1024 * 1024;

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function all(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

export async function POST(req: Request) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form submission.' }, { status: 400 });
  }

  // Honeypot: a bot filled the hidden "website" field. Pretend success, store nothing.
  if (str(fd, 'website')) return NextResponse.json({ ok: true });

  const email = str(fd, 'email');
  const name = str(fd, 'name');
  // Minimal server-side validation (the client validates the rest).
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const ref = str(fd, 'enquiry_ref') || `BPC-${Date.now().toString(36).toUpperCase()}`;
  const submittedAtRaw = str(fd, 'submitted_at');
  const submittedAt = submittedAtRaw && !Number.isNaN(Date.parse(submittedAtRaw)) ? submittedAtRaw : null;

  const groups = all(fd, 'groups');
  const also = all(fd, 'also');
  const buildOther = str(fd, 'build_other');

  // Optional supporting file → metadata (+ email attachment if small enough).
  const fileEntry = fd.get('brief_file');
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileType: string | null = null;
  let attachment: { name: string; type: string; base64: string } | null = null;
  if (fileEntry instanceof File && fileEntry.size > 0) {
    fileName = fileEntry.name;
    fileSize = fileEntry.size;
    fileType = fileEntry.type || 'application/octet-stream';
    if (fileEntry.size <= MAX_ATTACH_BYTES) {
      try {
        const buf = Buffer.from(await fileEntry.arrayBuffer());
        attachment = { name: fileEntry.name, type: fileType, base64: buf.toString('base64') };
      } catch {
        /* keep the metadata; just skip the attachment */
      }
    }
  }

  const common = {
    ref,
    name,
    company: str(fd, 'company'),
    email,
    phone: str(fd, 'phone'),
    location: str(fd, 'location'),
    description: str(fd, 'description'),
    projectLink: str(fd, 'project_link'),
    groups,
    also,
    buildOther,
    stage: str(fd, 'stage'),
    outcome: str(fd, 'outcome'),
    budget: str(fd, 'budget'),
    timeframe: str(fd, 'timeframe'),
    browserTimezone: str(fd, 'browser_timezone'),
  };

  // Send the notification first so its status can be recorded with the lead.
  let emailStatus = 'skipped';
  if (isEmailConfigured()) {
    emailStatus = await sendLeadNotification({ ...common, submittedAt, file: attachment });
  }
  const emailOk = emailStatus === 'sent';

  let dbOk = false;
  if (isDbConfigured()) {
    try {
      await insertLead({
        ...common,
        submittedAt,
        fileName,
        fileSize,
        fileType,
        userAgent: req.headers.get('user-agent'),
        emailStatus,
      });
      dbOk = true;
    } catch (e) {
      console.error('[contact] DB write failed:', e);
    }
  }

  // Nothing captured the lead anywhere → tell the client so it shows the fallback.
  if (!dbOk && !emailOk) {
    return NextResponse.json(
      { error: 'Could not record your enquiry. Please email us instead.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, ref, stored: dbOk, emailed: emailOk });
}
