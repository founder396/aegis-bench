/**
 * SYSTEM TPR — measures (AEGIS injection OR Llama-Guard content) on the BROAD jailbreak set.
 * This is the fair, honest number: many sophisticated jailbreaks wrap harmful CONTENT, so
 * Llama-Guard catches them even when the injection layer misses. The SYSTEM is what a buyer
 * actually experiences.
 * Run:  npx tsx system_tpr_broad.ts --inj 800 --safe 300
 */
const { AegisV2CascadeCoordinator } = require('../cascade-coordinator');
import { classifyContent } from '../content-safety-layer';
import * as fs from 'fs';

const MC = process.env.MEGACORPUS_DIR || './mega-corpus';  // download public datasets per DATA.md
const NINJ = Number(process.argv[process.argv.indexOf('--inj') + 1]) || 800;
const NSAFE = Number(process.argv[process.argv.indexOf('--safe') + 1]) || 300;
const PUB = `${__dirname}/public_eval_set.jsonl`;
const SOURCES = [
  'hackerprompt_adversarial',
  'jailbreakhub_adversarial',
  'wildjailbreak_adversarial',
  'pliny_real_adversarial',
];

function loadJsonl(file: string, take: number): string[] {
  const p = `${MC}/${file}.jsonl`; if (!fs.existsSync(p)) return [];
  const o: string[] = [];
  for (const l of fs.readFileSync(p, 'utf-8').split('\n')) {
    if (o.length >= take) break;
    const s = l.trim(); if (!s) continue;
    try { const t = JSON.parse(s).text; if (t && t.length > 8) o.push(t); } catch {}
  }
  return o;
}

(async () => {
  const per = Math.ceil(NINJ / SOURCES.length);
  const bySource: Record<string, string[]> = {};
  for (const f of SOURCES) bySource[f] = loadJsonl(f, per);
  const inj = SOURCES.flatMap((f) => bySource[f]).slice(0, NINJ);
  const safe = fs.readFileSync(PUB, 'utf-8').split('\n').filter(Boolean)
    .map((l) => JSON.parse(l)).filter((r: any) => r.label === 'safe')
    .slice(0, NSAFE).map((r: any) => r.text);

  const aegis = new AegisV2CascadeCoordinator();
  const byInjection = async (t: string) =>
    ['BLOCK', 'REVIEW', 'HONEYPOT'].includes((await aegis.scan(t, 'q' + Math.random())).decision);
  const byContent = async (t: string) => (await classifyContent(t)).unsafe;
  const bySystem = async (t: string) => (await byInjection(t)) || (await byContent(t));

  const t0 = Date.now();
  // Score all samples once (expensive: both layers)
  const injR: { inj: boolean; con: boolean }[] = [];
  const safeR: { inj: boolean; con: boolean }[] = [];
  for (const t of inj) injR.push({ inj: await byInjection(t), con: await byContent(t) });
  for (const t of safe) safeR.push({ inj: await byInjection(t), con: await byContent(t) });
  const secs = ((Date.now() - t0) / 1000).toFixed(0);

  const pct = (n: number, d: number) => d ? (100 * n / d).toFixed(1) + '%' : 'n/a';
  const injN = injR.length; const safeN = safeR.length;
  const tprInj  = injR.filter((r) => r.inj).length;
  const tprCon  = injR.filter((r) => r.con).length;
  const tprSys  = injR.filter((r) => r.inj || r.con).length;
  const fprInj  = safeR.filter((r) => r.inj).length;
  const fprCon  = safeR.filter((r) => r.con).length;
  const fprSys  = safeR.filter((r) => r.inj || r.con).length;

  console.log(`\n======= SYSTEM TPR — AEGIS injection OR Llama-Guard content (public data) =======`);
  console.log(`n_inj=${injN}  n_safe=${safeN}  elapsed ${secs}s`);
  console.log(`                  TPR (adversarial caught)   FPR (safe blocked)`);
  console.log(`  AEGIS injection  ${pct(tprInj, injN).padEnd(26)} ${pct(fprInj, safeN)}`);
  console.log(`  Llama-Guard      ${pct(tprCon, injN).padEnd(26)} ${pct(fprCon, safeN)}`);
  console.log(`  SYSTEM (OR)      ${pct(tprSys, injN).padEnd(26)} ${pct(fprSys, safeN)}`);
  console.log(`  old SVM cascade  94.7% TPR / 18.0% FPR`);

  // per-source system TPR
  let pos = 0;
  console.log('\n  per-source SYSTEM TPR:');
  for (const f of SOURCES) {
    const n = bySource[f].length;
    const sys = injR.slice(pos, pos + n).filter((r) => r.inj || r.con).length;
    console.log(`    ${f.padEnd(30)} ${pct(sys, n)} (n=${n})`);
    pos += n;
  }
  console.log(`===================================================================================`);

  fs.writeFileSync(`${__dirname}/system_tpr_broad.json`, JSON.stringify({
    n_inj: injN, n_safe: safeN,
    injection: { tpr: 100 * tprInj / injN, fpr: 100 * fprInj / safeN },
    content:   { tpr: 100 * tprCon / injN, fpr: 100 * fprCon / safeN },
    system:    { tpr: 100 * tprSys / injN, fpr: 100 * fprSys / safeN },
    secs: Number(secs),
  }, null, 2));
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
