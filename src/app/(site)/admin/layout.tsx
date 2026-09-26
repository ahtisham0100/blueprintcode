import type { Metadata } from 'next';
import Link from 'next/link';
import './admin.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-shell">
      <nav className="adm-nav" aria-label="Admin sections">
        <span className="adm-nav-brand">BPC ADMIN</span>
        <Link href="/admin">Deploy demo</Link>
        <Link href="/admin/demos">Demos</Link>
        <Link href="/admin/leads">Leads</Link>
      </nav>
      {children}
    </div>
  );
}
