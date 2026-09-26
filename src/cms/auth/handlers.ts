/* The two OAuth route handlers, with every external dependency injected
   (see deps.ts for the real wiring). Start: redirect to Google with a
   state (CSRF) and nonce (replay) pinned in short-lived cookies. Callback:
   check state, exchange the code, verify the id_token, authorize, issue the
   session cookie, land in the CMS. */

import type { NextRequest } from 'next/server';
import { authorizeGoogleClaims, type AllowlistedUser } from './authorize';
import { buildGoogleAuthUrl, type GoogleClaims } from './google';
import { SESSION_TTL_SECONDS, readCookie, sessionCookie, signSession } from './session';

export type OAuthDeps = {
  clientId: string;
  clientSecret: string;
  /** Origin of the admin host, e.g. https://admin.blueprintcode.ai */
  serverUrl: string;
  allowedDomain: string;
  /** PAYLOAD_SECRET, used to sign the session. */
  secret: string;
  secure: boolean;
  exchangeCode: (args: { code: string; clientId: string; clientSecret: string; redirectUri: string }) => Promise<string>;
  verifyIdToken: (idToken: string, opts: { clientId: string; nonce: string | undefined }) => Promise<GoogleClaims>;
  findUserByEmail: (email: string) => Promise<AllowlistedUser | null>;
};

const STATE_COOKIE = 'bpc-oauth-state';
const NONCE_COOKIE = 'bpc-oauth-nonce';
const TEMP_COOKIE_TTL = 600;

export const CALLBACK_PATH = '/api/cms/oauth/google/callback';

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function tempCookie(name: string, value: string, secure: boolean, maxAge = TEMP_COOKIE_TTL): string {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function text(status: number, body: string, extraCookies: string[] = []): Response {
  const headers = new Headers({ 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  for (const c of extraCookies) headers.append('set-cookie', c);
  return new Response(body, { status, headers });
}

export function handleGoogleStart(d: OAuthDeps): Response {
  const state = randomToken();
  const nonce = randomToken();
  const headers = new Headers({
    location: buildGoogleAuthUrl({
      clientId: d.clientId,
      redirectUri: d.serverUrl + CALLBACK_PATH,
      state,
      nonce,
      hostedDomain: d.allowedDomain,
    }),
    'cache-control': 'no-store',
  });
  headers.append('set-cookie', tempCookie(STATE_COOKIE, state, d.secure));
  headers.append('set-cookie', tempCookie(NONCE_COOKIE, nonce, d.secure));
  return new Response(null, { status: 302, headers });
}

export async function handleGoogleCallback(req: NextRequest, d: OAuthDeps): Promise<Response> {
  const q = req.nextUrl.searchParams;
  const clear = [tempCookie(STATE_COOKIE, '', d.secure, 0), tempCookie(NONCE_COOKIE, '', d.secure, 0)];

  const googleError = q.get('error');
  if (googleError) return text(400, `Google sign-in was not completed (${googleError}).`, clear);

  const code = q.get('code');
  const state = q.get('state');
  const expectedState = readCookie(req.headers, STATE_COOKIE);
  if (!code || !state || !expectedState || state !== expectedState) {
    return text(400, 'Sign-in state is missing or does not match. Start again from the login page.', clear);
  }
  const nonce = readCookie(req.headers, NONCE_COOKIE) ?? undefined;

  let claims: GoogleClaims;
  try {
    const idToken = await d.exchangeCode({
      code,
      clientId: d.clientId,
      clientSecret: d.clientSecret,
      redirectUri: d.serverUrl + CALLBACK_PATH,
    });
    claims = await d.verifyIdToken(idToken, { clientId: d.clientId, nonce });
  } catch {
    return text(401, 'Could not verify the Google sign-in. Start again from the login page.', clear);
  }

  const result = await authorizeGoogleClaims(claims, {
    allowedDomain: d.allowedDomain,
    findUserByEmail: d.findUserByEmail,
  });
  if (!result.ok) {
    return text(
      403,
      `Access denied (${result.reason}). Sign in with a @${d.allowedDomain} account that has been given CMS access.`,
      clear,
    );
  }

  const token = await signSession({ userId: String(result.user.id), email: result.user.email }, d.secret);
  const headers = new Headers({ location: `${d.serverUrl}/cms`, 'cache-control': 'no-store' });
  headers.append('set-cookie', sessionCookie(token, { secure: d.secure, maxAge: SESSION_TTL_SECONDS }));
  for (const c of clear) headers.append('set-cookie', c);
  return new Response(null, { status: 302, headers });
}
