'use client';

/* The login page's mascot: Robo, a blueprint-line robot, on a looping scene.
   It dangles by its antenna from a rope tied to the top-left corner of the
   page, the rope snaps, it tumbles down to its spot below the copy,
   lands on its side, gets up, waves and says a line. Each loop brings the
   next line. The whole timeline is CSS (.bpc-drop in (cms)/custom.css, one
   shared --bpc-loop duration); this component only swaps the line, moves
   the pupils towards the pointer and makes Robo hop when clicked. Under
   prefers-reduced-motion the scene rests on its final pose. */

import { useEffect, useRef, useState } from 'react';

const LINES = [
  'Hi there! 👋',
  'Beep boop, welcome back!',
  'Stuck the landing. Mostly.',
  'I’ve warmed up the editor.',
  'Drafts are safe with me.',
  'Sign in, I’ll hold the door.',
];

function Eye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="bpc-crew__eye">
      <circle cx={cx} cy={cy} r={5} className="bpc-crew__eyeball" />
      <circle cx={cx} cy={cy} r={2.5} className="bpc-crew__pupil" />
    </g>
  );
}

/* The rope's top end in the viewBox before --hx / --hy move it to the page corner. */
const ANCHOR = { x: 200, y: 16 };
/* How far in from the page's left edge the rope is tied, in CSS px. */
const CORNER_INSET = 80;

export function WelcomeCrew() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [line, setLine] = useState(0);
  const [hop, setHop] = useState(false);

  // The rope is tied to the top-left corner of the login page: measure the
  // offset from the rope's resting anchor to that point, in viewBox units,
  // and hand it to the CSS timeline as --hx / --hy.
  useEffect(() => {
    const svg = svgRef.current;
    const page = svg?.closest('.login');
    if (!svg || !page) return;
    const measure = () => {
      // Screen matrix of the viewBox, so letterboxing and scaling are covered.
      const m = svg.getScreenCTM();
      const p = page.getBoundingClientRect();
      const scale = m?.a;
      if (!m || !scale) return;
      const restX = m.e + ANCHOR.x * scale;
      const restY = m.f + ANCHOR.y * m.d;
      const drop = svg.parentElement!;
      drop.style.setProperty('--hx', `${((p.left + CORNER_INSET - restX) / scale).toFixed(1)}px`);
      drop.style.setProperty('--hy', `${((p.top - restY) / scale).toFixed(1)}px`);
    };
    measure();
    // Again once the page's entrance animation has settled.
    const settle = setTimeout(measure, 1000);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      clearTimeout(settle);
      observer.disconnect();
    };
  }, []);

  // Pupils look towards the pointer, at most 2 units off-centre.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      const eye = svg.querySelector('.bpc-crew__eyeball');
      if (!eye) return;
      const r = eye.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      svg.style.setProperty('--px', `${((dx / d) * 2.2).toFixed(2)}px`);
      svg.style.setProperty('--py', `${((dy / d) * 2.2).toFixed(2)}px`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  const nextLine = () => setLine((l) => (l + 1) % LINES.length);

  const poke = () => {
    nextLine();
    setHop(false);
    requestAnimationFrame(() => setHop(true));
  };

  return (
    <div className="bpc-crew">
      <div className="bpc-drop">
        <p key={line} className="bpc-drop__bubble" aria-live="polite">
          {LINES[line]}
        </p>

        <svg ref={svgRef} className="bpc-crew__scene" viewBox="0 -60 420 400" role="img" aria-label="Robo the robot drops in to say hello">
          <path className="bpc-crew__ground" d="M10 320H410" />
          <path className="bpc-crew__dim" d="M10 314v12M410 314v12M150 338h100M150 334v8M250 334v8" />

          {/* landing dust */}
          <circle className="bpc-drop__dust" cx="104" cy="314" r="9" />
          <circle className="bpc-drop__dust bpc-drop__dust--b" cx="296" cy="314" r="9" />

          <g className="bpc-drop__rig" onAnimationIteration={(e) => e.animationName === 'bpc-drop-rig' && nextLine()}>
            {/* rope from the page's top edge down to Robo's antenna */}
            <path className="bpc-drop__knot" d="M188 16h24" />
            <path className="bpc-drop__rope" d="M200 16V106" />
            <path className="bpc-drop__snap" d="M192 62l-8-6M208 62l8-6M192 74l-9 4M208 74l9 4" />

            <g className="bpc-drop__bot">
              <g
                className={`bpc-drop__hop${hop ? ' is-hopping' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Say hi to Robo"
                onClick={poke}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    poke();
                  }
                }}
                onAnimationEnd={(e) => e.animationName === 'bpc-hop' && setHop(false)}
              >
                <g transform="translate(90 60)">
                  <rect className="bpc-crew__hit" x="40" y="36" width="140" height="228" />
                  {/* head */}
                  <path d="M110 70V52" />
                  <circle className="bpc-crew__led" cx="110" cy="46" r="5" />
                  <rect x="80" y="70" width="60" height="46" rx="6" />
                  <Eye cx={97} cy={92} />
                  <Eye cx={123} cy={92} />
                  <path className="bpc-drop__smile" d="M100 104q10 8 20 0" />
                  <ellipse className="bpc-drop__gasp" cx="110" cy="106" rx="4" ry="5" />
                  {/* body */}
                  <path d="M110 116v8" />
                  <rect x="72" y="124" width="76" height="80" rx="6" />
                  <rect x="92" y="140" width="36" height="22" rx="2" />
                  <path className="bpc-crew__accent" d="M98 151h6M110 151h4M118 151h4" />
                  <circle cx="100" cy="182" r="4" />
                  <circle cx="120" cy="182" r="4" />
                  <path d="M92 204v46M128 204v46" />
                  <rect x="80" y="250" width="24" height="10" rx="3" />
                  <rect x="116" y="250" width="24" height="10" rx="3" />
                  {/* arms, one pose per phase */}
                  <g className="bpc-drop__arms bpc-drop__arms--up">
                    <path d="M72 140l-8-44 6-38M148 140l8-44-6-38" />
                    <circle cx="70" cy="52" r="6" />
                    <circle cx="150" cy="52" r="6" />
                  </g>
                  <g className="bpc-drop__arms bpc-drop__arms--flail">
                    <path d="M72 140L44 118l-8-18M148 140l28-22 8-18" />
                    <circle cx="34" cy="94" r="6" />
                    <circle cx="186" cy="94" r="6" />
                  </g>
                  <g className="bpc-drop__arms bpc-drop__arms--down">
                    <path d="M72 140l-16 36 2 14M148 140l16 36-2 14" />
                    <circle cx="58" cy="195" r="6" />
                    <circle cx="162" cy="195" r="6" />
                  </g>
                  <g className="bpc-drop__arms bpc-drop__arms--wave">
                    <path d="M72 140l-16 36 2 14" />
                    <circle cx="58" cy="195" r="6" />
                    <g className="bpc-crew__wave">
                      <path d="M148 138l26-24 6-18" />
                      <circle cx="182" cy="89" r="7" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>

      <p className="bpc-crew__caption">
        <span>Fig. 01 — Robo</span>
        <span>Click Robo to say hi</span>
      </p>
    </div>
  );
}
