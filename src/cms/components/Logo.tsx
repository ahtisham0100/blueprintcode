/* Login-page brand (admin.components.graphics.Logo). Mirrors the public
   site's header mark: Bebas Neue wordmark + DM Mono label. Styled via
   .bpc-logo in (cms)/custom.css. */

import { CMS_BRAND } from '../branding';

export function Logo() {
  return (
    <span className="bpc-logo">
      <b>{CMS_BRAND.name}</b>
      <span>{CMS_BRAND.label}</span>
    </span>
  );
}
