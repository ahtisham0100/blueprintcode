// Accessibility (WCAG) plans — single source of truth.
//
// Rendered by sheet 04 of /pricing and by the dedicated
// /services/wcag-compliance-audit-pricing page, and fed into that page's
// Offer structured data. Edit a price or a line here and both pages (and the
// schema) change together, so the published rates can never disagree.

export interface AccessibilityPlan {
  name: string;
  /** Display rate, exactly as printed on the schedule. */
  rate: string;
  /** Prefix the rate with a small "from". */
  from?: boolean;
  /** Numeric GBP price for structured data: the lower bound where it's a range. */
  price: number;
  /** Upper bound, where the published rate is a range. */
  maxPrice?: number;
  /** Billing period, where the plan is recurring. */
  per?: 'month';
  summary: string;
  features: string[];
  note?: { label: string; text: string };
}

export interface AccessibilityStage {
  id: string;
  title: string;
  range: string;
  plans: AccessibilityPlan[];
}

export const ACCESSIBILITY_STAGES: AccessibilityStage[] = [
  {
    id: 'check',
    title: 'Stage 01 — Check',
    range: 'FREE – £295',
    plans: [
      {
        name: 'Instant WCAG Check',
        rate: 'Free',
        price: 0,
        summary: 'An automated scan of a page, on demand.',
        features: [
          'Automated WCAG 2.2 A & AA checks',
          'Issues ranked by severity',
          'Each mapped to its success criterion',
          'Report on screen and by email',
        ],
        note: { label: 'Next:', text: 'the Health Check, when you want a person to read the results.' },
      },
      {
        name: 'Accessibility Health Check',
        rate: '£295',
        price: 295,
        summary: 'The automated results, interpreted by someone who does this work.',
        features: [
          'Automated scan across up to 5 key pages',
          'Manual review of the findings, false positives removed',
          'Keyboard-only walkthrough of one core journey',
          'Prioritised summary: what to fix first, and why',
          'A 30-minute call to talk it through',
        ],
        note: { label: 'Credited:', text: 'the £295 comes off a full audit booked within 90 days.' },
      },
    ],
  },
  {
    id: 'audit',
    title: 'Stage 02 — Audit',
    range: 'FROM £995',
    plans: [
      {
        name: 'WCAG 2.2 AA Audit',
        rate: '£995',
        from: true,
        price: 995,
        summary: 'Manual and automated audit of a standard content or marketing site.',
        features: [
          'Up to 15 representative page templates',
          'Manual testing: keyboard, screen reader, zoom and reflow',
          'Automated scanning across the same sample',
          'Every issue mapped to its WCAG 2.2 success criterion',
          'Severity, user impact and a recommended fix for each',
          'Written report and a prioritised remediation plan',
          'Walkthrough call with whoever will do the fixing',
        ],
        note: { label: 'Ideal for:', text: 'brochure sites, content sites, lead-generation sites.' },
      },
      {
        name: 'Ecommerce / Complex Audit',
        rate: '£1,750',
        from: true,
        price: 1750,
        summary: 'The journeys a template-level audit never reaches.',
        features: [
          'Everything in the WCAG 2.2 AA Audit',
          'Basket, checkout and payment journeys',
          'Account creation, sign-in and order history',
          'Multi-step forms, validation and error recovery',
          'Interactive components: modals, filters, carousels, date pickers',
          'Configurators and other bespoke widgets',
          'Screen-reader testing of each journey end to end',
        ],
        note: { label: 'Ideal for:', text: 'WooCommerce, Shopify, portals, booking systems, configurators.' },
      },
    ],
  },
  {
    id: 'fix',
    title: 'Stage 03 — Fix',
    range: 'FROM £2,500',
    plans: [
      {
        name: 'Audit + Remediation',
        rate: '£2,500',
        from: true,
        price: 2500,
        summary: 'Find the issues, then actually fix them.',
        features: [
          'Full WCAG 2.2 AA audit, as above',
          'Code-level fixes applied to your site',
          'Semantic HTML, ARIA, focus management and keyboard order',
          'Contrast, text spacing, reflow and zoom corrections',
          'Form labelling and error handling rebuilt where needed',
          'Re-test against the original report',
          'An accessibility statement you can publish',
        ],
        note: { label: 'The difference:', text: 'most audit firms scope the fix separately, or not at all.' },
      },
      {
        name: 'Complex remediation',
        rate: '£3.5–7.5k+',
        price: 3500,
        maxPrice: 7500,
        summary: 'Larger estates and genuinely difficult interfaces.',
        features: [
          'Everything in Audit + Remediation',
          'Ecommerce checkouts and customer portals',
          'Configurators and interactive product tools',
          'Component library and design-system level fixes',
          'Third-party and plugin failures worked around or replaced',
          'Regression testing across every template',
          'Handover: what changed, and how to keep it that way',
        ],
        note: { label: 'Scope:', text: 'quoted after the audit, so the number reflects the real work.' },
      },
    ],
  },
  {
    id: 'monitor',
    title: 'Stage 04 — Monitor',
    range: '£99 – £199 / MONTH',
    plans: [
      {
        name: 'Monitoring Essentials',
        rate: '£99',
        price: 99,
        per: 'month',
        summary: 'Per month. Accessibility doesn’t stay fixed on its own.',
        features: [
          'Monthly automated scan of your key templates',
          'Regression alerts when a release breaks something',
          'Running issue log with severity and history',
          'Email support',
        ],
      },
      {
        name: 'Monitoring Plus',
        rate: '£199',
        price: 199,
        per: 'month',
        summary: 'Per month. Scanning, plus a person who reads it.',
        features: [
          'Everything in Monitoring Essentials',
          'Fortnightly scanning across the full estate',
          'Human review of new issues, false positives removed',
          'Quarterly keyboard and screen-reader spot check',
          'Your accessibility statement kept current',
          'Priority routing into remediation',
        ],
      },
    ],
  },
];

/** How the testing is done — applies to every paid stage. */
export const ACCESSIBILITY_METHOD = [
  'Keyboard-only operation of every journey',
  'Screen readers: NVDA on Windows, VoiceOver on macOS and iOS',
  '400% zoom and 320px reflow',
  'Colour contrast, and state shown by more than colour',
  'Automated scanning as a sweep, never as the verdict',
];

/** What a paid engagement delivers. */
export const ACCESSIBILITY_DELIVERABLES = [
  'A written report, issue by issue, with the failing element',
  'The WCAG 2.2 success criterion and level for each',
  'Severity, and the real-world impact on a user',
  'A recommended fix a developer can act on',
  'A prioritised plan: what to fix first, what can wait',
];
