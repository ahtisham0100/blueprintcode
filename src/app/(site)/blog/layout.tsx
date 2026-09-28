/* Layout for the blog (/blog, /blog/<slug>, /blog/category/<slug>, /blog/page/n).
   Loads the shared blueprint stylesheet the native content pages use, plus the
   blog's own styles. The global header/footer come from the root layout. */
import '../(content)/site.css';
import './blog.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
