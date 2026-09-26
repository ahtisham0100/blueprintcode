/* Cloudflare R2 wiring: env → S3 config, the Payload storage plugin, and the
   read-side object store used by the /media route. R2 speaks the S3 API at
   https://<account>.r2.cloudflarestorage.com with region "auto". */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
    bucket: read('R2_BUCKET'),
  };
}

export function r2Config(e: R2Env) {
  return {
    endpoint: `https://${e.accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey },
  };
}

function tryR2Env(): R2Env | null {
  try {
    return r2Env();
  } catch {
    return null;
  }
}

/** Payload plugin for the media collection. Disabled (with a warning) when
 *  R2 isn't configured, so builds and migrations still run without it. */
export function mediaStoragePlugin() {
  const env = tryR2Env();
  if (!env) console.warn('[cms] R2 env vars missing: media uploads are disabled until R2_* are set.');
  return s3Storage({
    enabled: Boolean(env),
    bucket: env?.bucket ?? 'unconfigured',
    config: env ? r2Config(env) : { region: 'auto' },
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

/** Read side for /media: one S3 client per process. */
let client: S3Client | undefined;
export function r2ObjectStore(): ObjectStore {
  const env = r2Env();
  client ??= new S3Client(r2Config(env));
  return {
    async get(key, range) {
      try {
        const out = await client!.send(new GetObjectCommand({ Bucket: env.bucket, Key: key, Range: range }));
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
