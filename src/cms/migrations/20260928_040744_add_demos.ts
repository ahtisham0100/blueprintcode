import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_demos_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__demos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "cms"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "cms"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "cms"."demos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"label" varchar,
  	"html" varchar,
  	"seo_meta_title" varchar,
  	"seo_description" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_og_image_id" integer,
  	"seo_json_ld" jsonb,
  	"gallery_show" boolean DEFAULT false,
  	"gallery_summary" varchar,
  	"gallery_thumbnail_id" integer,
  	"gallery_order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_demos_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."_demos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_label" varchar,
  	"version_html" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_seo_json_ld" jsonb,
  	"version_gallery_show" boolean DEFAULT false,
  	"version_gallery_summary" varchar,
  	"version_gallery_thumbnail_id" integer,
  	"version_gallery_order" numeric DEFAULT 100,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__demos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"permanent" boolean DEFAULT true,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "cms"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "cms"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "cms"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "cms"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "demos_id" integer;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "cms"."demos" ADD CONSTRAINT "demos_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."demos" ADD CONSTRAINT "demos_gallery_thumbnail_id_media_id_fk" FOREIGN KEY ("gallery_thumbnail_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_demos_v" ADD CONSTRAINT "_demos_v_parent_id_demos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."demos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_demos_v" ADD CONSTRAINT "_demos_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_demos_v" ADD CONSTRAINT "_demos_v_version_gallery_thumbnail_id_media_id_fk" FOREIGN KEY ("version_gallery_thumbnail_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "demos_slug_idx" ON "cms"."demos" USING btree ("slug");
  CREATE INDEX "demos_seo_seo_og_image_idx" ON "cms"."demos" USING btree ("seo_og_image_id");
  CREATE INDEX "demos_gallery_gallery_thumbnail_idx" ON "cms"."demos" USING btree ("gallery_thumbnail_id");
  CREATE INDEX "demos_updated_at_idx" ON "cms"."demos" USING btree ("updated_at");
  CREATE INDEX "demos_created_at_idx" ON "cms"."demos" USING btree ("created_at");
  CREATE INDEX "demos__status_idx" ON "cms"."demos" USING btree ("_status");
  CREATE INDEX "_demos_v_parent_idx" ON "cms"."_demos_v" USING btree ("parent_id");
  CREATE INDEX "_demos_v_version_version_slug_idx" ON "cms"."_demos_v" USING btree ("version_slug");
  CREATE INDEX "_demos_v_version_seo_version_seo_og_image_idx" ON "cms"."_demos_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_demos_v_version_gallery_version_gallery_thumbnail_idx" ON "cms"."_demos_v" USING btree ("version_gallery_thumbnail_id");
  CREATE INDEX "_demos_v_version_version_updated_at_idx" ON "cms"."_demos_v" USING btree ("version_updated_at");
  CREATE INDEX "_demos_v_version_version_created_at_idx" ON "cms"."_demos_v" USING btree ("version_created_at");
  CREATE INDEX "_demos_v_version_version__status_idx" ON "cms"."_demos_v" USING btree ("version__status");
  CREATE INDEX "_demos_v_created_at_idx" ON "cms"."_demos_v" USING btree ("created_at");
  CREATE INDEX "_demos_v_updated_at_idx" ON "cms"."_demos_v" USING btree ("updated_at");
  CREATE INDEX "_demos_v_latest_idx" ON "cms"."_demos_v" USING btree ("latest");
  CREATE INDEX "_demos_v_autosave_idx" ON "cms"."_demos_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "cms"."redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "cms"."redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "cms"."redirects" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "cms"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "cms"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "cms"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "cms"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "cms"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "cms"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "cms"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "cms"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "cms"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "cms"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "cms"."payload_jobs" USING btree ("created_at");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_demos_fk" FOREIGN KEY ("demos_id") REFERENCES "cms"."demos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "cms"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_demos_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("demos_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("redirects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."demos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_demos_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."redirects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."payload_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cms"."demos" CASCADE;
  DROP TABLE "cms"."_demos_v" CASCADE;
  DROP TABLE "cms"."redirects" CASCADE;
  DROP TABLE "cms"."payload_jobs_log" CASCADE;
  DROP TABLE "cms"."payload_jobs" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_demos_fk";
  
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_redirects_fk";
  
  DROP INDEX "cms"."payload_locked_documents_rels_demos_id_idx";
  DROP INDEX "cms"."payload_locked_documents_rels_redirects_id_idx";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "demos_id";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "redirects_id";
  DROP TYPE "cms"."enum_demos_status";
  DROP TYPE "cms"."enum__demos_v_version_status";
  DROP TYPE "cms"."enum_payload_jobs_log_task_slug";
  DROP TYPE "cms"."enum_payload_jobs_log_state";
  DROP TYPE "cms"."enum_payload_jobs_task_slug";`)
}
