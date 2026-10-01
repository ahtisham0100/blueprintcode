# Blueprint Builder

See DEV_NOTES.md for architecture, data model and conventions. It now lives inside the bpcode site:
served at /builder, with its server (accounts, saving, sending, BPC review) in `src/builder/`.
See docs/CMS-HANDOFF.md §10 for how the two fit together.

Client-facing discovery and specification tool for Blueprint Code AI Ltd.

## Layout

```
engine/rules.js          Rules engine: request parsing, rule evaluation, coverage, conflict checks, CSV import
engine/discovery.js      Discovery engine: answers, statuses, decision text, section and document states, change control
engine/connections.js    Connecting Tools engine: links, shared data, decision owners, checks, recalculation impact, acceptance tests, document, cinema demo
engine/documents.js      Documents engine: project and per-tool document sets, stable IDs, review states, approvals, comments, diff, coverage, handover
engine/project.js        Project engine: tool suggestion, multiple tools, implied tools, rule sync, history, save/resume
engine/*.test.mjs        Acceptance tests (node:test, no installs)
modules/make_modules.py  Generates categories.json and the intake modules; adds implies links to select_recommend.json
modules/select_recommend.json   Hand-authored detailed discovery for Select & Recommend
modules/connect_tools.json      Generated Connecting Tools questionnaire
data/clothing.json       Sample catalogue and rules
ui/discovery.js          Discovery component
ui/studio.js             Rules Studio component
ui/connections.js        Journey editor: map, connection editor, shared data, decisions, questions, what if, document
ui/documents.js          Blueprint dashboard and document views
ui/server.js             Calls to the site's /api/builder (sign-in, projects, send)
ui/app.js                Project shell: routing, project view, tools, suggestions, save/resume, account sync
app/app_template.html    Page shell and styles
build.mjs                Validates everything and bundles one self-contained page (Node; run by predev/prebuild)
dist/blueprint-builder.html   (built, not committed)
```

## Commands

```
npm run test:builder             # 56 engine tests (also part of npm test at the repo root)
node builder/build.mjs           # validate modules, build dist/blueprint-builder.html
node builder/build.mjs --modules # regenerate the modules first (python3 modules/make_modules.py)
python3 builder/tests/e2e/smoke.py   # browser smoke test (needs Playwright; point it at dist/)
```

## How a project works

1. The client describes the problem. `suggestTools` matches phrases per category and returns
   each suggestion with its reasons and the exact words that triggered it. Nothing is added automatically.
2. The client adds suggested tools, adds their own (any category or Custom), renames and removes them.
   Tool IDs (T-01…) are never reused.
3. Each tool has its own discovery: Select & Recommend is detailed (32 questions); the other categories
   are guided intakes (7 to 10 questions). All share the same answer statuses and document set.
4. Options can carry `implies` (another tool category) and `rules` (a rule template). The project shows
   "Your answers suggest you may also need…" with the tool and question that caused it; the client adds or dismisses it.
   Rule templates sync into that tool's Rules Studio as suggestions; withdrawn when the answer changes,
   or flagged "Answer changed" if already approved.
5. Changing a confirmed answer marks only the documents that answer feeds as Needs review.
6. Everything autosaves on the device; Save file / Open file round-trip the whole project as JSON.
   Signed in (email link), the project also syncs to the client's account and can be sent to BPC.

## Build sequence

1. Rules engine and tests (done)
2. Rules Studio (done)
3. Select & Recommend discovery module (done)
4. Project core: multi-tool projects, tool suggestion, save/resume, change history, affected documents (done)
5. Connecting Tools journey editor and handoff/recalculation engine; three-tool demo (done)
6. Document sets with stable IDs and review states (done)
7. Server: accounts by email link, saving with revision checks, sending, BPC review (done, in the Next app
   rather than a Cloudflare Worker: Neon `builder` schema, Resend, CMS dashboard; see src/builder/)

## Connecting tools

Each connection (C-01…) records from, to, when it fires, which shared fields (F-01…) pass, what the
destination does, what happens when the earlier answer changes (recalculate, clear, mark for review,
keep), and the fallback when data is missing. Loops are allowed; a connection marked "stops here"
ends the loop. Each decision (O-01…: product choice, price, discounts, final recommendation, basket
or quote, plus custom ones) has one owning tool.

`impact()` walks the graph from a changed field or tool and returns every downstream effect in order;
"keep" stops propagation and returning to an earlier tool updates its summary without re-running.
Checks flag: tools not connected, no starting tool, unreachable tools, loops with no stop point, fields
with no owner, fields passed by a tool that neither produces nor receives them, undecided owners.
Removing a tool prunes its connections, ownership and fields. The Tool Map and Connections document
(journey map, shared data model, handoff rules, recalculation, decision ownership, behaviour answers,
open questions, combined acceptance tests CX-AT-01…) exports as Markdown.

## Documents

Project set: P-IDEA, P-JOURNEY, P-MAP (two or more tools), P-DATA, P-TECH, P-ACCESS, P-MVP, P-COVERAGE,
P-RISKS, P-UX. Per tool (T-01-PURPOSE …): Purpose and Users, Journey and States, Inputs and Data,
Business Rules, Outputs, Admin Editing, Exceptions and Fallbacks, Prototype Scope, Production Scope,
Acceptance Tests.

IDs derive from their source so they never renumber: REQ-T-02-SR-A04 (decision), ASM-… (assumption),
Q-… (open question), T-02-R-001 (rule), T-02-FLD-colour (catalogue field), F-01 (shared field),
C-01 (connection), AT-T-02-SR-D03 / AT-T-02-R-001 / AT-T-02-C-01 (tests), CX-AT-C-01-A (combined tests).
P-COVERAGE traces each requirement to its documents, rules and tests.

States: Draft, Needs client input, Ready for client review, Client approved, Needs BPC review (documents
containing BPC recommendations or BPC-sourced rules), BPC approved, and Needs review (changed after
approval). Approval stores the approved text and a hash; a later change shows a line diff and keeps
the approved wording until the changes are approved. Comments attach to any item ID. BPC reviewer mode
comes only from a review session opened from the CMS; the server keeps each side's parts (src/builder/merge.ts).

Exports: full blueprint Markdown, per-document Markdown, print/PDF, developer handover JSON (bpc.handover/1).
