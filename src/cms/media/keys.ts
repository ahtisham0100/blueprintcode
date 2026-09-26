/* Object keys for media in R2.
 *
 * Every stored file is `media/<slug>-<8 hex>.<ext>`: the slug comes from the
 * original name (for readable URLs), the random suffix makes every upload a
 * new key (so URLs can be cached for a year and a re-upload never overwrites),
 * and the extension comes from the MIME type, not the user's filename.
 * Payload's image-size variants append `-<w>x<h>` before the extension.
 * Pure functions, no I/O. */

export const MEDIA_PREFIX = 'media';

/** MIME → extension; also the allowlist of what may be uploaded. */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
  'model/gltf-binary': 'glb',
  'model/gltf+json': 'gltf',
};

export const ALLOWED_MIME_TYPES: string[] = Object.keys(MIME_EXTENSIONS);

const MB = 1024 * 1024;

export function isAllowedMime(mime: string): boolean {
  return Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, mime);
}

/** Per-file cap: big for video / 3D models, modest for everything else. */
export function maxBytesFor(mime: string): number {
  return mime.startsWith('video/') || mime.startsWith('model/') ? 200 * MB : 15 * MB;
}

export function slugifyBasename(name: string): string {
  const withoutExt = name.replace(/\.[a-zA-Z0-9]{1,5}$/, '');
  const slug = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return slug || 'file';
}

export function extensionFor(mime: string, filename: string): string {
  if (MIME_EXTENSIONS[mime]) return MIME_EXTENSIONS[mime];
  const m = /\.([a-zA-Z0-9]{1,5})$/.exec(filename);
  return m ? m[1].toLowerCase() : 'bin';
}

function randomHex8(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildStoredFilename(originalName: string, mime: string, rand: () => string = randomHex8): string {
  return `${slugifyBasename(originalName)}-${rand()}.${extensionFor(mime, originalName)}`;
}

/** Exactly the shape we write, nothing else: no traversal, no spaces, no
 *  uppercase, always under the media prefix, always with an extension. */
const OBJECT_KEY = new RegExp(`^${MEDIA_PREFIX}/[a-z0-9]+(?:-[a-z0-9]+)*\\.[a-z0-9]{1,5}$`);

export function isValidObjectKey(key: string): boolean {
  return OBJECT_KEY.test(key);
}
