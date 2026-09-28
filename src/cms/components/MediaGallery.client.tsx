'use client';

/* The Media library as a gallery: thumbnail grid, search, paging, a
   "Copy URL" chip per file, and drag-and-drop upload anywhere on the page
   using the same browser → R2 signed-URL flow as Payload's own uploader
   (see media/gallery.ts for the protocol). Styled by .bpc-gallery in
   (cms)/custom.css. */

import { toast } from '@payloadcms/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Glyph } from './Glyph';
import {
  altFromFilename,
  createRequestFields,
  describeFile,
  galleryQuery,
  isImage,
  signedUrlRequestBody,
  type GalleryDoc,
  type SignedUrlResponse,
} from '../media/gallery';

type Props = {
  initialDocs: GalleryDoc[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  canUpload: boolean;
  canDelete: boolean;
  apiRoute: string;
  editBase: string;
};

type Upload = { name: string; status: 'uploading' | 'done' | 'error'; message?: string };

export function MediaGallery(p: Props) {
  const [docs, setDocs] = useState(p.initialDocs);
  const [total, setTotal] = useState(p.initialTotal);
  const [page, setPage] = useState(p.initialPage);
  const [pages, setPages] = useState(p.totalPages);
  const [search, setSearch] = useState('');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const load = useCallback(
    async (opts: { search?: string; page?: number }) => {
      const res = await fetch(`${p.apiRoute}/media?${galleryQuery(opts)}`, { credentials: 'include' });
      if (!res.ok) {
        toast.error('Could not load media.');
        return;
      }
      const json = await res.json();
      setDocs(json.docs ?? []);
      setTotal(json.totalDocs ?? 0);
      setPage(json.page ?? 1);
      setPages(json.totalPages ?? 1);
    },
    [p.apiRoute],
  );

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => void load({ search, page: 1 }), 250);
    return () => clearTimeout(t);
  }, [search, load]);

  const copyUrl = async (doc: GalleryDoc) => {
    if (!doc.url) return;
    await navigator.clipboard.writeText(doc.url);
    toast.success('URL copied');
  };

  const uploadOne = useCallback(
    async (file: File) => {
      const signedRes = await fetch(`${p.apiRoute}/storage-s3-generate-signed-url`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(signedUrlRequestBody(file)),
      });
      if (!signedRes.ok) throw new Error((await signedRes.json().catch(() => ({})))?.errors?.[0]?.message ?? `Could not prepare upload (${signedRes.status})`);
      const signed = (await signedRes.json()) as SignedUrlResponse;

      const put = await fetch(signed.url, { method: 'PUT', headers: signed.headers, body: file });
      if (!put.ok) throw new Error(`Storage rejected the file (${put.status})`);

      const form = new FormData();
      for (const [k, v] of Object.entries(createRequestFields(signed, file, altFromFilename(file.name)))) form.set(k, v);
      const created = await fetch(`${p.apiRoute}/media`, { method: 'POST', credentials: 'include', body: form });
      if (!created.ok) throw new Error((await created.json().catch(() => ({})))?.errors?.[0]?.message ?? `Could not save (${created.status})`);
      return (await created.json()).doc as GalleryDoc;
    },
    [p.apiRoute],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploads((u) => [...list.map((f) => ({ name: f.name, status: 'uploading' as const })), ...u]);
      for (const file of list) {
        try {
          const doc = await uploadOne(file);
          setDocs((d) => [doc, ...d]);
          setTotal((t) => t + 1);
          setUploads((u) => u.map((x) => (x.name === file.name && x.status === 'uploading' ? { ...x, status: 'done' } : x)));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          setUploads((u) => u.map((x) => (x.name === file.name && x.status === 'uploading' ? { ...x, status: 'error', message } : x)));
          toast.error(`${file.name}: ${message}`);
        }
      }
      setTimeout(() => setUploads((u) => u.filter((x) => x.status !== 'done')), 4000);
    },
    [uploadOne],
  );

  // Page-wide drag and drop.
  useEffect(() => {
    if (!p.canUpload) return;
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      dragDepth.current++;
      setDragging(true);
    };
    const leave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };
    const over = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      void uploadFiles(e.dataTransfer.files);
    };
    document.addEventListener('dragenter', enter);
    document.addEventListener('dragleave', leave);
    document.addEventListener('dragover', over);
    document.addEventListener('drop', drop);
    return () => {
      document.removeEventListener('dragenter', enter);
      document.removeEventListener('dragleave', leave);
      document.removeEventListener('dragover', over);
      document.removeEventListener('drop', drop);
    };
  }, [p.canUpload, uploadFiles]);

  return (
    <div className={`bpc-gallery${dragging ? ' bpc-gallery--dragging' : ''}`}>
      <header className="bpc-gallery__head">
        <h1 className="bpc-title-with-icon">
          <Glyph name="media" size={26} />
          Media
        </h1>
        <span className="bpc-gallery__count">{total} file{total === 1 ? '' : 's'}</span>
        <input
          className="bpc-gallery__search"
          type="search"
          placeholder="Search by alt or filename"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search media"
        />
        {p.canUpload && (
          <>
            <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => fileInput.current?.click()}>
              Upload
            </button>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => e.target.files && void uploadFiles(e.target.files)} />
          </>
        )}
      </header>

      {uploads.length > 0 && (
        <ul className="bpc-gallery__uploads" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={`${u.name}-${i}`} className={`is-${u.status}`}>
              {u.status === 'uploading' ? 'Uploading' : u.status === 'done' ? 'Uploaded' : 'Failed'} · {u.name}
              {u.message ? ` — ${u.message}` : ''}
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 ? (
        <p className="bpc-gallery__empty">
          {search ? 'Nothing matches that search.' : p.canUpload ? 'No files yet. Drop images, video, PDFs or 3D models anywhere on this page.' : 'No files yet.'}
        </p>
      ) : (
        <ul className="bpc-gallery__grid">
          {docs.map((doc) => (
            <li key={doc.id} className="bpc-card">
              <a className="bpc-card__media" href={`${p.editBase}/${doc.id}`} title="Open">
                {isImage(doc) && (doc.thumbnailURL || doc.url) ? (
                  <img src={doc.thumbnailURL || doc.url || ''} alt={doc.alt ?? ''} loading="lazy" />
                ) : (
                  <span className="bpc-card__type">{(doc.filename ?? '').split('.').pop()?.toUpperCase()}</span>
                )}
              </a>
              <div className="bpc-card__body">
                <a className="bpc-card__name" href={`${p.editBase}/${doc.id}`}>
                  {doc.alt || doc.filename}
                </a>
                <span className="bpc-card__meta">{describeFile(doc)}</span>
                <button type="button" className="bpc-chip" onClick={() => void copyUrl(doc)} title={doc.url ?? ''}>
                  Copy URL
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="bpc-gallery__pages" aria-label="Pages">
          <button type="button" className="btn btn--style-secondary btn--size-small" disabled={page <= 1} onClick={() => void load({ search, page: page - 1 })}>
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button type="button" className="btn btn--style-secondary btn--size-small" disabled={page >= pages} onClick={() => void load({ search, page: page + 1 })}>
            Next
          </button>
        </nav>
      )}

      {dragging && <div className="bpc-gallery__drop">Drop to upload</div>}
    </div>
  );
}
