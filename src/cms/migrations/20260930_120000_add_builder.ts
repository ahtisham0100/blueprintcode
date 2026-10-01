import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Blueprint Builder's tables (src/builder/store.ts). Hand-written: they are
// not Payload collections, so the generator knows nothing about them. They
// live in their own "builder" schema, apart from "cms" (Payload) and
// "public" (the old contact-form leads). Client accounts are here and only
// here; they can never sign in to the CMS.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS "builder";

  CREATE TABLE "builder"."clients" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" text NOT NULL UNIQUE,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "last_sign_in_at" timestamptz
  );

  -- Only the SHA-256 of each emailed token is kept.
  CREATE TABLE "builder"."login_tokens" (
    "token_hash" text PRIMARY KEY,
    "email" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "expires_at" timestamptz NOT NULL,
    "used_at" timestamptz
  );
  CREATE INDEX "login_tokens_expires_at_idx" ON "builder"."login_tokens" ("expires_at");

  CREATE TABLE "builder"."projects" (
    "id" text PRIMARY KEY,
    "client_id" uuid NOT NULL REFERENCES "builder"."clients"("id") ON DELETE CASCADE,
    "name" text NOT NULL DEFAULT '',
    "rev" integer NOT NULL DEFAULT 1,
    "data" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "submitted_at" timestamptz
  );
  CREATE INDEX "projects_client_idx" ON "builder"."projects" ("client_id", "updated_at" DESC);
  CREATE INDEX "projects_submitted_idx" ON "builder"."projects" ("submitted_at" DESC NULLS LAST);

  -- A snapshot of exactly what was sent each time, with what the server generated.
  CREATE TABLE "builder"."submissions" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "project_id" text NOT NULL REFERENCES "builder"."projects"("id") ON DELETE CASCADE,
    "rev" integer NOT NULL,
    "project_name" text NOT NULL DEFAULT '',
    "client_email" text NOT NULL,
    "data" jsonb NOT NULL,
    "handover" jsonb NOT NULL,
    "markdown" text NOT NULL,
    "email_status" text NOT NULL,
    "email_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX "submissions_project_idx" ON "builder"."submissions" ("project_id", "created_at" DESC);

  -- Fixed-window counters for sign-in, create and submit limits.
  CREATE TABLE "builder"."rate_limits" (
    "key" text NOT NULL,
    "window_start" timestamptz NOT NULL,
    "count" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("key", "window_start")
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SCHEMA IF EXISTS "builder" CASCADE;`)
}
