/* Header-bar "Log out" (admin.components.actions). Payload's own logout
   lives at the bottom of the account page and the side nav; this puts it
   one click away. /cms/logout is Payload's logout view: it expires the
   bpc-token cookie and returns to the login page. */

import { CMS_ROUTES } from '../settings';

export function LogoutAction() {
  return (
    <a className="btn btn--style-secondary btn--size-small bpc-logout" href={`${CMS_ROUTES.admin}/logout`}>
      Log out
    </a>
  );
}
