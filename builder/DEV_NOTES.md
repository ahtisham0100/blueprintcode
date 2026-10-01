# Blueprint Builder: developer notes

Blueprint Code AI Ltd. Last updated 29 September 2026.

Blueprint Builder is the client-facing discovery and specification tool. A client describes a problem,
gets tool suggestions, completes discovery per tool, defines rules, connects tools into one journey,
and ends up with a reviewable document set and a developer handover. It produces a specification,
not a quote or an approved design, and the UI says so wherever it matters.

**Status:** build steps 1 to 7 are done. Step 7 (server, email, sign-in) was built inside the bpcode
Next.js site instead of a Cloudflare Worker; section 12 describes what exists. The site's
docs/CMS-HANDOFF.md §10 is the authoritative account of the server side.

---

## 1. Quick start

Requirements: Node 20+ (tests only, no installs), Python 3.10+ (build). Playwright is optional, for the smoke test.

From the repo root:

```
npm run test:builder              # 56 engine tests (node:test); npm test runs them after the site's Vitest suite
node builder/build.mjs            # validate, build builder/dist/blueprint-builder.html (also run by predev and prebuild)
node builder/build.mjs --modules  # regenerate the modules first (needs Python 3.10+)
python3 builder/tests/e2e/smoke.py   # 15 browser checks against the built page (needs Playwright + Chromium)
```

`npm run dev` serves it at http://127.0.0.1:5000/builder (with `BUILDER_PUBLIC=on`). Opened directly as a
file it still works, device-only: no sign-in, nothing sent. Use **Load the cinema demo project** for a
populated three-tool project.

---

## 2. Rules of the road

1. **Generators, not hand edits.** `dist/` is built by `build.mjs`; `modules/*.json` (except
   `select_recommend.json`) and `modules/categories.json` are written by `modules/make_modules.py`.
   Edit the generator, run `node builder/build.mjs --modules`, and commit the regenerated JSON (the site
   build only needs Node, so it never regenerates them). Hand edits to generated files are overwritten.
2. **`select_recommend.json` is hand-authored**, but `make_modules.py` patches its `implies` links on
   every run (see `SR_IMPLIES`). Edit implies there, not in the JSON.
3. **Engines stay pure.** Nothing in `engine/` touches the DOM, storage or the network. They run
   unchanged in the browser, in Node tests and on the server (`src/builder/engines.ts` imports them to
   check every saved project and to generate what is sent).
4. **IDs are never reused or renumbered.** Tool IDs (T-01…), rule IDs, connection IDs (C-01…) and
   field IDs (F-01…) increment from the highest ever used. Document item IDs derive from their source
   (see section 8), so regenerating documents never shifts them.
5. **Test first for wording.** If a client phrase isn't recognised, add it to the phrasing test in
   `engine/project.test.mjs`, watch it fail, then add the pattern.
6. **British English** in all client-facing copy. Sentence case, plain verbs, no filler.
7. **Accessibility is not optional**: every control labelled, keyboard operable, focus moved
   deliberately after re-renders, status changes announced through the live region.

---

## 3. Repository layout

```
engine/
  rules.js            Rules engine: request parsing, rule evaluation, coverage, rule checks, CSV import
  discovery.js        Discovery engine: answers, statuses, decision text, section/document state, change log
  connections.js      Connecting Tools: links, shared fields, decision owners, checks, impact, tests, doc, demo
  project.js          Project: tool suggestion, signals, unmatched text, tools, implied tools, rule sync, status, save/resume
  documents.js        Documents: project and per-tool sets, IDs, states, approval, diff, comments, coverage, handover
  *.test.mjs          Engine tests
modules/
  make_modules.py     Source of truth for categories, suggestion patterns, signals and the intake modules
  categories.json     Generated: 6 service areas + Custom, with patterns and signals
  select_recommend.json   Hand-authored detailed discovery (32 questions) + rule templates + example
  configure|plan|quote|connect|audit|custom.json   Generated guided intakes (7 to 10 questions each)
  connect_tools.json  Generated Connecting Tools questionnaire
data/clothing.json    Sample catalogue (32 items), request context and 10 sample rules
ui/
  discovery.js        Discovery component
  studio.js           Rules Studio component
  connections.js      Journey editor component
  documents.js        Blueprint dashboard and document views
  server.js           Calls to /api/builder (sign-in, projects, send)
  app.js              Shell: routing, project page, persistence, account sync, sending, review mode
app/app_template.html Page shell and all CSS
build.mjs             Validates modules and patterns, bundles everything into dist/
tests/e2e/smoke.py    Browser smoke test
```

About 4,200 lines of JavaScript and Python in total. No runtime dependencies.

---

## 4. Build and bundling

`build.mjs` (a Node port of the original build.py):

1. Runs `modules/make_modules.py` only with `--modules`.
2. Validates every module: unique question IDs, `summary` has `{value}`, `affects` names real
   documents, options exist and are unique, rule templates exist, `implies` names a real category,
   `show_if` points to an **earlier** question, example answers are valid. Also compiles every
   suggestion and signal pattern. Any error stops the build.
3. Bundles engines in this order, each wrapped in its own function scope with `import` lines stripped
   and `export default X;` turned into `return X;`:
   `Engine` (rules), `Discovery`, `Connections`, `Project`, `Documents`.
   Order matters: later engines reference earlier ones by global name.
4. Appends the UI files: discovery, studio, connections, documents, server, app.
5. Embeds `{ categories, signals, modules, sample }` as JSON in `#app-data`.

Engines must end with `export default Name;` and must not use `import` for anything except sibling
engines already earlier in the bundle order.

---

## 5. Data model

Everything lives in one project record (`schema: "bpc.project/1"`), saved to `localStorage` and
exported/imported as JSON.

```js
{
  schema, id: "P-XXXXXX", name, description, created, updated, version,
  suggestions: { text, at, items: [Suggestion], signals: [Signal], unmatched: [string] },
  tools: [Tool], removed_tools: [{ id, name, removed }],
  dismissed: ["T-01:SR-A04:quote", ...],        // implied-tool suggestions the client rejected
  connections: Connections | undefined,          // created when first opened with 2+ tools
  reviews: { [docId]: { client: { at, hash, text }, bpc: { at, hash }, clarify: { at, text, resolved } } },
  comments: { [itemId]: [{ at, by: "client" | "bpc", doc, text }] },
  events: [{ at, type, text, tool? }]            // project-level history
}

Tool = {
  id: "T-01", name, category, module,
  source: { type: "suggested" | "implied" | "client", from, reason },
  discovery: DiscoveryState,
  studio?: { cat: Catalogue, rules: [Rule], open, tab, req, ctx, preview }   // Select & Recommend only
}

DiscoveryState = {
  answers: { [qid]: { value, other, status, wording } },
  sections: { [sectionId]: { status: "confirmed" | "needs_review", at, snapshot } },
  current, history: [ChangeEntry], version
}
```

Answer `status`: `confirmed` (default when answered), `assumption`, `unknown` ("I don't know"),
`bpc` (asked BPC to advise), `bpc_accepted` (client accepted BPC's recommendation).
`wording` is a client edit of the generated decision sentence.

`Project.deserialise` validates the schema and module references and fills missing structure. When the
schema changes, add migration there and bump the schema string.

---

## 6. Modules (discovery questionnaires)

```js
{
  module: { id, name, schema: "bpc.discovery/1", depth: "full" | "intake", intro },
  documents: [{ id, title }],                   // the documents this module feeds
  rule_templates: { [key]: RuleWithoutId },     // optional
  sections: [{ id, title, intro, questions: [Question] }],
  example?: { tool_name?, answers: { [qid]: { value?, status? } } }
}

Question = {
  id: "SR-A04", type: "single" | "multi" | "text" | "textarea", label, hint?, required?,
  summary: "Success means the customer {value}.",   // sentence used in the decision summary
  affects: ["outputs", "acceptance"],               // documents this answer feeds
  recommend?: "BPC's recommendation, shown on Ask BPC to advise",
  show_if?: { q: "SR-B01", in: ["guided", "mix"] } | { q, has_selection: true },
  options?: [{ id, label, other?, exclusive?, rules?: [templateKey], implies?: [{ category, reason }] }]
}
```

Option labels are written lower-case to read inside the summary sentence; the UI capitalises them
for display.

**Adding a question:** add it in `make_modules.py` (or `select_recommend.json`), give it `affects`,
rebuild. The validator catches most mistakes.

**Adding a category:** add to `CATEGORIES` with `module`, `prefix` and patterns, add an entry to
`INTAKES`, rebuild. A category with a Rules Studio is currently hard-wired to `select` in
`Project.addTool`; generalise that when a second full module arrives.

---

## 7. Engines

### 7.1 Tool suggestion (`project.js`)

- `suggestTools(categories, text)`: each pattern is a regex fragment wrapped in `\b(?:…)\b`,
  matched case-insensitively. Score = weight × min(matches, 2), summed per category.
  Confidence: 4+ strong, 2+ likely, else possible. Returns reasons and the exact phrases matched.
- `detectSignals(signals, text)`: usage signals (dealers, reps, away from a desk, embedded, offline,
  multi-market). They don't add tools; they flow into Production Scope, P-TECH, P-ACCESS and go-live items.
- `unmatchedParts(categories, signals, text)`: sentences that match nothing, shown back to the client.
- `impliedAcrossTools`: options with `implies` suggest further tools, with the tool and question that
  caused it. Includes the Connecting Tools questionnaire. Dismissals are keyed `tool:question:category`.

Phrase matching is deliberate: explainable, testable, no API key. An AI interpretation layer can
sit on top later (server-side), but its suggestions must stay labelled and need confirmation.

### 7.2 Rules (`rules.js`)

Rule: `{ id, name, type, priority, hard, status: active|disabled|suggested, source: client|bpc|ai, owner, when, then, because, template?, from_question?, stale? }`.
`when` is `{ op: all|any, items: [condition | group] }`; conditions are `{ scope: item|request, field, op, value }`,
where `value` may be `{ ref: "request.region" }`.

- **Request parsing**: vocabulary from catalogue enum/list values, plurals and synonyms. Values within
  a field are OR'd and fields are AND'd. Negation lasts until a different field starts. Numeric phrases
  ("under £60", "between 50 and 90") and configured phrases ("in stock") are extracted first.
  A request splits into groups when a later segment names its own product type with its own
  attributes, so "linen blazers and blue linen trousers" is two requests while "blue and green linen
  shirts and trousers" is one.
- **Evaluation**: all active rules run per item in priority order. Exclusions and inclusions are
  resolved order-independently: any hard exclusion wins; `include` can only override soft exclusions.
  Suggested rules only run in preview, and still can't beat a hard rule. Fallback rules run only
  when nothing matches (`relax` drops a requirement and re-runs).
- **Coverage**: every combination the request asked for is reported, including combinations with
  nothing to show and why ("No green linen trousers in the catalogue").
- **Checks** (`analyseRules`): unknown fields, invalid operators, values no item has, missing
  THEN/BECAUSE, include-vs-exclude conflicts, stacked prices, duplicate calculations, rules matching nothing.
- `catalogueFromCSV` infers field types (number, list via `;` or `|`, enum, text).

### 7.3 Discovery (`discovery.js`)

`recordChange(cfg, state, qid, beforeJson)` must be called after every answer mutation; it logs the
change and, if the section was confirmed and the answer differs from the snapshot, marks the section
`needs_review`. `docState` marks a document `review` only if a changed question feeds it, so one
changed answer doesn't flag every document in its section.

Always go through `index(cfg)` (called by `visibleQuestions`) before relying on `q.section`.
A bug where intake modules never built the index was found in step 5; don't bypass it.

### 7.4 Connections (`connections.js`)

Link: `{ id, from, to, trigger, passes: [fieldId], action, on_change: recalculate|flag|clear|keep, fallback, fallback_note, loop_ok, note }`.
Field: `{ id, name, type, unit, owner }`. Owner (decision): `{ id, decision, owner, note }`.

`impact(p, { field } | { tool })` does a breadth-first walk from the owner of the change. It follows links
that carry a changed field. `recalculate`, `clear` and `flag` propagate everything the destination
produces; `keep` stops. Reaching an already-visited tool records "updates its summary and stops".
Steps come back ordered by depth.

Checks: unconnected tools, no entry point, unreachable tools, loops without `loop_ok`, fields
without owners, fields passed by a tool that neither produces nor receives them, undecided owners.
`prune` runs when a tool is removed.

### 7.5 Documents (`documents.js`)

`documentSet(p, ctx)` generates everything on demand; documents aren't stored, only reviews are.
Each document has `blocks` (h, p, ul, ol, table), `md`, `hash`, `open` items, `bpcItems`, `base` state
and computed `state`.

**IDs**

| ID | Meaning |
|---|---|
| `REQ-T-02-SR-A04` | Decision (tool, question) |
| `ASM-…` / `Q-…` | Assumption / open question for that decision |
| `T-02-R-001` | Rule |
| `T-02-FLD-colour` | Catalogue field |
| `F-01`, `C-01`, `O-01` | Shared field, connection, decision owner |
| `AT-T-02-SR-D03`, `AT-T-02-R-001`, `AT-T-02-C-01` | Tests from a decision, rule, incoming connection |
| `CX-AT-C-01-A`, `CX-AT-F-01`, `CX-AT-START-T-01` | Combined journey tests |
| `T-01-ST-3`, `SIG-01`, `TECH-05`, `ROLE-04`, `UX-04`, `PH-1`, `GL-01`, `RISK-01` | States, signals, BPC proposals, phases, go-live, risks |

**States**: `draft`, `input`, `ready`, `client_approved`, `bpc_review`, `bpc_approved`, `review`.
Approval stores the Markdown and its hash. If the hash later differs, the state is `review` and the
UI shows `diff(approvedText, currentMd)`. Documents with BPC-owned content (accepted BPC
recommendations, BPC-sourced rules, P-TECH, P-ACCESS, P-UX) go to `bpc_review` after client approval.
A clarification request forces `input` until resolved.

`handover(p, ctx)` returns `bpc.handover/1`: decisions with raw values, rules with trace IDs,
catalogue fields, tests, connections, document states and hashes, comments and unresolved items.
This is the contract for whatever consumes the spec next (prototype generator, estimator, Worker).

---

## 8. UI conventions

- Components expose `create(root, hooks)` and return a small API (`show`, `dashboard`, `doc`). Events
  are delegated on the component root, never on `document` (the app shell is the exception).
- Each component has its own action attribute to avoid collisions: `data-pact` (app), `data-dact` /
  `data-dgo` / `data-set` (discovery), `data-act` (studio), `data-cxact` (connections), `data-dcact` (documents).
- HTML is string-built. **Every interpolated value goes through `esc()`.** Keep it that way.
- Re-rendering replaces DOM, so pass a focus selector to renders and restore focus. Don't re-render a
  container while the user is typing in it (see the project-name fix in step 4).
- Routes: `#/project`, `#/tool/T-01`, `#/tool/T-01/rules`, `#/connections`, `#/blueprint`, `#/doc/ID`.
- Two `DiscoveryUI` instances exist (tool and connections); headings use `root.id + '-h'` to stay unique.

---

## 9. Persistence

- `localStorage['bpc-builder:project:1']`: the project on this device. Saves are debounced (250 ms) and
  flushed on `pagehide` and `visibilitychange`.
- `localStorage['bpc-builder:server:1']`: `{ id, rev, sent }`, the account copy this device's project syncs
  to when signed in. Each save is pushed (1.2 s debounce) with the last `rev`; a 409 shows "changed
  somewhere else" with a button to load the latest. Signing out clears this device's copy.
- A BPC review session never writes to this device's storage.
- Save file and Open file round-trip the full project JSON.
- Large catalogues with photos can hit the storage quota. The save indicator says so, and the file
  export still works.

---

## 10. Testing

| Suite | Tests | Covers |
|---|---|---|
| `rules.test.mjs` | 19 | Blue/green linen acceptance case, groups, negation, synonyms, hard rules vs AI, fallbacks, prices, calculations, AND/OR, CRUD, analysis, CSV |
| `project.test.mjs` | 15 | Suggestions (incl. 24 phrasings across all six areas), signals, unmatched text, tools, implied tools, rule sync, targeted review flags, save/resume |
| `connections.test.mjs` | 13 | Cinema demo, impact order and loop stop, flag/keep/clear, loop warning, bad passes, pruning, stable test IDs, document, status |
| `documents.test.mjs` | 9 | Full set, stable IDs, approve/change/diff/re-approve, BPC review and clarification, comments, coverage, signals, handover |
| `tests/e2e/smoke.py` | 15 checks | The main flows end to end in Chromium |

Run the smoke test after any UI change. Add a case to it for each new flow.

---

## 11. Known limitations and debt

- **Suggestion quality depends on the pattern list.** Unmatched sentences are surfaced, but new
  wording needs a test and a pattern.
- **The history log is client-written.** Approvals, clarifications and comments are protected by the server
  merge; the events list isn't, so treat it as a convenience, not an audit trail.
- **Conflicts are whole-project.** If two devices edit the same project, the second save gets a 409 and must
  load the latest; there is no field-level merge.
- **Journey map labels** can drift from their lines on crowded layouts; "Tidy layout" resets.
  Full detail is always in the connection list and each label's accessible name.
- **Rules Studio only for Select & Recommend.** Configure & Visualise would benefit next (compatibility rules).
- **Rule evaluation is O(items × rules)** and runs in the browser. Fine for sample data (hundreds of
  items); production catalogues (thousands of SKUs × variants) should evaluate server-side or be indexed.
- **CSS** was merged from earlier standalone pages and has some overlap. Tidy when the UI moves to components.
- **The request parser** doesn't handle typos or fuzzy matches yet.
- The earlier standalone prototypes in `brief-intake/` (brief intake, configurator builder, blueprint
  pack generator) are superseded by this app. Keep them for reference only.

---

## 12. Step 7: server (done, in the bpcode site)

Built inside the Next.js site rather than as a Cloudflare Worker, reusing its Neon database, Resend and
CMS. Summary (details in docs/CMS-HANDOFF.md §10):

- **Accounts:** clients sign in with a single-use emailed link (15 minutes, stored hashed, rate-limited,
  confirmed with a button so mail scanners can't use it up). 14-day HttpOnly session cookie on the public
  host, signed with `BUILDER_SECRET`. Clients never touch the CMS.
- **Saving:** `/api/builder/projects` (list, create, load, save with `rev`, delete). The server runs the
  engines on every save and keeps each side's parts (`src/builder/merge.ts`).
- **Sending:** the server generates the blueprint Markdown and `bpc.handover/1` itself, emails BPC (both
  attached, reply-to the client) and the client (Markdown only), stores a submission snapshot, and says
  "sent" only when Resend returns a message id.
- **BPC review:** the CMS dashboard lists projects; opening one goes through `/api/cms/builder-review/<id>` on
  the admin host (admins only), which hands the browser a 5-minute link to `/builder/review`, which opens a
  4-hour review session for that one project on the public host. Reviewer mode in the UI reflects it.
- **Tables** (`builder` schema): clients, login_tokens, projects, submissions, rate_limits.

**Still to do:** a CMS view of each submission (today: the email plus the dashboard panel), version
history beyond submission snapshots, and the AI layer below.

**AI layer (later)**: server-side only. It can interpret descriptions, suggest questions and polish wording.
Its output must be labelled as AI and confirmed by the client, and it must never overwrite structured
answers or rules, which remain the source of truth.
