import { handleGoogleStart } from '@/cms/auth/handlers';
import { oauthDeps } from '@/cms/auth/deps';

export const dynamic = 'force-dynamic';

/** GET /api/cms/oauth/google — begin Google sign-in. */
export function GET() {
  return handleGoogleStart(oauthDeps());
}
