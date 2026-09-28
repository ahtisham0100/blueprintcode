/* Small pure formatters for the blog pages. */

/** A populated relation, or null when Payload left it as an id. */
export function rel<T extends object>(v: T | number | string | null | undefined): T | null {
  return v && typeof v === 'object' ? v : null;
}

/** "2026-09-12T10:00:00.000Z" → "12 September 2026", in UTC so the day never shifts by server time zone. */
export function humanDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** "12 SEP 2026" for the small-caps stamps. */
export function stampDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

export function readLabel(minutes: number | null | undefined): string {
  return `${Math.max(1, minutes ?? 1)} MIN READ`;
}

/** Share-intent URLs for a post. */
export function shareLinks(url: string, title: string): { label: string; href: string }[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: 'Email', href: `mailto:?subject=${t}&body=${u}` },
  ];
}
