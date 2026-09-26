/* Media library: images, video, PDFs and 3D models, stored in R2 (see
   media/storage.ts) and served from MEDIA_PUBLIC_URL (media/urls.ts). */

import type { Access, CollectionConfig } from 'payload';
import { createMoveClientUploadHook, renameUploadHook } from '../media/hooks';
import { ALLOWED_MIME_TYPES, MEDIA_PREFIX } from '../media/keys';
import { r2MoveObject } from '../media/storage';
import { mediaFileUrl } from '../media/urls';
import { isAdmin } from './Users';

type CmsUser = { role?: string } | null;

/** Admins and writers upload and edit; only admins delete. */
export const canManageMedia: Access = ({ req }) => {
  const role = (req.user as CmsUser)?.role;
  return role === 'admin' || role === 'writer';
};

type ThumbDoc = {
  filename?: string | null;
  mimeType?: string | null;
  prefix?: string | null;
  _objectKey?: string | null;
  sizes?: { thumb?: { filename?: string | null } | null } | null;
};

/** Admin-panel thumbnail, built from the stored filenames rather than the
 *  size URLs (which Payload has not populated yet when it asks). Payload's
 *  default would point at its own /api/…/file route, which does not exist
 *  for off-server storage. The folder is prefix + the per-document
 *  _objectKey that browser uploads get (media/hooks.ts). Non-images get no
 *  thumbnail (icon instead). */
export function adminThumbnailUrl({ doc }: { doc: ThumbDoc }): string | null {
  if (!doc.mimeType?.startsWith('image/')) return null;
  const filename = doc.sizes?.thumb?.filename || doc.filename;
  if (!filename) return null;
  const folder = [doc.prefix || MEDIA_PREFIX, doc._objectKey].filter(Boolean).join('/');
  return mediaFileUrl(`${folder}/${filename}`);
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    description: 'Images, video, PDFs and 3D models. Copy a file’s URL to use it in demo HTML.',
  },
  access: {
    create: canManageMedia,
    update: canManageMedia,
    delete: isAdmin,
    read: () => true,
  },
  upload: {
    disableLocalStorage: true,
    mimeTypes: ALLOWED_MIME_TYPES,
    // WebP variants for pages; originals are kept untouched.
    imageSizes: [
      { name: 'thumb', width: 400, height: undefined, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'medium', width: 800, height: undefined, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'large', width: 1600, height: undefined, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: adminThumbnailUrl,
    focalPoint: true,
    crop: true,
  },
  hooks: {
    beforeOperation: [renameUploadHook],
    afterChange: [createMoveClientUploadHook(r2MoveObject)],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describes the image for screen readers and search engines.' },
    },
    { name: 'caption', type: 'text' },
  ],
};
