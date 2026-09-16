/* Shared admin gate. Same single-password model as /api/deploy-demo: the password
   is checked server-side, per request, against ADMIN_PASSWORD. */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** True when ADMIN_PASSWORD is set and `password` matches it. */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(password, expected);
}
