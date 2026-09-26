/* Google OpenID Connect, authorization-code flow, no library. Three pieces:
   the authorization URL, the code → id_token exchange, and id_token
   verification against Google's published keys. Network and crypto are
   injectable so the pieces are unit-testable. */

import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export function buildGoogleAuthUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  hostedDomain: string;
}): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', args.state);
  url.searchParams.set('nonce', args.nonce);
  // hd is only a UI hint (pre-selects the Workspace account); the real domain
  // check is on the verified token's hd claim in authorize.ts.
  url.searchParams.set('hd', args.hostedDomain);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export async function exchangeCodeForIdToken(
  args: { code: string; clientId: string; clientSecret: string; redirectUri: string },
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchFn(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: args.code,
      client_id: args.clientId,
      client_secret: args.clientSecret,
      redirect_uri: args.redirectUri,
    }).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as { id_token?: unknown; error?: unknown };
  if (!res.ok || typeof json.id_token !== 'string') {
    throw new Error(`Google token exchange failed (${res.status}): ${String(json.error ?? 'no id_token')}`);
  }
  return json.id_token;
}

export type GoogleClaims = {
  sub: string;
  email: string;
  emailVerified: boolean;
  hd?: string;
  name?: string;
};

export type IdTokenVerifier = (
  token: string,
  opts: { issuer: string[]; audience: string },
) => Promise<{ payload: Record<string, unknown> }>;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));
const defaultVerifier: IdTokenVerifier = (token, opts) => jwtVerify(token, jwks, opts);

/** Verifies signature, issuer, audience and expiry (via the verifier) and the
 *  nonce (here), then returns the identity claims we care about. */
export async function verifyGoogleIdToken(
  idToken: string,
  opts: { clientId: string; nonce: string | undefined },
  verify: IdTokenVerifier = defaultVerifier,
): Promise<GoogleClaims> {
  const { payload } = await verify(idToken, { issuer: ISSUERS, audience: opts.clientId });
  if (opts.nonce !== undefined && payload.nonce !== opts.nonce) {
    throw new Error('Google id_token nonce mismatch');
  }
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Google id_token is missing sub/email');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    hd: typeof payload.hd === 'string' ? payload.hd : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}
