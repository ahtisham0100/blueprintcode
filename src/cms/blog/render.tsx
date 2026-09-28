/* Lexical → React for post bodies. Payload's default converters cover the
   text-level nodes; the ones here own the markup the site's stylesheet
   expects (media frames, tables, callouts, CTAs, demo embeds, code) and
   resolve links and uploads to site URLs. Pure: used by the post page, the
   preview page and (via renderToStaticMarkup) the RSS feed. */

import type { DefaultNodeTypes, SerializedBlockNode, SerializedLinkNode, SerializedUploadNode } from '@payloadcms/richtext-lexical';
import { type JSXConvertersFunction, LinkJSXConverter, RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { ReactNode } from 'react';
import { slugify } from './slug';

/* ---- helpers --------------------------------------------------------------- */

type MediaLike = {
  url?: string | null;
  alt?: string | null;
  mimeType?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null } | null | undefined> | null;
};

/** Best image source for the reading column plus a srcset of the WebP sizes. */
export function imageSources(media: MediaLike): { src: string; srcSet?: string; width?: number; height?: number } | null {
  if (!media.url) return null;
  const sizes = media.sizes ?? {};
  const candidates = ['medium', 'large']
    .map((k) => sizes[k])
    .filter((s): s is { url: string; width: number; height?: number | null } => Boolean(s?.url && s?.width));
  const large = sizes.large?.url ? sizes.large : null;
  return {
    src: large?.url ?? media.url,
    srcSet: candidates.length ? candidates.map((s) => `${s.url} ${s.width}w`).join(', ') : undefined,
    width: (large?.width ?? media.width) || undefined,
    height: (large?.height ?? media.height) || undefined,
  };
}

/** Where an internal link (to a post) points. Unresolved relations fall back to the blog index. */
export function internalHref(linkNode: SerializedLinkNode): string {
  const doc = linkNode.fields.doc;
  if (!doc) return '/blog';
  const value = doc.value as { slug?: string } | number | string;
  const slug = typeof value === 'object' && value ? value.slug : undefined;
  if (doc.relationTo === 'posts' && slug) return `/blog/${slug}`;
  if (doc.relationTo === 'demos' && slug) return `/${slug}`;
  return '/blog';
}

/** Plain text of a node's descendants (for heading ids). */
export function nodeText(node: { children?: unknown }): string {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const x = n as { type?: string; text?: string; children?: unknown[] };
    if (x.type === 'text' && typeof x.text === 'string') out.push(x.text);
    if (Array.isArray(x.children)) x.children.forEach(walk);
  };
  walk(node);
  return out.join('');
}

/* ---- block field shapes (mirror blog/blocks.ts) ---------------------------- */

type CalloutFields = { blockType: 'callout'; label?: string | null; body?: SerializedEditorState | null };
type CtaFields = { blockType: 'cta'; heading?: string | null; text?: string | null; buttons?: { label: string; href: string; style?: string | null; id?: string | null }[] | null };
type DemoEmbedFields = { blockType: 'demoEmbed'; demo: string; title?: string | null; caption?: string | null; height?: number | null };
type CodeFields = { blockType: 'code'; language?: string | null; code: string };
type PostBlockFields = CalloutFields | CtaFields | DemoEmbedFields | CodeFields;

export type PostNodeTypes = DefaultNodeTypes | SerializedBlockNode<PostBlockFields>;

/* ---- converters ------------------------------------------------------------ */

/** Inline-only converters for nested rich text (callout bodies). */
const inlineConverters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: ({ linkNode }) => internalHref(linkNode) }),
});

export const postConverters: JSXConvertersFunction<PostNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: ({ linkNode }) => internalHref(linkNode) }),

  // Plain list markup: the site stylesheet draws its own markers.
  list: ({ node, nodesToJSX }) => {
    const Tag = node.tag === 'ol' ? 'ol' : 'ul';
    return <Tag start={Tag === 'ol' && node.start && node.start !== 1 ? node.start : undefined}>{nodesToJSX({ nodes: node.children })}</Tag>;
  },
  listitem: ({ node, nodesToJSX }) => <li>{nodesToJSX({ nodes: node.children })}</li>,

  heading: ({ node, nodesToJSX }) => {
    const Tag = (['h2', 'h3', 'h4'].includes(node.tag) ? node.tag : 'h2') as 'h2' | 'h3' | 'h4';
    const id = slugify(nodeText(node));
    return <Tag id={id || undefined}>{nodesToJSX({ nodes: node.children })}</Tag>;
  },

  upload: ({ node }) => {
    const n = node as SerializedUploadNode;
    if (typeof n.value !== 'object' || !n.value) return null;
    const media = n.value as MediaLike;
    const caption = (n.fields as { caption?: string | null } | null)?.caption || null;
    if (!media.mimeType?.startsWith('image/')) {
      return (
        <p>
          <a href={media.url ?? '#'} rel="noopener noreferrer">
            {caption || media.filename || media.url}
          </a>
        </p>
      );
    }
    const img = imageSources(media);
    if (!img) return null;
    return (
      <figure className="post-figure">
        <img src={img.src} srcSet={img.srcSet} sizes="(max-width: 760px) 100vw, 720px" alt={media.alt ?? ''} width={img.width} height={img.height} loading="lazy" decoding="async" />
        {caption && <figcaption className="media-caption">{caption}</figcaption>}
      </figure>
    );
  },

  table: ({ node, nodesToJSX }) => (
    <div className="table-wrap">
      <table>
        <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
      </table>
    </div>
  ),
  tablerow: ({ node, nodesToJSX }) => <tr>{nodesToJSX({ nodes: node.children })}</tr>,
  tablecell: ({ node, nodesToJSX }) => {
    const Tag = node.headerState > 0 ? 'th' : 'td';
    const colSpan = node.colSpan && node.colSpan > 1 ? node.colSpan : undefined;
    const rowSpan = node.rowSpan && node.rowSpan > 1 ? node.rowSpan : undefined;
    return (
      <Tag colSpan={colSpan} rowSpan={rowSpan} scope={Tag === 'th' ? 'col' : undefined}>
        {nodesToJSX({ nodes: node.children })}
      </Tag>
    );
  },

  blocks: {
    callout: ({ node }) => {
      const f = node.fields as CalloutFields;
      return (
        <aside className="note">
          {f.label && <span className="data">{f.label}</span>}
          {f.body && <RichText data={f.body} converters={inlineConverters} disableContainer />}
        </aside>
      );
    },
    cta: ({ node }) => {
      const f = node.fields as CtaFields;
      return (
        <div className="post-cta">
          {f.heading && <h3>{f.heading}</h3>}
          {f.text && <p>{f.text}</p>}
          {f.buttons && f.buttons.length > 0 && (
            <div className="actions">
              {f.buttons.map((b, i) => (
                <a key={b.id ?? i} className={b.style === 'outline' ? 'button' : 'button solid'} href={b.href}>
                  {b.label}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    },
    demoEmbed: ({ node }) => {
      const f = node.fields as DemoEmbedFields;
      const height = f.height && f.height >= 240 ? f.height : 640;
      return (
        <figure className="post-demo">
          <div className="media media--demo" style={{ aspectRatio: 'auto', height }}>
            <i />
            <i />
            <i />
            <i />
            <iframe src={`/${f.demo}`} title={f.title || f.demo} loading="lazy" allow="fullscreen" />
          </div>
          <figcaption className="media-caption">
            <span>{f.caption || f.title || 'LIVE PROTOTYPE'}</span>
            <a href={`/${f.demo}`} target="_blank" rel="noopener">
              OPEN FULL SCREEN →
            </a>
          </figcaption>
        </figure>
      );
    },
    code: ({ node }) => {
      const f = node.fields as CodeFields;
      return (
        <pre className="post-code" data-language={f.language || 'plain'}>
          <code>{f.code}</code>
        </pre>
      );
    },
  },
});

/** The rendered body, without a wrapping div (the page supplies the column). */
export function PostBody({ data, className }: { data: SerializedEditorState | null | undefined; className?: string }): ReactNode {
  if (!data) return null;
  return <RichText data={data} converters={postConverters} disableContainer={!className} className={className} />;
}
