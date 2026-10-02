'use client';

import { useRef } from 'react';

const DWP_URL = 'https://accessibility-manual.dwp.gov.uk/tools-and-resources/automated-accessibility-testing';

/* "Why automated scans aren't enough" reference. A native <dialog> opened with
   showModal(), so the browser handles the focus trap, Escape and returning
   focus to the trigger. Clicking the backdrop also closes it. */
export default function EvidenceDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="evidence-link" onClick={() => ref.current?.showModal()}>
        Why automated scans aren&rsquo;t enough <span aria-hidden="true">→</span>
      </button>

      <dialog
        ref={ref}
        className="evidence"
        aria-labelledby="evidence-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="evidence-head">
          <span>REFERENCE / AUTOMATED ACCESSIBILITY TESTING</span>
          <button type="button" className="evidence-close" aria-label="Close reference" onClick={() => ref.current?.close()}>
            ×
          </button>
        </div>
        <div className="evidence-body">
          <span className="lbl">INDEPENDENT GUIDANCE / UK GOVERNMENT DWP</span>
          <h2 id="evidence-title">Why scanners only tell part of the story.</h2>
          <p>The UK Department for Work and Pensions Accessibility Manual cites a Government Digital Service audit of automated accessibility tools. Of 142 known accessibility issues, the best individual tools found only around 30&ndash;40%.</p>
          <div className="evidence-stat">
            <strong>30&ndash;40%</strong>
            <span>of the 142 known accessibility issues in the cited GDS audit were detected by the best individual automated tools.</span>
          </div>
          <p>DWP guidance says automated tools are useful for quickly finding obvious barriers, but they are not enough to guarantee accessibility. Its recommended testing approach also includes manual testing and assistive-software testing.</p>
          <p className="evidence-flow">BPC APPROACH &nbsp; AUTOMATED SCAN → HUMAN REVIEW → REMEDIATION → RETEST</p>
          <p><b style={{ color: 'var(--ink)' }}>The BPC scanner is reconnaissance, not certification.</b> It helps identify and prioritise machine-detectable issues so the deeper work can focus where human judgement is required.</p>
          <a className="button" href={DWP_URL} target="_blank" rel="noopener noreferrer">
            View DWP accessibility guidance ↗<span className="hp"> (opens in a new tab)</span>
          </a>
        </div>
      </dialog>
    </>
  );
}
