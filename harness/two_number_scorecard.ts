/**
 * TWO-NUMBER BUYER SCORECARD — the honest, reproducible result.
 *   Threat 1 INJECTION  → AEGIS CPU cascade (its specialty)
 *   Threat 2 CONTENT    → L-CONTENT / Llama-Guard (sovereign, on-prem)
 * Reported SEPARATELY (never one conflated F1). All public data, re-runnable.
 */
const { AegisV2CascadeCoordinator } = require('../cascade-coordinator');
import { classifyContent } from '../content-safety-layer';
import * as fs from 'fs';

const MC = process.env.MEGACORPUS_DIR || './mega-corpus';  // download public datasets per DATA.md
const PUB = `${__dirname}/public_eval_set.jsonl`;
const NI = Number(process.argv[process.argv.indexOf('--inj') + 1]) || 200;   // injection adv sample
const NC = Number(process.argv[process.argv.indexOf('--con') + 1]) || 100;   // content adv + safe each

function loadMC(file: string, take: number): string[] { const p = `${MC}/${file}.jsonl`; if (!fs.existsSync(p)) return []; const o: string[] = []; for (const l of fs.readFileSync(p, 'utf-8').split('\n')) { if (o.length >= take) break; const s = l.trim(); if (!s) continue; try { const t = JSON.parse(s).text; if (t && t.length > 8) o.push(t); } catch {} } return o; }

(async () => {
  const pub = fs.readFileSync(PUB, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const safe = pub.filter((r: any) => r.label === 'safe').slice(0, NC).map((r: any) => r.text);
  const contentAdv = pub.filter((r: any) => r.label === 'adversarial').slice(0, NC).map((r: any) => r.text);
  const injAdv = [...loadMC('hackerprompt_adversarial', NI / 2), ...loadMC('jailbreakhub_adversarial', NI / 2)].slice(0, NI);
  const aegis = new AegisV2CascadeCoordinator();
  const aegisBlock = async (t: string) => ['BLOCK', 'REVIEW', 'HONEYPOT'].includes((await aegis.scan(t, 'q' + Math.random())).decision);

  // ── Threat 1: INJECTION (AEGIS) ──
  let injTP = 0; for (const t of injAdv) if (await aegisBlock(t)) injTP++;
  let injFP = 0; for (const t of safe) if (await aegisBlock(t)) injFP++;   // AEGIS flagging benign as injection
  // ── Threat 2: CONTENT (Llama-Guard) ──
  let conTP = 0; for (const t of contentAdv) if ((await classifyContent(t)).unsafe) conTP++;
  let conFP = 0; for (const t of safe) if ((await classifyContent(t)).unsafe) conFP++;

  const f1 = (tp: number, fp: number, fn: number) => { const p = tp / (tp + fp || 1), r = tp / (tp + fn || 1); return (2 * p * r / (p + r || 1)); };
  const injTPR = 100 * injTP / injAdv.length, injFPR = 100 * injFP / safe.length;
  const conTPR = 100 * conTP / contentAdv.length, conFPR = 100 * conFP / safe.length;
  const conF1 = f1(conTP, conFP, contentAdv.length - conTP);

  console.log(`\n================ TWO-NUMBER BUYER SCORECARD (public data) ================`);
  console.log(`THREAT 1 — PROMPT INJECTION / JAILBREAK  (AEGIS CPU cascade, sub-ms)`);
  console.log(`  n=${injAdv.length} public injection prompts (hackerprompt+jailbreakhub)`);
  console.log(`  detection TPR: ${injTPR.toFixed(1)}%   |   benign-as-injection FPR: ${injFPR.toFixed(1)}% (n=${safe.length})`);
  console.log(`\nTHREAT 2 — HARMFUL CONTENT / POLICY  (L-CONTENT = Llama-Guard-3:1b, on-prem CPU/NPU)`);
  console.log(`  n=${contentAdv.length} adversarial (StrongREJECT+OR-Bench-toxic) vs ${safe.length} safe (OR-Bench)`);
  console.log(`  TPR: ${conTPR.toFixed(1)}%   FPR: ${conFPR.toFixed(1)}%   F1: ${conF1.toFixed(3)}`);
  console.log(`==========================================================================`);
  fs.writeFileSync(`${__dirname}/two_number_scorecard.json`, JSON.stringify({ injection: { n: injAdv.length, tpr: injTPR, fpr: injFPR }, content: { nAdv: contentAdv.length, nSafe: safe.length, tpr: conTPR, fpr: conFPR, f1: conF1 }, generated: new Date().toISOString() }, null, 2));
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
