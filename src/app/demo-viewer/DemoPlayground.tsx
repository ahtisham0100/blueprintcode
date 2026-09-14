'use client';

import { DemoViewerProvider, DemoTrigger, type DemoItem } from '../_demo-viewer/DemoViewer';
import './styles.css';

/* Sample data for verification. Swap iframeSrc / videoSrc for real ones later.
   - iframeSrc values point at existing public demo routes.
   - videoSrc values are external sample clips (replaceable placeholders). */
const ITEMS: (DemoItem & { blurb: string; tag: string })[] = [
  {
    title: 'Cinema Room Planner',
    ref: 'BPC · VIEWPORT 02.1',
    iframeSrc: '/premium-muay-thai-customiser',
    blurb: 'Opens a live demo behind the blueprint sheet.',
    tag: 'Live iframe only',
  },
  {
    title: '3D Cabinet Configurator',
    ref: 'BPC · VIEWPORT 02.2',
    iframeSrc: '/maison-cacao-demo-suite',
    videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    initialView: 'iframe',
    blurb: 'Has both a walkthrough video and the live tool — use the toggle.',
    tag: 'Video + Live toggle',
  },
  {
    title: 'Guided Product Selector',
    ref: 'BPC · VIEWPORT 02.3',
    videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    blurb: 'A recorded walkthrough only, opened with the same curl + sound.',
    tag: 'Video only',
  },
];

export default function DemoPlayground() {
  return (
    <DemoViewerProvider>
      <section className="dvx">
        <div className="sheet">
          <p className="sheet-no">DEMO VIEWER — COMPONENT PREVIEW</p>
          <h2>See the work moving.</h2>
          <p className="lead">Nothing loads until it&apos;s asked for. Selecting a frame opens the demo behind a blueprint sheet, which turns off the board to reveal it — with the page-turn sound. The middle card carries both a video and a live embed, so the viewer shows the Video / Live toggle.</p>

          <div className="viewports">
            {ITEMS.map((it) => (
              <div className="vp" key={it.ref}>
                <div className="media">
                  <i /><i /><i /><i />
                  <DemoTrigger className="see" item={it}>See media</DemoTrigger>
                </div>
                <h3>{it.title}</h3>
                <p>{it.blurb}</p>
                <span className="tag">{it.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DemoViewerProvider>
  );
}
