/* Collection hooks that give every media file its immutable stored name
   (see keys.ts) whichever way it arrived:

   - Server-side uploads: the file is renamed before it is written, done.
   - Browser (client) uploads: the plugin has ALREADY put the object in R2
     under the browser's filename, inside a per-document `_objectKey` folder,
     by the time the record is created. So the record is renamed here and,
     once saved, the object is moved to match (one copy + delete). */

import type { CollectionAfterChangeHook, CollectionBeforeOperationHook } from 'payload';
import { buildStoredFilename, maxBytesFor } from './keys';

const ORIGINAL_NAME = 'clientUploadOriginalName';

/** beforeOperation: enforce the size cap, remember the browser's filename for
 *  client uploads, and rename to the stored form. */
export const renameUploadHook: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    const file = req.file as (typeof req.file & { clientUploadContext?: unknown }) | undefined;
    if (file?.name) {
      if (file.size > maxBytesFor(file.mimetype)) {
        throw new Error(`File is too large (limit ${Math.round(maxBytesFor(file.mimetype) / 1024 / 1024)} MB for ${file.mimetype}).`);
      }
      if (file.clientUploadContext) req.context[ORIGINAL_NAME] = file.name;
      file.name = buildStoredFilename(file.name, file.mimetype);
    }
  }
  return args;
};

export type MediaDoc = { filename?: string | null; prefix?: string | null; _objectKey?: string | null; mimeType?: string | null };

/** Where a client-uploaded object is, and where it should be. null when
 *  nothing needs moving (server upload, or names already match). */
export function clientUploadMove(doc: MediaDoc, originalName: string | undefined): { from: string; to: string } | null {
  if (!originalName || !doc._objectKey || !doc.filename || originalName === doc.filename) return null;
  const folder = [doc.prefix, doc._objectKey].filter(Boolean).join('/');
  return { from: `${folder}/${originalName}`, to: `${folder}/${doc.filename}` };
}

export type ObjectMover = (from: string, to: string, contentType: string | undefined) => Promise<void>;

/** afterChange: move a client-uploaded object to the record's filename. */
export function createMoveClientUploadHook(move: ObjectMover): CollectionAfterChangeHook {
  return async ({ doc, operation, req }) => {
    if (operation !== 'create' && operation !== 'update') return doc;
    const originalName = req.context[ORIGINAL_NAME];
    const plan = clientUploadMove(doc as MediaDoc, typeof originalName === 'string' ? originalName : undefined);
    if (plan) {
      await move(plan.from, plan.to, (doc as MediaDoc).mimeType ?? undefined);
      delete req.context[ORIGINAL_NAME];
    }
    return doc;
  };
}
