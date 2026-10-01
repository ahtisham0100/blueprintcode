'use client';

/* The Process Blueprinter tool. The markup is rendered here; its behaviour
   lives in src/blueprinter/ui.ts, mounted once the markup is in the DOM. */

import { useEffect, useRef } from 'react';
import { mountBlueprinter } from '@/blueprinter/ui';

export default function ProcessBlueprinter({ builderUrl }: { builderUrl: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? mountBlueprinter(ref.current, { builderUrl }) : undefined), [builderUrl]);

  return (
    <div className="pb" ref={ref}>
      <div className="pb-wrap">
        <section className="pb-hero">
          <span className="pb-kicker">PROCESS BLUEPRINTER</span>
          <h1>Blueprint your current process</h1>
          <p>Lay out how things work today, step by step, and see your Blueprint Code Road: how it could work instead.</p>
        </section>

        <section className="pb-card" aria-labelledby="pb-b-h">
          <span className="step-n">STEP 1</span>
          <h2 id="pb-b-h" tabIndex={-1}>
            Your old road
          </h2>
          <p className="muted" style={{ margin: 0, maxWidth: '70ch' }}>
            Put the steps in the order they happen, from the first contact to the finished order. Drag to reorder or use the arrows. Press the dot on a step to
            mark whether it&apos;s done by hand, and press the arrow between two steps if work goes back and forth between them.
          </p>
          <div className="presets" role="group" aria-label="Start from an example">
            <span className="plbl">Start from:</span>
            <span id="pb-presets" />
          </div>
          <p className="undo" id="pb-undo-bar" hidden>
            <span id="pb-undo-msg" />{' '}
            <button type="button" className="btn ghost" id="pb-undo">
              Undo
            </button>
          </p>
          <ol className="lane" id="pb-lane" aria-label="Your process, in order" />
          <p id="pb-lane-empty" className="muted small" hidden>
            No steps yet. Add some below.
          </p>
          <div className="lane-foot small muted">
            <span id="pb-count" aria-live="polite" />
            <span className="legend">
              <span>
                <span className="dot" aria-hidden="true" />
                Done by hand (press the dot to change)
              </span>
              <span>
                <span aria-hidden="true" className="warn">
                  ↔
                </span>{' '}
                Back and forth (press the arrow to change)
              </span>
            </span>
          </div>
          <div className="palette">
            <h3>Add a step</h3>
            <div className="blocks" id="pb-blocks" />
            <div className="own">
              <label htmlFor="pb-own">Add my own</label>
              <input type="text" id="pb-own" maxLength={40} placeholder="For example: Excel price list, Instagram DMs" />
              <button type="button" className="btn ghost" id="pb-own-add">
                Add
              </button>
              <span id="pb-own-msg" className="msg" role="status" />
            </div>
          </div>
          <div className="gen">
            <button type="button" className="btn big" id="pb-generate">
              Generate my blueprint
            </button>
            <span id="pb-gen-msg" className="msg" role="status" />
          </div>
        </section>

        <section className="pb-card" id="pb-result" aria-labelledby="pb-r-h" hidden>
          <span className="step-n">STEP 2</span>
          <h2 id="pb-r-h" tabIndex={-1}>
            Your Blueprint Code Road
          </h2>
          <p className="stale" id="pb-stale" hidden>
            You&apos;ve changed your steps since this was drawn.{' '}
            <button type="button" className="btn ghost" id="pb-regen">
              Update my blueprint
            </button>
          </p>
          <div className="diagram" id="pb-diagram" />
          <div className="bar">
            <button type="button" className="btn ghost" id="pb-dl-png">
              Download image
            </button>
            <button type="button" className="btn ghost" id="pb-dl-svg">
              Download SVG
            </button>
            <button type="button" className="btn ghost" data-go="pb-b-h">
              Change my process
            </button>
          </div>
          <h3 className="changes-h">What changes</h3>
          <ul className="changes" id="pb-changes" />
          <p className="disc">An illustration based on the steps you entered. The full blueprint works out the detail with you.</p>
        </section>

        <section className="pb-cta" id="pb-cta" aria-labelledby="pb-c-h" hidden>
          <div>
            <span className="step-n">STEP 3</span>
            <h2 id="pb-c-h">Want to turn this into a defined project?</h2>
            {builderUrl ? (
              <p>The full Blueprint Builder takes this further: the right tools, your rules, how they connect, and a reviewable specification.</p>
            ) : (
              <p>Tell us about it and we&apos;ll work out the right tools, your rules and how they connect with you.</p>
            )}
            <p className="small" id="pb-cta-areas" style={{ marginTop: 8 }} />
          </div>
          <a className="btn big" id="pb-cta-link" href={builderUrl ?? '/contact'}>
            {builderUrl ? 'Build the full blueprint →' : 'Talk to us about it →'}
          </a>
        </section>
      </div>
      <p className="sr" id="pb-live" role="status" aria-live="polite" />
    </div>
  );
}
