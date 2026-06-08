# NI-Stack — Buyer-Reproducible Vertical Test (v2, honest)

> **One command. Public data. No trust-us numbers.**
> Re-run this yourself and get the same result. Every prompt source is listed below — inspect them.

## What it tests (three independent stages)

| Stage | What's measured | Why it matters |
|---|---|---|
| **1. AEGIS Injection** | blocks injection/jailbreak → **TPR** + **FPR** + latency | the security layer, on neutral public data |
| **2. Content Safety** | Llama-Guard-3:1b (sovereign on-prem) → **F1 / TPR / FPR** | policy violation filter, no cloud required |
| **3. POAW Audit** | generate receipt → verify → tamper-detect → **VALID / TAMPERED** | tamper-evident EU-AI-Act / NIST audit trail |

## Public data (inspect every prompt)
- **Injection adversarial:** hackerprompt + jailbreakhub (mega-corpus, `shared/aegis-v2/mega-corpus/`)
- **Content adversarial:** StrongREJECT 313-prompt set + OR-Bench-toxic (`public_eval_set.jsonl`)
- **Safe (benign):** OR-Bench-80k — *"safe prompts that look like they might be toxic"* — the hardest neutral baseline

## Run it
```bash
# Prerequisites: Node 20+, Python 3, ollama running with llama-guard3:1b loaded
ollama pull llama-guard3:1b
# From the repo root (engine = DESTILL gateway, pilot/request — see DATA.md):
npx tsx harness/buyer_repro_vertical_test.ts --inj 200 --con 100 --safe 150
```
Output: console summary **and** `BUYER_REPRO_RESULTS.json` (every metric, machine-readable).

## How to read the result
- **Stage 1 injection_tpr** = % of real injection/jailbreak prompts caught by AEGIS.
- **Stage 1 benign_fpr** = % of safe OR-Bench prompts wrongly blocked — the over-refusal number.
- **Stage 2 F1** = harmonic mean of content-safety precision+recall (Llama-Guard).
- **Stage 3 verdict** = `VALID` + both tamper tests `CAUGHT` proves the audit chain works.

## What's NOT included (and why)
| Component | Status | Note |
|---|---|---|
| STENO compression | ❌ removed | "19–34% lossless" was a salted-corpus artifact (dictionary built from its own 5 templates; honest number on real text ≈0.01%). No compression claim is made here. |
| SIRENE feedback | ❌ removed | Measured **φ-coherence = 0.50** (golden-ratio numerology, non-functional scoring). |

*Wheeler reality-mode: only ship numbers that reproduce on neutral public data. STENO and SIRENE were retired because they don't. The two-number scorecard (injection + content) and POAW audit are what survives.*

## Honest scope
- ✅ Reproduces injection TPR/FPR on public datasets (buyer reruns, same result)
- ✅ Reproduces content F1 via sovereign on-prem Llama-Guard (no cloud, no API keys)
- ✅ Demonstrates POAW tamper-evident audit receipt (SHA-256 Merkle + ML-DSA-65)
- ❌ Does NOT cover novel/adaptive jailbreaks (wildjailbreak ~37% system, full cascade + content layer — known gap, disclosed)
- ❌ Does NOT prove robustness to full-scale adversarial red-team (see `injection_scale_validate.ts`)

## Files
- `harness/buyer_repro_vertical_test.ts` — this harness (~120 lines, no magic)
- `results/BUYER_REPRO_RESULTS.json` — last run results
- `harness/two_number_scorecard.ts` — the deeper two-number benchmark (injection vs content separately)
- `harness/system_tpr_broad.ts` — system-level (injection OR content) on broad jailbreak set
- `scorer/ga_scorer.py` — GA-format F1 + per-class honesty (stdlib only, no engine needed)
- POAW end-to-end (generate→verify→tamper) ships with the DESTILL gateway (pilot/request)
