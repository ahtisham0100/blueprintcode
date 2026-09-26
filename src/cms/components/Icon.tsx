/* Small brand icon (admin.components.graphics.Icon): shown in the admin nav
   and header. The public site's logo, unchanged. */

import { CMS_BRAND } from '../branding';

export function Icon() {
  // Plain <img>: next/image is not needed for a 28px static asset and would
  // pull the public site's image config into the admin bundle.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="bpc-icon" src={CMS_BRAND.iconSrc} alt="" width={28} height={28} />;
}
