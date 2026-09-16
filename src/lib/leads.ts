/* Neon Postgres access for contact-form leads.

   Storage is a single `leads` table. The schema is created lazily on first use
   (CREATE TABLE IF NOT EXISTS), so there is no separate migration step — just set
   DATABASE_URL (a Neon connection string) and the first submission provisions it.

   Env:
     DATABASE_URL   Neon Postgres connection string (postgres://…?sslmode=require)
*/

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export interface LeadInput {
  ref: string;
  submittedAt: string | null;
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
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  userAgent: string | null;
  emailStatus: string;
}

export interface LeadRow extends Omit<LeadInput, 'submittedAt'> {
  id: number;
  createdAt: string;
  submittedAt: string | null;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let sqlClient: NeonQueryFunction<false, false> | null = null;
function sql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

// Ensure the table exists exactly once per warm instance.
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`
        CREATE TABLE IF NOT EXISTS leads (
          id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          ref              text NOT NULL,
          created_at       timestamptz NOT NULL DEFAULT now(),
          submitted_at     timestamptz,
          name             text,
          company          text,
          email            text,
          phone            text,
          location         text,
          description      text,
          project_link     text,
          groups           jsonb NOT NULL DEFAULT '[]'::jsonb,
          also             jsonb NOT NULL DEFAULT '[]'::jsonb,
          build_other      text,
          stage            text,
          outcome          text,
          budget           text,
          timeframe        text,
          browser_timezone text,
          file_name        text,
          file_size        bigint,
          file_type        text,
          user_agent       text,
          email_status     text
        )`;
      await q`CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC)`;
    })().catch((e) => {
      schemaReady = null; // allow a later retry after a transient failure
      throw e;
    });
  }
  return schemaReady;
}

export async function insertLead(lead: LeadInput): Promise<number> {
  await ensureSchema();
  const q = sql();
  const rows = await q`
    INSERT INTO leads (
      ref, submitted_at, name, company, email, phone, location, description,
      project_link, groups, also, build_other, stage, outcome, budget, timeframe,
      browser_timezone, file_name, file_size, file_type, user_agent, email_status
    ) VALUES (
      ${lead.ref}, ${lead.submittedAt}, ${lead.name}, ${lead.company}, ${lead.email},
      ${lead.phone}, ${lead.location}, ${lead.description}, ${lead.projectLink},
      ${JSON.stringify(lead.groups)}::jsonb, ${JSON.stringify(lead.also)}::jsonb,
      ${lead.buildOther}, ${lead.stage}, ${lead.outcome}, ${lead.budget}, ${lead.timeframe},
      ${lead.browserTimezone}, ${lead.fileName}, ${lead.fileSize}, ${lead.fileType},
      ${lead.userAgent}, ${lead.emailStatus}
    )
    RETURNING id`;
  return (rows[0] as { id: number }).id;
}

export async function listLeads(limit = 500): Promise<LeadRow[]> {
  await ensureSchema();
  const q = sql();
  const rows = await q`
    SELECT id, ref, created_at, submitted_at, name, company, email, phone, location,
           description, project_link, groups, also, build_other, stage, outcome,
           budget, timeframe, browser_timezone, file_name, file_size, file_type,
           user_agent, email_status
    FROM leads
    ORDER BY created_at DESC
    LIMIT ${limit}`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    ref: String(r.ref ?? ''),
    createdAt: String(r.created_at),
    submittedAt: r.submitted_at ? String(r.submitted_at) : null,
    name: String(r.name ?? ''),
    company: String(r.company ?? ''),
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    location: String(r.location ?? ''),
    description: String(r.description ?? ''),
    projectLink: String(r.project_link ?? ''),
    groups: Array.isArray(r.groups) ? (r.groups as string[]) : [],
    also: Array.isArray(r.also) ? (r.also as string[]) : [],
    buildOther: String(r.build_other ?? ''),
    stage: String(r.stage ?? ''),
    outcome: String(r.outcome ?? ''),
    budget: String(r.budget ?? ''),
    timeframe: String(r.timeframe ?? ''),
    browserTimezone: String(r.browser_timezone ?? ''),
    fileName: r.file_name ? String(r.file_name) : null,
    fileSize: r.file_size != null ? Number(r.file_size) : null,
    fileType: r.file_type ? String(r.file_type) : null,
    userAgent: r.user_agent ? String(r.user_agent) : null,
    emailStatus: String(r.email_status ?? ''),
  }));
}
