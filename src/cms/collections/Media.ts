/* Media library: images, video, PDFs and 3D models, stored in R2 (see
   media/storage.ts) and served from MEDIA_PUBLIC_URL (media/urls.ts). */

import type { Access, CollectionBeforeOperationHook, CollectionConfig } from 'payload';
import { ALLOWED_MIME_TYPES, buildStoredFilename, maxBytesFor } from '../media/keys';
import { isAdmin } from './Users';

type CmsUser = { role?: string } | null;

/** Admins and writers upload and edit; only admins delete. */
export const canManageMedia: Access = ({ req }) => {
  const role = (req.user as CmsUser)?.role;
  return role === 'admin' || role === 'writer';
};

/** Give every upload its immutable stored name and enforce the size cap. */
const renameUpload: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    const file = req.file;
    if (file?.name) {
      if (file.size > maxBytesFor(file.mimetype)) {
        throw new Error(`File is too large (limit ${Math.round(maxBytesFor(file.mimetype) / 1024 / 1024)} MB for ${file.mimetype}).`);
      }
      file.name = buildStoredFilename(file.name, file.mimetype);
    }
  }
  return args;
};

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
    adminThumbnail: 'thumb',
    focalPoint: true,
    crop: true,
  },
  hooks: {
    beforeOperation: [renameUpload],
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
