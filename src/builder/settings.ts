/* Blueprint Builder constants shared by the API, the pages, the CMS panel and
   the tests. Kept dependency-free. */

/** Where the app lives on the PUBLIC host. Never served on the admin host. */
export const BUILDER_PATH = '/builder';
export const BUILDER_API = '/api/builder';

/** Postgres schema for every builder table, apart from `cms` and `public`. */
export const BUILDER_DB_SCHEMA = 'builder';

/** Client session: signed in by magic link. Host-only cookie on the public site. */
export const CLIENT_COOKIE = 'bpcb-client';
export const CLIENT_SESSION_TTL = 14 * 24 * 60 * 60;

/** BPC reviewer session, bound to ONE project, opened from the CMS. */
export const REVIEW_COOKIE = 'bpcb-review';
export const REVIEW_SESSION_TTL = 4 * 60 * 60;
/** The CMS → public-site hand-off link that opens a review session. */
export const REVIEW_LINK_TTL = 5 * 60;

/** Sign-in links are single use and short-lived. */
export const LOGIN_TOKEN_TTL = 15 * 60;

export const LIMITS = {
  /** Largest project JSON accepted on save (a catalogue with photos is the big case). */
  projectBytes: 2_500_000,
  /** Largest request body for anything else. */
  smallBodyBytes: 4_096,
  projectsPerClient: 25,
  /** Sign-in link requests per hour. */
  loginPerEmail: 5,
  loginPerIp: 20,
  /** Submissions per project per hour. */
  submitPerProject: 5,
  projectCreatesPerDay: 50,
} as const;

/** The signing key for every builder token and cookie. Separate from
 *  PAYLOAD_SECRET on purpose: a client session can never be mistaken for a
 *  CMS session, even if one of the keys leaks. */
export function builderSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.BUILDER_SECRET;
  if (!s || s.length < 32) throw new Error('BUILDER_SECRET is not set (32+ characters)');
  return s;
}
