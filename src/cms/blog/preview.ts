/* Post previews: same mechanism as demo previews (demos/preview.ts) with
   its own audience and path, /blog-preview/<id>?token=…, served on the
   public host. */

import { PREVIEW_AUDIENCES, previewPath, signPreviewToken, verifyPreviewToken } from '../demos/preview';

export const POST_PREVIEW_BASE = '/blog-preview';

export function signPostPreviewToken(postId: string | number, secret: string, opts: { now?: number } = {}): Promise<string> {
  return signPreviewToken(postId, secret, { ...opts, audience: PREVIEW_AUDIENCES.posts });
}

export function verifyPostPreviewToken(token: string, postId: string | number, secret: string, opts: { now?: number } = {}): Promise<boolean> {
  return verifyPreviewToken(token, postId, secret, { ...opts, audience: PREVIEW_AUDIENCES.posts });
}

export function postPreviewPath(postId: string | number, token: string): string {
  return previewPath(postId, token, POST_PREVIEW_BASE);
}
