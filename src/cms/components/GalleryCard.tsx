/* One file in the Media gallery. Two modes:
   - browsing (the Media page): the thumbnail and name link to the file's
     edit page, and the chip copies the URL;
   - picking (the gallery opened by "Choose from existing" or the editor's
     image button): the whole card is a button that selects the file, and
     nothing navigates away from the document being edited.
   Presentational only; MediaGallery.client.tsx decides the mode. */

import { describeFile, isImage, type GalleryDoc } from '../media/gallery';

type Props = {
  doc: GalleryDoc;
  editBase: string;
  onCopy: (doc: GalleryDoc) => void;
  /** Present in picking mode. */
  onPick?: (doc: GalleryDoc) => void;
};

function Thumb({ doc }: { doc: GalleryDoc }) {
  return isImage(doc) && (doc.thumbnailURL || doc.url) ? (
    <img src={doc.thumbnailURL || doc.url || ''} alt={doc.alt ?? ''} loading="lazy" />
  ) : (
    <span className="bpc-card__type">{(doc.filename ?? '').split('.').pop()?.toUpperCase()}</span>
  );
}

export function GalleryCard({ doc, editBase, onCopy, onPick }: Props) {
  const name = doc.alt || doc.filename;
  if (onPick) {
    return (
      <li className="bpc-card is-pickable">
        <button type="button" className="bpc-card__pick" onClick={() => onPick(doc)} aria-label={`Select ${name}`}>
          <span className="bpc-card__media">
            <Thumb doc={doc} />
          </span>
          <span className="bpc-card__body">
            <span className="bpc-card__name">{name}</span>
            <span className="bpc-card__meta">{describeFile(doc)}</span>
            <span className="bpc-chip">Select</span>
          </span>
        </button>
      </li>
    );
  }
  return (
    <li className="bpc-card">
      <a className="bpc-card__media" href={`${editBase}/${doc.id}`} title="Open">
        <Thumb doc={doc} />
      </a>
      <div className="bpc-card__body">
        <a className="bpc-card__name" href={`${editBase}/${doc.id}`}>
          {name}
        </a>
        <span className="bpc-card__meta">{describeFile(doc)}</span>
        <button type="button" className="bpc-chip" onClick={() => onCopy(doc)} title={doc.url ?? ''}>
          Copy URL
        </button>
      </div>
    </li>
  );
}
