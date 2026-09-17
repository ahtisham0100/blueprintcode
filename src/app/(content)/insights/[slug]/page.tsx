import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../styles.css';
import { NOTES, noteBySlug } from '../notes';

/* Individual field-note pages at /insights/<slug>. Prerendered from NOTES; any
   slug not in that list 404s. Each page carries its own metadata and a
   BlogPosting schema, and renders the article body in a .prose reading column. */

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
  const title = `${note.title} — Blueprint Code`;
  return {
    title,
    description: note.desc,
    alternates: { canonical: url },
    openGraph: {
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
    author: { '@type': 'Organization', name: 'Blueprint Code' },
    publisher: { '@type': 'Organization', name: 'Blueprint Code' },
    mainEntityOfPage: url,
    url,
    isPartOf: {
      '@type': 'Blog',
      name: 'Blueprint Code — Field Notes',
      url: 'https://blueprintcode.ai/insights',
    },
  };

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postSchema) }}
      />

      <article className="prose">
        <div className="inner">
          <Link className="note-back" href="/insights">
            ← Field notes
          </Link>
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
