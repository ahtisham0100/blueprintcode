import { ACCESSIBILITY_STAGES } from '@/lib/accessibilityPlans';

/* The four WCAG stages (check, audit, fix, monitor) as schedule bands. Shared
   by sheet 04 of /pricing and /services/wcag-compliance-audit-pricing so both
   print the same plans from the same data. Relies on the pricing stylesheet
   (.band, .row2, .item) being loaded by the page. */
export default function AccessibilityStages({ anchors = false }: { anchors?: boolean }) {
  return (
    <>
      {ACCESSIBILITY_STAGES.map((stage) => (
        <div key={stage.id}>
          <div className="band" id={anchors ? `plan-${stage.id}` : undefined}>
            <h3>{stage.title}</h3>
            <span className="range">{stage.range}</span>
          </div>
          <div className="row2">
            {stage.plans.map((plan) => (
              <div className="item" key={plan.name}>
                <div className="item-top">
                  <h4>{plan.name}</h4>
                  <span className="rate">
                    {plan.from && <span className="from">from</span>}
                    {plan.rate}
                  </span>
                </div>
                <p>{plan.summary}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {plan.note && (
                  <p className="note">
                    <b>{plan.note.label}</b> {plan.note.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
