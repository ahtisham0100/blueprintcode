import type { NextRequest } from 'next/server';
import { handleGoogleCallback } from '@/cms/auth/handlers';
import { oauthDeps } from '@/cms/auth/deps';

export const dynamic = 'force-dynamic';

/** GET /api/cms/oauth/google/callback — Google returns here with ?code&state. */
export function GET(req: NextRequest) {
  return handleGoogleCallback(req, oauthDeps());
}
