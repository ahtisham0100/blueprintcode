/* The custom blocks a writer can drop into a post body (BlocksFeature in the
   Posts editor). Each has a matching converter in blog/render.tsx, a plain-
   text rule in blog/readingTime.ts and an import rule in blog/htmlToLexical.ts. */

import { BoldFeature, InlineCodeFeature, ItalicFeature, LinkFeature, ParagraphFeature, UnderlineFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';
import { validateDemoSlug } from '../demos/slug';

export const BLOCK_SLUGS = ['callout', 'cta', 'demoEmbed', 'code'] as const;
export type BlockSlug = (typeof BLOCK_SLUGS)[number];

/** A boxed note beside the prose: small-caps label + a short rich paragraph. */
export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Callout', plural: 'Callouts' },
  fields: [
    { name: 'label', type: 'text', admin: { description: 'Small label above the note, e.g. "Planning note".' } },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: lexicalEditor({ features: () => [ParagraphFeature(), BoldFeature(), ItalicFeature(), UnderlineFeature(), InlineCodeFeature(), LinkFeature()] }),
    },
  ],
};

/** Call to action: optional heading/text and up to three buttons. */
export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'text', type: 'textarea' },
    {
      name: 'buttons',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true, admin: { description: 'Site path (/contact) or full URL.' } },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'solid',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Outline', value: 'outline' },
          ],
        },
      ],
    },
  ],
};

/** A demo from blueprintcode.ai/<slug>, embedded in an iframe. */
export const DemoEmbedBlock: Block = {
  slug: 'demoEmbed',
  interfaceName: 'DemoEmbedBlock',
  labels: { singular: 'Demo embed', plural: 'Demo embeds' },
  fields: [
    {
      name: 'demo',
      type: 'text',
      required: true,
      validate: (v: unknown) => validateDemoSlug(v) ?? true,
      admin: { description: 'The demo’s slug: the part after blueprintcode.ai/ (e.g. premium-muay-thai-customiser).' },
    },
    { name: 'title', type: 'text', admin: { description: 'Accessible name for the frame (defaults to the slug).' } },
    { name: 'caption', type: 'text' },
    { name: 'height', type: 'number', defaultValue: 640, min: 240, max: 2000, admin: { description: 'Frame height in pixels.' } },
  ],
};

export const CODE_LANGUAGES = ['plain', 'html', 'css', 'javascript', 'typescript', 'json', 'bash', 'python', 'sql'] as const;

/** A code sample. */
export const CodeBlock: Block = {
  slug: 'code',
  interfaceName: 'CodeSampleBlock',
  labels: { singular: 'Code block', plural: 'Code blocks' },
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'plain',
      options: CODE_LANGUAGES.map((l) => ({ label: l, value: l })),
    },
    { name: 'code', type: 'code', required: true },
  ],
};

export const POST_BLOCKS: Block[] = [CalloutBlock, CtaBlock, DemoEmbedBlock, CodeBlock];
