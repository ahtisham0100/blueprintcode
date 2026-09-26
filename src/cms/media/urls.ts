/* Public URLs for media. MEDIA_PUBLIC_URL is the base every asset URL is
   built from: https://media.blueprintcode.ai in production (a Vercel domain
   that next.config rewrites to the /media route), http://localhost:5000/media
   in dev (same route, no dedicated host). Changing where the host points —
   e.g. to R2 directly one day — changes nothing here or in stored URLs. */

type Env = Record<string, string | undefined>;

export function mediaPublicBase(env: Env = process.env): string {
  return (env.MEDIA_PUBLIC_URL ?? 'http://localhost:5000/media').replace(/\/$/, '');
}

export function mediaFileUrl(key: string, env: Env = process.env): string {
  return `${mediaPublicBase(env)}/${key}`;
}

/** Hostname to rewrite to /media, or null when media lives under a path. */
export function mediaHostForRewrite(env: Env = process.env): string | null {
  const url = new URL(mediaPublicBase(env));
  return url.pathname === '/' || url.pathname === '' ? url.hostname : null;
}
