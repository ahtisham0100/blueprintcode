'use client';

/* "View live" in the edit header of Posts and Demos (beforeDocumentControls),
   next to Preview. Shown once the document has a published version, linking
   the PUBLISHED slug on the public site. If the section's flag is off it
   says so instead of linking to a 404. Props come from the collection config
   (clientProps), read when the server starts — flags only change on deploy. */

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import { liveLinkState } from '../liveLink';
import { CMS_ROUTES } from '../settings';
import { Glyph } from './Glyph';

export type LiveLinkProps = { siteUrl: string; pathPrefix: string; sectionPublic: boolean; flagName: string };

export function LiveLink({ siteUrl, pathPrefix, sectionPublic, flagName }: LiveLinkProps) {
  const { id, collectionSlug, hasPublishedDoc, savedDocumentData } = useDocumentInfo();
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // The saved record without ?draft is the published version; re-read after every save.
  useEffect(() => {
    if (!id || !collectionSlug || !hasPublishedDoc) {
      setPublishedSlug(null);
      return;
    }
    let cancelled = false;
    fetch(`${CMS_ROUTES.api}/${collectionSlug}/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { slug?: string; _status?: string } | null) => {
        if (!cancelled) setPublishedSlug(doc?._status === 'published' && doc.slug ? doc.slug : null);
      })
      .catch(() => !cancelled && setPublishedSlug(null));
    return () => {
      cancelled = true;
    };
  }, [id, collectionSlug, hasPublishedDoc, savedDocumentData?.updatedAt]);

  const state = liveLinkState({ siteUrl, pathPrefix, hasPublishedDoc, publishedSlug, sectionPublic, flagName });
  if (state.kind === 'none') return null;
  if (state.kind === 'off') {
    return (
      <span className="bpc-live-link is-off" title={`${state.reason} Live URL will be ${state.href}`}>
        <Glyph name="globe" size={14} />
        Not live yet
      </span>
    );
  }
  return (
    <a className="bpc-live-link" href={state.href} target="_blank" rel="noopener noreferrer" title={state.href}>
      <Glyph name="globe" size={14} />
      View live
      <Glyph name="external" size={12} />
    </a>
  );
}
