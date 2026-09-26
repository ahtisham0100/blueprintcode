/* Cloudflare R2 wiring: env → S3 config, the Payload storage plugin, and the
   read-side object store used by the /media route. R2 speaks the S3 API at
   https://<account>.r2.cloudflarestorage.com with region "auto". */

import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { s3Storage } from '@payloadcms/storage-s3';
import { MEDIA_PREFIX } from './keys';
import type { ObjectStore } from './serve';
import { mediaFileUrl } from './urls';

type Env = Record<string, string | undefined>;

export type R2Env = { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string };

export function r2Env(env: Env = process.env): R2Env {
  const read = (name: string): string => {
    const v = env[name];
    if (!v) throw new Error(`${name} is not set`);
    return v;
  };
  return {
    accountId: read('R2_ACCOUNT_ID'),
    accessKeyId: read('R2_ACCESS_KEY_ID'),
    secretAccessKey: read('R2_SECRET_ACCESS_KEY'),
    bucket: bucketName(read('R2_BUCKET')),
  };
}

/** Accepts a bare name or the "S3 API" URL Cloudflare shows next to the
 *  bucket (https://<account>.r2.cloudflarestorage.com/<bucket>); the SDK
 *  needs the bare name. */
export function bucketName(value: string): string {
  let name = value.trim();
  if (name.includes('://')) {
    const path = new URL(name).pathname.replace(/\/+$/, '');
    name = path.slice(path.lastIndexOf('/') + 1);
  }
  name = name.replace(/\/+$/, '');
  if (!name || name.includes('/')) throw new Error('R2_BUCKET is not a bucket name');
  return name;
}

export function r2Config(e: R2Env) {
  return {
    endpoint: `https://${e.accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey },
  };
}

/** R2 settings, or placeholders when the env is incomplete. The plugin must
 *  stay ENABLED either way: it adds columns (prefix, _objectkey) to the media
 *  table, and the database schema cannot depend on which env vars a build
 *  happened to have. Without credentials, uploads fail at runtime with a
 *  clear message; builds and migrations are unaffected. */
export function resolveR2(env: Env = process.env): { r2: R2Env; configured: boolean } {
  try {
    return { r2: r2Env(env), configured: true };
  } catch {
    return {
      r2: { accountId: 'unconfigured', accessKeyId: 'unconfigured', secretAccessKey: 'unconfigured', bucket: 'unconfigured' },
      configured: false,
    };
  }
}

/** Payload plugin for the media collection. */
export function mediaStoragePlugin() {
  const { r2, configured } = resolveR2();
  if (!configured) console.warn('[cms] R2_* env vars missing: media uploads will fail until they are set.');
  return s3Storage({
    bucket: r2.bucket,
    config: r2Config(r2),
    // Browser → R2 directly (presigned), bypassing Vercel's 4.5 MB body cap.
    // Image sizes are still generated server-side afterwards.
    clientUploads: true,
    collections: {
      media: {
        prefix: MEDIA_PREFIX,
        // URLs point at our own host, never at Payload's /api/cms/media/file/…
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => mediaFileUrl(prefix ? `${prefix}/${filename}` : filename),
      },
    },
  });
}

let client: S3Client | undefined;
function r2Client(): { client: S3Client; env: R2Env } {
  const env = r2Env();
  client ??= new S3Client(r2Config(env));
  return { client, env };
}

/** Rename an object (S3 has no move: copy, verify, delete). Used to put a
 *  client-uploaded file under its recorded name (media/hooks.ts). */
export async function r2MoveObject(from: string, to: string, contentType: string | undefined): Promise<void> {
  const { client, env } = r2Client();
  await client.send(
    new CopyObjectCommand({
      Bucket: env.bucket,
      CopySource: encodeURI(`${env.bucket}/${from}`),
      Key: to,
      ...(contentType ? { ContentType: contentType, MetadataDirective: 'REPLACE' } : {}),
    }),
  );
  await client.send(new HeadObjectCommand({ Bucket: env.bucket, Key: to }));
  await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: from }));
}

/** Read side for /media. */
export function r2ObjectStore(): ObjectStore {
  const { client, env } = r2Client();
  return {
    async get(key, range) {
      try {
        const out = await client.send(new GetObjectCommand({ Bucket: env.bucket, Key: key, Range: range }));
        return {
          body: out.Body ? (out.Body.transformToWebStream() as ReadableStream<Uint8Array>) : null,
          status: out.ContentRange ? 206 : 200,
          contentType: out.ContentType,
          contentLength: out.ContentLength,
          etag: out.ETag,
          contentRange: out.ContentRange,
        };
      } catch (err) {
        const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    },
  };
}
