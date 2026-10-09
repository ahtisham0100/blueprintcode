import type { Metadata } from 'next';
import Pricing from './Pricing';
import './pricing.css';

/* /medusa-partner/pricing — the Medusa Heads pricing page, public (no NDA),
   linked from the confidential partner brief. It mirrors the pricing page on
   medusaheads.com, which stays the canonical URL. Not in the sitemap for the
   same reason. */

const TITLE = 'Medusa Heads — Pricing';
const DESCRIPTION =
  'Choose how Medusa hunts. From £149 a month: qualified opportunities, not lists. Top up with a Purse when you need more.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://medusaheads.com/pricing.html' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', url: '/medusa-partner/pricing' },
  twitter: { card: 'summary' },
};

export default function MedusaPricingPage() {
  return (
    <>
      <header>
        <div className="brand">
          <img src="/medusa/mark.svg" alt="" width="34" height="34" />
          <div className="brandname">
            MEDUSA HEADS<small>COMMERCIAL OPPORTUNITY INTELLIGENCE</small>
          </div>
        </div>
        <div className="meta">
          PRICING <b>/ CHOOSE YOUR HUNT</b>
        </div>
      </header>
      <Pricing />
      <footer>
        <span>MEDUSA HEADS / COMMERCIAL OPPORTUNITY INTELLIGENCE</span>
        <span>QUALITY STAYS PREMIUM · VOLUME SCALES</span>
      </footer>
    </>
  );
}
