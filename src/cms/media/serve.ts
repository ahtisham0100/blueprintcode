/* Serves one object from the private media bucket. The route handler at
   /media/[...key] wraps this; the bucket client is injected so the rules
   are testable without R2.

   Responses are immutable for a year: keys are never reused (keys.ts), so
   Vercel's CDN serves repeats and R2 is hit roughly once per file. */

import type { NextRequest } from 'next/server';
import { isAllowedMime, isValidObjectKey } from './keys';

export type StoredObject = {
  body: Uint8Array | ReadableStream<Uint8Array> | null;
  status: 200 | 206;
  contentType?: string;
  contentLength?: number;
  etag?: string;
  contentRange?: string;
};

export type ObjectStore = {
  /** null when the key does not exist. */
  get(key: string, range?: string): Promise<StoredObject | null>;
};

const SVG_CSP = "sandbox; default-src 'none'; style-src 'unsafe-inline'";

/** The media host is a file host only. Crawlers may index the files (image
 *  search credit goes to our domain); everything else there is a 404. */
export function mediaHostSpecialResponse(key: string): Response | null {
  if (key === 'robots.txt') {
    return new Response('User-agent: *\nAllow: /\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  }
  if (key === '' || key === 'favicon.ico') {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=3600' } });
  }
  return null;
}

/** Only ever serve types we allow uploading; anything else is a download. */
function safeContentType(recorded: string | undefined): string {
  return recorded && isAllowedMime(recorded) ? recorded : 'application/octet-stream';
}

export async function serveMedia(req: NextRequest, key: string, store: ObjectStore): Promise<Response> {
  if (!isValidObjectKey(key)) {
    return new Response('Bad media key', { status: 400, headers: { 'cache-control': 'no-store' } });
  }

  const obj = await store.get(key, req.headers.get('range') ?? undefined);
  if (!obj) {
    // Short cache: a 404 must not mask a file uploaded a minute later.
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=60' } });
  }

  const type = safeContentType(obj.contentType);
  const headers = new Headers({
    'content-type': type,
    'cache-control': 'public, max-age=31536000, immutable',
    'accept-ranges': 'bytes',
    'x-content-type-options': 'nosniff',
    // The main site and the demos (other origins) embed these files.
    'cross-origin-resource-policy': 'cross-origin',
    'access-control-allow-origin': '*',
  });
  if (obj.etag) headers.set('etag', obj.etag);
  if (obj.contentLength !== undefined) headers.set('content-length', String(obj.contentLength));
  if (obj.status === 206 && obj.contentRange) headers.set('content-range', obj.contentRange);
  if (type === 'image/svg+xml') headers.set('content-security-policy', SVG_CSP);

  const body = req.method === 'HEAD' ? null : (obj.body as BodyInit | null);
  return new Response(body, { status: obj.status, headers });
}
