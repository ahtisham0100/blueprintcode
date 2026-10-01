#!/usr/bin/env node
/* Build Blueprint Builder into one self-contained page.

     node builder/build.mjs              validate the modules, write builder/dist/blueprint-builder.html
     node builder/build.mjs --modules    regenerate the modules first (python3 modules/make_modules.py)

   Port of the original build.py, so the site build (prebuild / predev) needs
   only Node. The page is served by src/app/(site)/builder/route.ts.

   Bundle order: the engines (rules, discovery, connections, project,
   documents), each wrapped in its own function scope with import lines
   stripped and `export default X;` turned into `return X;`, then the UI files. */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(HERE, 'dist', 'blueprint-builder.html');

const TYPES = new Set(['single', 'multi', 'text', 'textarea']);
const STATUSES = new Set(['confirmed', 'assumption', 'unknown', 'bpc', 'bpc_accepted']);
const ENGINES = [
  ['Engine', 'engine/rules.js'],
  ['Discovery', 'engine/discovery.js'],
  ['Connections', 'engine/connections.js'],
  ['Project', 'engine/project.js'],
  ['Documents', 'engine/documents.js'],
];
const UI = ['ui/discovery.js', 'ui/studio.js', 'ui/connections.js', 'ui/documents.js', 'ui/server.js', 'ui/app.js'];

const read = (rel) => readFileSync(path.join(HERE, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

function compiles(re) {
  try {
    new RegExp(re);
    return true;
  } catch {
    return false;
  }
}

/** Every problem in one questionnaire module, plus its question count. */
export function validateModule(name, c, catIds) {
  const errs = [];
  const docs = new Set((c.documents ?? []).map((d) => d.id));
  const tpls = new Set(Object.keys(c.rule_templates ?? {}));
  const seen = new Map();
  for (const s of c.sections ?? []) {
    for (const q of s.questions ?? []) {
      const qid = q.id;
      const loc = `${name} ${qid}`;
      if (!qid || seen.has(qid)) {
        errs.push(`${loc}: missing or duplicate id`);
        continue;
      }
      if (!TYPES.has(q.type)) errs.push(`${loc}: unknown type ${q.type}`);
      if (!(q.summary ?? '').includes('{value}')) errs.push(`${loc}: summary needs a {value} placeholder`);
      if (!q.affects?.length || q.affects.some((a) => !docs.has(a))) errs.push(`${loc}: affects must list known documents`);
      if (q.type === 'single' || q.type === 'multi') {
        const oids = (q.options ?? []).map((o) => o.id);
        if (oids.length < 2 || new Set(oids).size !== oids.length) errs.push(`${loc}: options missing or duplicated`);
        for (const o of q.options ?? []) {
          for (const t of o.rules ?? []) if (!tpls.has(t)) errs.push(`${loc}: unknown rule template '${t}'`);
          for (const i of o.implies ?? []) if (!catIds.has(i.category)) errs.push(`${loc}: implies unknown category '${i.category}'`);
        }
      }
      const si = q.show_if;
      if (si) {
        const src = seen.get(si.q);
        if (!src) errs.push(`${loc}: show_if refers to '${si.q}', which isn't an earlier question`);
        else if (si.in && si.in.some((v) => !(src.options ?? []).some((o) => o.id === v))) errs.push(`${loc}: show_if values aren't options of ${src.id}`);
      }
      seen.set(qid, q);
    }
  }
  for (const [qid, a] of Object.entries(c.example?.answers ?? {})) {
    const q = seen.get(qid);
    if (!q) errs.push(`${name} example: unknown question ${qid}`);
    else if (a.status && !STATUSES.has(a.status)) errs.push(`${name} example ${qid}: unknown status`);
    else if (a.value != null && (q.type === 'single' || q.type === 'multi')) {
      const ids = Array.isArray(a.value) ? a.value : [a.value];
      if (ids.some((i) => !q.options.some((o) => o.id === i))) errs.push(`${name} example ${qid}: value isn't an option`);
    }
  }
  return { errs, count: seen.size };
}

/** Categories, signals and every module, validated. Throws with all errors. */
export function loadData() {
  const catfile = readJson('modules/categories.json');
  const cats = catfile.categories;
  const signals = catfile.signals ?? [];
  const catIds = new Set(cats.map((c) => c.id));
  const errs = [];
  const modules = {};
  let total = 0;
  for (const sg of signals) if (!compiles(sg.re)) errs.push(`bad signal pattern ${sg.re}`);
  for (const c of cats) {
    let m;
    try {
      m = readJson(`modules/${c.module}.json`);
    } catch {
      errs.push(`category ${c.id}: module file ${c.module}.json missing`);
      continue;
    }
    const r = validateModule(c.module, m, catIds);
    errs.push(...r.errs);
    total += r.count;
    modules[c.module] = m;
    for (const p of c.patterns ?? []) if (!compiles(p.re)) errs.push(`category ${c.id}: bad pattern ${p.re}`);
  }
  const cx = readJson('modules/connect_tools.json');
  const r = validateModule('connect_tools', cx, catIds);
  errs.push(...r.errs);
  total += r.count;
  modules.connect_tools = cx;
  if (errs.length) throw new Error('Errors:\n  ' + errs.join('\n  '));
  return { cats, signals, modules, total };
}

function wrapEngine(name, rel) {
  let src = read(rel).replace(/^import .*?;\s*$/gm, '');
  const exp = `export default ${name};`;
  if (!src.includes(exp)) throw new Error(`${rel} must end with '${exp}'`);
  src = src.replace(exp, `return ${name};`);
  return `var ${name} = (function(){\n'use strict';\n${src}\n})();\n`;
}

export function buildPage() {
  const { cats, signals, modules, total } = loadData();
  const sample = readJson('data/clothing.json');
  const data = JSON.stringify({ categories: cats, signals, modules, sample }).replace(/<\//g, '<\\/');
  const bundle = ENGINES.map(([n, p]) => wrapEngine(n, p)).join('') + UI.map(read).join('\n');
  if (bundle.includes('</script')) throw new Error("Bundle contains '</script'");
  // Function replacers: the bundle contains "$'" and friends, which a string
  // replacement would expand.
  const page = read('app/app_template.html').replace('__DATA__', () => data).replace('__BUNDLE__', () => bundle);
  return { page, stats: { tools: cats.length, modules: Object.keys(modules).length, questions: total } };
}

function main() {
  if (process.argv.includes('--modules')) {
    const py = process.platform === 'win32' ? 'python' : 'python3';
    const r = spawnSync(py, [path.join(HERE, 'modules', 'make_modules.py')], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  try {
    const { page, stats } = buildPage();
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, page, 'utf8');
    const kb = Math.round(statSync(OUT).size / 1024);
    console.log(`Built ${path.relative(process.cwd(), OUT)} (${kb} KB): ${stats.tools} tool types, ${stats.modules} modules, ${stats.questions} questions`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
