/* Pure helpers behind the Media gallery view (components/MediaGallery*).
   Everything that can be unit-tested without React or the network. */

export type GalleryDoc = {
  id: number | string;
  filename?: string | null;
  alt?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  thumbnailURL?: string | null;
  updatedAt?: string;
};

export function formatBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** "1200×800 · 35 KB · PNG" (dimensions only for images). */
export function describeFile(doc: GalleryDoc): string {
  const parts: string[] = [];
  if (doc.width && doc.height) parts.push(`${doc.width}×${doc.height}`);
  parts.push(formatBytes(doc.filesize));
  const ext = (doc.filename ?? '').split('.').pop();
  if (ext && ext !== doc.filename) parts.push(ext.toUpperCase());
  return parts.join(' · ');
}

export function isImage(doc: GalleryDoc): boolean {
  return Boolean(doc.mimeType?.startsWith('image/'));
}

/** Query string for GET <api>/media, searching alt and filename. */
export function galleryQuery(opts: { search?: string; page?: number; limit?: number }): string {
  const p = new URLSearchParams();
  p.set('depth', '0');
  p.set('limit', String(opts.limit ?? 40));
  p.set('page', String(opts.page ?? 1));
  p.set('sort', '-createdAt');
  const s = opts.search?.trim();
  if (s) {
    p.set('where[or][0][alt][contains]', s);
    p.set('where[or][1][filename][contains]', s);
  }
  return p.toString();
}

/** Alt text default from a filename: "muay-thai_HERO v2.png" → "muay thai HERO v2". */
export function altFromFilename(name: string): string {
  return name
    .replace(/\.[a-zA-Z0-9]{1,5}$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Client-upload protocol (what the admin's own uploader does):
   1. POST <api>/storage-s3-generate-signed-url  {collectionSlug, filename, mimeType, filesize}
   2. PUT the bytes to the returned url with the returned headers
   3. POST <api>/media multipart: _payload (data JSON) + file (upload JSON) */

export type SignedUrlResponse = {
  url: string;
  filename: string;
  headers: Record<string, string>;
  clientUploadContext: unknown;
};

export function signedUrlRequestBody(file: { name: string; type: string; size: number }) {
  return { collectionSlug: 'media', filename: file.name, mimeType: file.type, filesize: file.size };
}

export function createRequestFields(signed: SignedUrlResponse, file: { type: string; size: number }, alt: string) {
  return {
    _payload: JSON.stringify({ alt }),
    file: JSON.stringify({
      filename: signed.filename,
      mimeType: file.type,
      size: file.size,
      clientUploadContext: signed.clientUploadContext,
    }),
  };
}

/** What a Payload list drawer's onSelect expects when a file is picked
 *  (the upload field's "Choose from existing" and the editor's image button). */
export function pickArgs(doc: GalleryDoc): { collectionSlug: 'media'; doc: GalleryDoc; docID: string } {
  return { collectionSlug: 'media', doc, docID: String(doc.id) };
}
