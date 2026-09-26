/* Rendered on Payload's login view (admin.components.beforeLogin). The
   email/password form is hidden because the users collection disables the
   local strategy, so this link is the only way in. */

export function GoogleSignIn() {
  return (
    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
      <a
        href="/api/cms/oauth/google"
        className="btn btn--style-primary btn--size-large"
        style={{ textAlign: 'center', textDecoration: 'none' }}
      >
        Sign in with Google
      </a>
      <p style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem' }}>
        Use your company Google Workspace account. Access is limited to people an admin has added.
      </p>
    </div>
  );
}
