import type { Metadata } from 'next';
import AdminForm from './AdminForm';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin — Deploy demo',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminForm />;
}
