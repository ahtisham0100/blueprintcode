// Discovery engine: pure functions over (module config, tool discovery state).
// State shape: { answers: { [qid]: { value, other, status, wording } }, sections: { [secId]: { status, at, snapshot } },
//                history: [], version, current }

const STATUS_LABEL = { confirmed: 'Confirmed', assumption: 'Assumption', unknown: "Don't know", bpc: 'Ask BPC', bpc_accepted: 'BPC recommendation' };

function index(cfg) {
  if (cfg._index) return cfg._index;
  const Q = {};
  cfg.sections.forEach((s) => s.questions.forEach((q) => { Q[q.id] = Object.assign(q, { section: s.id }); }));
  Object.defineProperty(cfg, '_index', { value: Q, enumerable: false });
  return Q;
}
function blankState(cfg) {
  return { answers: {}, sections: {}, current: cfg.sections[0].id, history: [], version: 1 };
}
const A = (st, id) => (st.answers && st.answers[id]) || {};

function hasValue(st, q) { const v = A(st, q.id).value; return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ''; }
function answered(st, q) { const s = A(st, q.id).status; return hasValue(st, q) || s === 'unknown' || s === 'bpc' || s === 'bpc_accepted'; }
function statusOf(st, q) { const a = A(st, q.id); if (a.status) return a.status; return hasValue(st, q) ? 'confirmed' : null; }

function visible(cfg, st, q) {
  if (!q.show_if) return true;
  const Q = index(cfg);
  const src = Q[q.show_if.q];
  if (!src || !visible(cfg, st, src)) return false;
  const v = A(st, src.id).value;
  if (q.show_if.has_selection) {
    const ex = (src.options || []).filter((o) => o.exclusive).map((o) => o.id);
    return Array.isArray(v) && v.some((x) => !ex.includes(x));
  }
  return Array.isArray(v) ? v.some((x) => q.show_if.in.includes(x)) : q.show_if.in.includes(v);
}
function visibleQuestions(cfg, st, sec) { index(cfg); return sec.questions.filter((q) => visible(cfg, st, q)); }
function allVisible(cfg, st) { return cfg.sections.flatMap((s) => visibleQuestions(cfg, st, s)); }

function selectedOptions(st, q) {
  const v = A(st, q.id).value;
  const ids = Array.isArray(v) ? v : v ? [v] : [];
  return ids.map((id) => (q.options || []).find((o) => o.id === id)).filter(Boolean);
}
function valueText(st, q) {
  const a = A(st, q.id);
  if (q.type === 'single' || q.type === 'multi') {
    const labels = selectedOptions(st, q).map((o) => (o.other && a.other ? a.other : o.label));
    if (labels.length > 1) return labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
    return labels[0] || '';
  }
  return String(a.value || '').trim();
}
function generatedText(st, q) {
  const s = statusOf(st, q);
  if (s === 'unknown') return 'Not known yet: ' + q.label.replace(/\?$/, '').toLowerCase() + '.';
  if (s === 'bpc') return 'BPC to advise' + (q.recommend ? ' (recommendation: ' + q.recommend + ')' : '.');
  if (s === 'bpc_accepted') return q.recommend || 'BPC to advise.';
  const t = valueText(st, q);
  return t ? q.summary.replace('{value}', t) : null;
}
function decisionText(st, q) {
  const a = A(st, q.id);
  const s = statusOf(st, q);
  if (a.wording && s !== 'unknown' && s !== 'bpc') return a.wording;
  return generatedText(st, q);
}

function sectionState(cfg, st, sec) {
  const s = st.sections && st.sections[sec.id];
  const qs = visibleQuestions(cfg, st, sec);
  const done = qs.filter((q) => answered(st, q)).length;
  const missing = qs.filter((q) => q.required && !answered(st, q)).length;
  if (s && s.status === 'needs_review') return { key: 'needs_review', label: 'Needs review', done, total: qs.length, missing };
  if (s && s.status === 'confirmed') return { key: 'confirmed', label: 'Confirmed', done, total: qs.length, missing };
  return { key: 'open', label: `${done} of ${qs.length} answered`, done, total: qs.length, missing };
}

const DOC_STATES = {
  draft: 'Draft', input: 'Needs client input', ready: 'Ready for client review', review: 'Needs review',
};
function docState(cfg, st, doc) {
  const qs = allVisible(cfg, st).filter((q) => q.affects.includes(doc.id));
  const secIds = [...new Set(qs.map((q) => q.section))];
  const secStatus = (id) => st.sections && st.sections[id] && st.sections[id].status;
  const changed = secIds.filter((id) => secStatus(id) === 'needs_review').flatMap((id) => changedSinceConfirm(cfg, st, id));
  let key;
  if (qs.some((q) => changed.includes(q.id))) key = 'review';
  else if (qs.some((q) => q.required && !answered(st, q))) key = 'draft';
  else if (qs.some((q) => ['unknown', 'bpc'].includes(statusOf(st, q)))) key = 'input';
  else if (secIds.length && secIds.every((id) => secStatus(id) === 'confirmed' || secStatus(id) === 'needs_review')) key = 'ready';
  else key = 'draft';
  return { key, label: DOC_STATES[key], questions: qs.map((q) => q.id) };
}
function counts(cfg, st) {
  const c = { confirmed: 0, assumption: 0, bpc: 0, unknown: 0, missing: 0, answered: 0, total: 0 };
  allVisible(cfg, st).forEach((q) => {
    c.total++;
    const s = statusOf(st, q);
    if (!s) { if (q.required) c.missing++; return; }
    c.answered++;
    if (s === 'bpc' || s === 'bpc_accepted') c.bpc++; else c[s]++;
  });
  return c;
}

/* ---------- change control ---------- */
function snapshot(st, sec) { const o = {}; sec.questions.forEach((q) => { o[q.id] = JSON.stringify(A(st, q.id)); }); return o; }
function describeAnswer(st, q, answer) {
  const tmp = { answers: Object.assign({}, st.answers, { [q.id]: answer || {} }) };
  const s = statusOf(tmp, q);
  return (decisionText(tmp, q) || '(blank)') + (s === 'assumption' ? ' (assumption)' : s === 'bpc_accepted' ? ' (BPC recommendation accepted)' : '');
}
/** Call after mutating st.answers[q.id]; `before` is JSON of the previous answer ('' if none). Returns the history entry or null. */
function recordChange(cfg, st, qid, before, at) {
  const Q = index(cfg);
  const q = Q[qid];
  const after = JSON.stringify(A(st, qid));
  if ((before || '{}') === after || (before === '' && after === '{}')) return null;
  const sec = st.sections && st.sections[q.section];
  let reopened = false;
  if (sec && sec.status === 'confirmed' && sec.snapshot && sec.snapshot[qid] !== after) { sec.status = 'needs_review'; reopened = true; }
  const entry = { at: at || new Date().toISOString(), q: qid, label: q.label, from: describeAnswer(st, q, before ? JSON.parse(before) : {}),
    to: describeAnswer(st, q, A(st, qid)), affects: q.affects.slice(), reopened };
  st.history = [entry].concat(st.history || []).slice(0, 300);
  st.version = (st.version || 1) + 1;
  return entry;
}
function confirmSection(cfg, st, secId, at) {
  const sec = cfg.sections.find((s) => s.id === secId);
  const ss = sectionState(cfg, st, sec);
  if (ss.missing) return false;
  st.sections = st.sections || {};
  st.sections[secId] = { status: 'confirmed', at: at || new Date().toISOString(), snapshot: snapshot(st, sec) };
  st.version = (st.version || 1) + 1;
  return true;
}
function changedSinceConfirm(cfg, st, secId) {
  const s = st.sections && st.sections[secId];
  if (!s) return [];
  const Q = index(cfg);
  return [...new Set((st.history || []).filter((h) => Q[h.q] && Q[h.q].section === secId && h.at > s.at).map((h) => h.q))];
}

/* ---------- things implied by answers ---------- */
function suggestedRules(cfg, st) {
  const seen = new Set();
  const out = [];
  allVisible(cfg, st).forEach((q) => selectedOptions(st, q).forEach((o) => (o.rules || []).forEach((t) => {
    if (seen.has(t) || !cfg.rule_templates || !cfg.rule_templates[t]) return;
    seen.add(t);
    out.push(Object.assign(JSON.parse(JSON.stringify(cfg.rule_templates[t])), { template: t, from_question: q.id }));
  })));
  return out;
}
function impliedTools(cfg, st) {
  const out = [];
  allVisible(cfg, st).forEach((q) => selectedOptions(st, q).forEach((o) => (o.implies || []).forEach((imp) => {
    out.push({ category: imp.category, reason: imp.reason, question: q.id, option: o.id });
  })));
  return out;
}

const Discovery = {
  STATUS_LABEL, DOC_STATES, index, blankState, hasValue, answered, statusOf, visible, visibleQuestions, allVisible,
  valueText, generatedText, decisionText, sectionState, docState, counts, snapshot, recordChange, confirmSection,
  changedSinceConfirm, suggestedRules, impliedTools, selectedOptions,
};
export default Discovery;
