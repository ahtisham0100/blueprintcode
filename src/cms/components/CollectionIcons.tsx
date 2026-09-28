/* admin.components.beforeNavLinks: a <style> tag that gives every collection
   its icon in the sidebar, on the dashboard cards and on list page titles
   (cms/icons.ts). CSS keyed on Payload's own ids, so Payload's nav and
   cards stay stock. Renders nothing visible. */

import { collectionIconCss } from '../icons';

const CSS = collectionIconCss();

export function CollectionIcons() {
  return <style data-bpc-icons="" dangerouslySetInnerHTML={{ __html: CSS }} />;
}
