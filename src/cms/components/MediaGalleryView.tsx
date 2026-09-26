/* Replaces Payload's table list view for the Media collection
   (Media.admin.components.views.list). Server side: takes the page Payload
   already fetched and hands it to the client gallery. */

import type { ListViewServerProps } from 'payload';
import { CMS_ROUTES } from '../settings';
import type { GalleryDoc } from '../media/gallery';
import { MediaGallery } from './MediaGallery.client';

export function MediaGalleryView(props: ListViewServerProps) {
  const { data, hasCreatePermission, user } = props;
  const role = (user as { role?: string } | null)?.role;
  return (
    <MediaGallery
      initialDocs={(data?.docs ?? []) as GalleryDoc[]}
      initialTotal={data?.totalDocs ?? 0}
      initialPage={data?.page ?? 1}
      totalPages={data?.totalPages ?? 1}
      canUpload={Boolean(hasCreatePermission)}
      canDelete={role === 'admin'}
      apiRoute={CMS_ROUTES.api}
      editBase={`${CMS_ROUTES.admin}/collections/media`}
    />
  );
}
