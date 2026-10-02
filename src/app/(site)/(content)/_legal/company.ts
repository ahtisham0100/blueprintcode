/* The company facts every legal page, the footer disclosure and the legal hub
   read from. UK company law requires the registered name, number, registered
   office and place of registration to be legible on the website, so change them
   here and nowhere else. */
export const COMPANY = {
  legalName: 'Blueprint Code AI Ltd',
  tradingName: 'Blueprint Code AI',
  number: '17490525',
  registeredIn: 'England and Wales',
  office: '66 Paul Street, London, England, EC2A 4NA',
  email: 'hello@blueprintcode.ai',
  /** ICO data protection fee registration number. Empty hides the line. */
  icoNumber: '',
} as const;

/** The revision date shown on every legal document. Bump it with any change
 *  to the substance of a policy. */
export const LEGAL_UPDATED = '2 October 2026';

/** The legal documents, in footer and hub order. */
export const LEGAL_DOCS = [
  { href: '/privacy', title: 'Privacy Policy', short: 'Privacy', summary: 'How BPC collects, uses, stores and protects personal information.' },
  { href: '/cookies', title: 'Cookie & Tracking Policy', short: 'Cookies', summary: 'What the website stores on your device and how you control the optional parts.' },
  { href: '/terms', title: 'Website Terms of Use', short: 'Terms', summary: 'The rules for using BPC websites, public tools, demonstrations and prototypes.' },
  { href: '/accessibility', title: 'Accessibility Statement', short: 'Accessibility', summary: 'Our approach to accessible websites and tools, and how to report a problem.' },
  { href: '/tool-terms', title: 'Automated Tools & Scanner Terms', short: 'Tool terms', summary: 'What automated assessments, the Process Blueprinter and AI-assisted outputs can and can’t tell you.' },
] as const;
