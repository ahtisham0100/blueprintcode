import type { Metadata } from 'next';
import ContactForm from './ContactForm';
import './contact.css';

export const metadata: Metadata = {
  title: 'Start a project — Blueprint Code AI',
  description:
    'Tell us what you’re building, where you are and what success looks like. We’ll review it personally and recommend the next step.',
  alternates: { canonical: 'https://blueprintcode.ai/contact' },
  openGraph: {
    title: 'Start a project — Blueprint Code AI',
    description:
      'Tell us what you’re building and what success looks like. We review every enquiry personally and normally reply within one working day.',
    type: 'website',
    url: 'https://blueprintcode.ai/contact',
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
