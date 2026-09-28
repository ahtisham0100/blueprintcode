/* Lexical → HTML string for post bodies, for places that cannot render React
   (the RSS feed: Next forbids react-dom/server in route handlers). Same
   output decisions as blog/render.tsx, minus site-only chrome: feed readers
   get plain figures, tables, asides and links, no inline styles. Pure. */

import { LinkHTMLConverter, convertLexicalToHTML, type HTMLConvertersFunction } from '@payloadcms/richtext-lexical/html';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { imageSources, internalHref, nodeText, type PostNodeTypes } from './render';
import { slugify } from './slug';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

type MediaLike = Parameters<typeof imageSources>[0] & { alt?: string | null; mimeType?: string | null; filename?: string | null };

const inline: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkHTMLConverter({ internalDocToHref: ({ linkNode }) => internalHref(linkNode) }),
});

const converters: HTMLConvertersFunction<PostNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkHTMLConverter({ internalDocToHref: ({ linkNode }) => internalHref(linkNode) }),
  list: ({ node, nodesToHTML }) => {
    const tag = node.tag === 'ol' ? 'ol' : 'ul';
    return `<${tag}>${nodesToHTML({ nodes: node.children }).join('')}</${tag}>`;
  },
  listitem: ({ node, nodesToHTML }) => `<li>${nodesToHTML({ nodes: node.children }).join('')}</li>`,
  heading: ({ node, nodesToHTML }) => {
    const tag = ['h2', 'h3', 'h4'].includes(node.tag) ? node.tag : 'h2';
    const id = slugify(nodeText(node));
    return `<${tag}${id ? ` id="${id}"` : ''}>${nodesToHTML({ nodes: node.children }).join('')}</${tag}>`;
  },
  paragraph: ({ node, nodesToHTML }) => `<p>${nodesToHTML({ nodes: node.children }).join('')}</p>`,
  quote: ({ node, nodesToHTML }) => `<blockquote>${nodesToHTML({ nodes: node.children }).join('')}</blockquote>`,
  upload: ({ node }) => {
    if (typeof node.value !== 'object' || !node.value) return '';
    const media = node.value as MediaLike;
    const caption = (node.fields as { caption?: string | null } | null)?.caption || '';
    if (!media.mimeType?.startsWith('image/')) {
      return `<p><a href="${escapeHtml(media.url ?? '')}">${escapeHtml(caption || media.filename || media.url || '')}</a></p>`;
    }
    const img = imageSources(media);
    if (!img) return '';
    const dims = img.width && img.height ? ` width="${img.width}" height="${img.height}"` : '';
    return `<figure><img src="${escapeHtml(img.src)}" alt="${escapeHtml(media.alt ?? '')}"${dims} />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
  },
  table: ({ node, nodesToHTML }) => `<table><tbody>${nodesToHTML({ nodes: node.children }).join('')}</tbody></table>`,
  tablerow: ({ node, nodesToHTML }) => `<tr>${nodesToHTML({ nodes: node.children }).join('')}</tr>`,
  tablecell: ({ node, nodesToHTML }) => {
    const tag = node.headerState > 0 ? 'th' : 'td';
    const span = `${node.colSpan && node.colSpan > 1 ? ` colspan="${node.colSpan}"` : ''}${node.rowSpan && node.rowSpan > 1 ? ` rowspan="${node.rowSpan}"` : ''}`;
    return `<${tag}${span}>${nodesToHTML({ nodes: node.children }).join('')}</${tag}>`;
  },
  blocks: {
    callout: ({ node }) => {
      const f = node.fields as { label?: string | null; body?: SerializedEditorState | null };
      const body = f.body ? convertLexicalToHTML({ data: f.body, converters: inline, disableContainer: true }) : '';
      return `<aside>${f.label ? `<p><strong>${escapeHtml(f.label)}</strong></p>` : ''}${body}</aside>`;
    },
    cta: ({ node }) => {
      const f = node.fields as { heading?: string | null; text?: string | null; buttons?: { label: string; href: string }[] | null };
      const links = (f.buttons ?? []).map((b) => `<a href="${escapeHtml(b.href)}">${escapeHtml(b.label)}</a>`).join(' · ');
      return `<div>${f.heading ? `<h3>${escapeHtml(f.heading)}</h3>` : ''}${f.text ? `<p>${escapeHtml(f.text)}</p>` : ''}${links ? `<p>${links}</p>` : ''}</div>`;
    },
    demoEmbed: ({ node }) => {
      // Readers do not run iframes; link to the live demo instead.
      const f = node.fields as { demo: string; title?: string | null; caption?: string | null };
      return `<p><a href="/${escapeHtml(f.demo)}">Open the live prototype: ${escapeHtml(f.title || f.caption || f.demo)} →</a></p>`;
    },
    code: ({ node }) => {
      const f = node.fields as { language?: string | null; code: string };
      return `<pre><code${f.language && f.language !== 'plain' ? ` class="language-${escapeHtml(f.language)}"` : ''}>${escapeHtml(f.code)}</code></pre>`;
    },
  },
});

export function postBodyToHtml(data: SerializedEditorState | null | undefined): string {
  if (!data) return '';
  return convertLexicalToHTML({ data, converters, disableContainer: true, disableIndent: true, disableTextAlign: true });
}
