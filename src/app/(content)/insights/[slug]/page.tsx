import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../styles.css';
import { NOTES, noteBySlug, authorPerson } from '../notes';

/* Individual field-note pages at /insights/<slug>. Prerendered from NOTES; any
   slug not in that list 404s. Each page carries its own metadata and a
   BlogPosting schema, and renders the article body in a .prose reading column. */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format an ISO date (yyyy-mm-dd) as e.g. "12 September 2026", parsed from the
 *  string parts so it never shifts by a day across server time zones. */
function humanDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return NOTES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = noteBySlug(slug);
  if (!note) return {};

  const url = `https://blueprintcode.ai/insights/${note.slug}`;
  /* No " — Blueprint Code AI" suffix here. The brand costs 20 characters and
     pushed three of the four note titles past Google's ~60-character limit, so
     they truncated mid-headline. Google already derives and displays the site
     name from the WebSite schema in the root layout, so the suffix bought
     nothing it wasn't going to show anyway. */
  const title = note.title;
  return {
    title,
    description: note.desc,
    alternates: { canonical: url },
    openGraph: {
      ...OG_DEFAULTS,
      title,
      description: note.desc,
      type: 'article',
      url,
    },
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = noteBySlug(slug);
  if (!note) notFound();

  // Sibling notes, for the cross-linking block below the article.
  const related = NOTES.filter((n) => n.slug !== note.slug);

  const url = `https://blueprintcode.ai/insights/${note.slug}`;
  const postSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.desc,
    wordCount: note.wordCount,
    datePublished: note.datePublished,
    dateModified: note.dateModified,
    author: authorPerson(note.author),
    publisher: { '@type': 'Organization', name: 'Blueprint Code AI' },
    mainEntityOfPage: url,
    url,
    isPartOf: {
      '@type': 'Blog',
      name: 'Blueprint Code AI — Field Notes',
      url: 'https://blueprintcode.ai/insights',
    },
  };

  // Breadcrumb trail: Home › Field notes › this article — rendered visibly and
  // as BreadcrumbList structured data so search engines show the hierarchy.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blueprintcode.ai/' },
      { '@type': 'ListItem', position: 2, name: 'Field notes', item: 'https://blueprintcode.ai/insights' },
      { '@type': 'ListItem', position: 3, name: note.title, item: url },
    ],
  };

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="prose">
        <div className="inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="crumbs-sep" aria-hidden="true">/</span>
            <Link href="/insights">Field notes</Link>
            <span className="crumbs-sep" aria-hidden="true">/</span>
            <span aria-current="page">{note.title}</span>
          </nav>
          <p className="note-byline">
            By {note.author} · Published {humanDate(note.datePublished)}
            {note.dateModified !== note.datePublished &&
              ` · Updated ${humanDate(note.dateModified)}`}
          </p>
          {note.content}
        </div>
      </article>

      {related.length > 0 && (
        <section className="related-notes" aria-label="Related field notes">
          <div className="sheet">
            <p className="sheet-no">RELATED FIELD NOTES</p>
            <div className="insights-index">
              {related.map((n) => (
                <Link key={n.slug} className="entry" href={`/insights/${n.slug}`}>
                  <span className="ref">{n.ref}<b>{n.refB}</b></span>
                  <span>
                    <h3>{n.title}</h3>
                    <p>{n.desc}</p>
                  </span>
                  <span className="go">{n.read} →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
