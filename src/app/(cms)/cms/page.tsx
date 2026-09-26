/* Placeholder until Payload is mounted here (Phase 2). Its only job is to
   prove the admin-host routing end to end: admin.<domain>/ must land on this
   page, and <domain>/cms must 404. */

export default function CmsPlaceholder() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', maxWidth: 640 }}>
      <h1>BPC CMS</h1>
      <p>Admin host is wired up. The CMS itself is not installed yet.</p>
    </main>
  );
}
