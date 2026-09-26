'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createCurl, type CurlEngine } from './curl';
import './viewer.css';

const OPEN_MS = 600; // reveal
const CLOSE_MS = 520; // cover-off after teardown

export type DemoView = 'iframe' | 'video';

export interface DemoItem {
  /** Title shown on the cover sheet and the viewer bar. */
  title: string;
  /** Small reference label, e.g. "BPC · VIEWPORT 02.1". */
  ref: string;
  /** Live demo URL, shown in the "Live" view. */
  iframeSrc?: string;
  /** Video URL, shown in the "Video" view. */
  videoSrc?: string;
  /** Poster image for the video. */
  poster?: string;
  /** Which view to open on first show. Defaults to iframe when present, else video. */
  initialView?: DemoView;
}

interface Ctx {
  open: (item: DemoItem) => void;
}

const DemoViewerContext = createContext<Ctx | null>(null);

export function useDemoViewer(): Ctx {
  const ctx = useContext(DemoViewerContext);
  if (!ctx) throw new Error('useDemoViewer must be used inside <DemoViewerProvider>');
  return ctx;
}

/** Convenience trigger: renders a button that opens the viewer for `item`. */
export function DemoTrigger({
  item,
  className,
  children,
}: {
  item: DemoItem;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useDemoViewer();
  return (
    <button type="button" className={className} onClick={() => open(item)}>
      {children}
    </button>
  );
}

export function DemoViewerProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<DemoItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [mediaOn, setMediaOn] = useState(false);
  const [view, setView] = useState<DemoView>('iframe');
  const [status, setStatus] = useState('Loading');
  const [soundOn, setSoundOn] = useState(true);

  const curlHostRef = useRef<HTMLDivElement | null>(null);
  const flatRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const curlRef = useRef<CurlEngine | null>(null);
  const curlTriedRef = useRef(false);
  const openAudioRef = useRef<HTMLAudioElement | null>(null);
  const closeAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const itemRef = useRef<DemoItem | null>(null);
  const busyRef = useRef(false);
  const reduceRef = useRef(false);

  itemRef.current = item;

  // Audio + reduced-motion preference, set up once on the client.
  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const o = new Audio('/media/page-turn-open.mp3');
    const c = new Audio('/media/page-turn-close.mp3');
    o.preload = 'auto';
    c.preload = 'auto';
    o.volume = 0.68;
    c.volume = 0.68;
    openAudioRef.current = o;
    closeAudioRef.current = c;

    try {
      const stored = localStorage.getItem('bpc-viewer-sound');
      if (stored !== null) setSoundOn(stored === 'on');
    } catch { /* ignore */ }

    return () => {
      curlRef.current?.destroy();
      curlRef.current = null;
      document.body.classList.remove('dv-viewing');
    };
  }, []);

  const playSound = useCallback((audio: HTMLAudioElement | null) => {
    if (!soundOn || !audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    } catch { /* ignore */ }
  }, [soundOn]);

  const ensureCurl = useCallback((): CurlEngine | null => {
    if (reduceRef.current) return null;
    if (!curlTriedRef.current) {
      curlTriedRef.current = true;
      if (curlHostRef.current) curlRef.current = createCurl(curlHostRef.current);
    }
    return curlRef.current;
  }, []);

  const open = useCallback((next: DemoItem) => {
    if (busyRef.current) return;
    busyRef.current = true;
    lastTriggerRef.current = (document.activeElement as HTMLElement) ?? null;

    const initial: DemoView =
      next.initialView ?? (next.iframeSrc ? 'iframe' : 'video');

    setItem(next);
    setView(initial);
    setMediaOn(true);
    setStatus('Loading');
    setVisible(true);
    document.body.classList.add('dv-viewing');
    playSound(openAudioRef.current);

    // Wait for the overlay to lay out, then run the reveal.
    requestAnimationFrame(() => {
      closeRef.current?.focus();
      const curl = ensureCurl();
      flatRef.current?.classList.remove('is-on');
      if (!curl) {
        setStatus('Live');
        busyRef.current = false;
        return;
      }
      curl.cover(next.ref, next.title);
      requestAnimationFrame(() => {
        curl.turn(OPEN_MS, 1, () => {
          setStatus('Live');
          busyRef.current = false;
        });
      });
    });
  }, [ensureCurl, playSound]);

  const close = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    playSound(closeAudioRef.current);
    document.body.classList.remove('dv-viewing');
    setStatus('Closed');
    lastTriggerRef.current?.focus?.();

    const cur = itemRef.current;
    const curl = curlRef.current;

    const finish = () => {
      setMediaOn(false);
      setVisible(false);
      setItem(null);
      flatRef.current?.classList.remove('is-on');
      busyRef.current = false;
    };

    if (!curl || reduceRef.current || !cur) {
      finish();
      return;
    }

    // Flat cover over first (imperative, no React batch race), tear media down
    // behind it, then roll the same sheet back on.
    flatRef.current?.classList.add('is-on');
    setMediaOn(false);
    curl.cover(cur.ref, cur.title);
    requestAnimationFrame(() => {
      flatRef.current?.classList.remove('is-on');
      curl.turn(CLOSE_MS, -1, finish);
    });
  }, [playSound]);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      try { localStorage.setItem('bpc-viewer-sound', next ? 'on' : 'off'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const switchView = useCallback((next: DemoView) => {
    if (busyRef.current) return;
    setView(next);
  }, []);

  // Escape closes.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, close]);

  const hasVideo = Boolean(item?.videoSrc);
  const hasIframe = Boolean(item?.iframeSrc);
  const showToggle = hasVideo && hasIframe;

  return (
    <DemoViewerContext.Provider value={{ open }}>
      {children}

      <div className="dv-root" hidden={!visible} aria-hidden={!visible}>
        <div className="dv-scrim" onClick={close} />
        <div className="dv-frame" role="dialog" aria-modal="true" aria-label={item?.title ?? 'Demo viewer'}>
          <i /><i /><i /><i />

          <div className="dv-bar">
            <div>
              <span className="dv-ref">{item?.ref ?? 'VIEWPORT'}</span>
              <span className="dv-title">{item?.title ?? ' '}</span>
            </div>
            <div className="dv-controls">
              {showToggle && (
                <div className="dv-toggle" role="group" aria-label="View mode">
                  <button
                    type="button"
                    aria-pressed={view === 'video'}
                    disabled={!hasVideo}
                    onClick={() => switchView('video')}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    aria-pressed={view === 'iframe'}
                    disabled={!hasIframe}
                    onClick={() => switchView('iframe')}
                  >
                    Live
                  </button>
                </div>
              )}
              <button
                type="button"
                className="dv-sound"
                aria-pressed={soundOn}
                onClick={toggleSound}
              >
                {soundOn ? 'Sound: on' : 'Sound: off'}
              </button>
              <button type="button" className="dv-close" ref={closeRef} onClick={close}>
                Close
              </button>
            </div>
          </div>

          <div className="dv-stage">
            {mediaOn && item && (
              <div className="dv-media">
                {view === 'video' && item.videoSrc ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={item.videoSrc} poster={item.poster} controls autoPlay playsInline />
                ) : item.iframeSrc ? (
                  <iframe src={item.iframeSrc} title={item.title} allow="fullscreen" />
                ) : null}
              </div>
            )}
            <div className="dv-curl-host" ref={curlHostRef} aria-hidden="true" />
            <div className="dv-flat" ref={flatRef} aria-hidden="true" />
          </div>

          <div className="dv-status">
            <span>{item?.ref ?? 'BPC'}</span>
            <span>
              {status}
              {showToggle ? ` · ${view === 'video' ? 'Video' : 'Live'}` : ''}
            </span>
          </div>
        </div>
      </div>
    </DemoViewerContext.Provider>
  );
}
