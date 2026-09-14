/* Layout for the native content pages (about, configurators, insights,
   ppav-case-study, pricing, prototypes). It loads the full shared blueprint
   stylesheet once for the whole group; each page then imports its own
   page-specific styles on top. The route group name "(content)" does not affect
   the URLs — pages resolve at /about, /configurators, etc.

   The global header/footer come from the root layout; this layout only sets up
   the stylesheet and passes children straight through. */
import './site.css';

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
