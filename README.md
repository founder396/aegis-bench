# aegis-bench — Buyer-Reproducible Guardrail Benchmark (PUBLIC)

> **Rerun every number on this page yourself.** Public data, one command, no trust-us claims.
> This is the repository the DESTILL NI-Stack pitch links to. If a number here doesn't
> reproduce on your machine, the pitch is wrong — tell us.
>
> (Internal credibility/methodology notes for the General Analysis comparison live in `README.md`.)

[![reproducible](https://img.shields.io/badge/benchmark-buyer--reproducible-brightgreen)]()
[![data](https://img.shields.io/badge/data-public-blue)]()
[![honesty](https://img.shields.io/badge/gaps-disclosed-orange)]()

## Headline result (public corpus)

| Stage | Metric | Result | Corpus |
|---|---|---|---|
| **Injection** | TPR / FPR | **withdrawn — re-measurement pending** | see note below |
| **Injection** | latency p50 | **~2ms** | CPU, no GPU |
| **Content safety** | F1 | **~0.81** | StrongREJECT / OR-Bench, Llama-Guard-3:1b on-prem |
| **POAW audit** | verdict | **VALID + tamper CAUGHT** | SHA-256 Merkle + ML-DSA-65 (FIPS 204) |

## ⚠️ The honest gap (read this — it's the point)

**The previously published injection figure (97.7% / 4.0%) is withdrawn.** It did not reproduce on
independent public data, and the last run in `results/` already disagreed with it. No injection rate
is claimed until a reproducible re-measurement is published. We catch **sophisticated narrative / roleplay
jailbreaks** (wildjailbreak corpus) at only **~37% at the system level** (full cascade + PMB +
Llama-Guard content layer — and the content layer barely helps, because these are roleplay/framing
attacks, not overtly harmful content). We disclose this because:

1. A guardrail vendor who claims "100% / all zero-days" is lying, and a security buyer knows it.
2. Narrative jailbreaks are a content-safety problem best handled by the LLM's own alignment
   layer (e.g. Claude), not a CPU regex/SVM cascade. The honest architecture is **defense in
   depth**: NI-Stack screens cheap deterministic attacks at the edge; the LLM's alignment
   handles the semantic ones.

The **gap between our in-sample number and our held-out/novel number is the honesty signal.**
See `dataset_split_manifest.json` — TUNE datasets may never be reported as headline; only
HELD_OUT and NOVEL splits count for the public claim.

## What's in this repo

```
README.md                     ← you are here
DATA.md                       ← dataset sources (all public) + the no-leak honesty rule
BUYER_REPRODUCE.md            ← the 3-stage buyer protocol, in detail
dataset_split_manifest.json   ← TUNE / HELD_OUT / NOVEL contract (the credibility rule)
harness/                      ← the benchmark harnesses (reference — no magic, ~120 lines each)
scorer/                       ← ga_scorer.py (GA-format F1 + per-class honesty) + over-refusal check
results/                      ← last-run artifacts (BUYER_REPRO_RESULTS.json, machine-readable)
```

> **What is NOT here (and why):** the DESTILL gateway engine (cascade, trained models, pattern bank)
> is proprietary — like every commercial guardrail vendor. This repo publishes the **harness, scorer,
> data manifest, and result artifacts** so the *methodology and data are auditable*. To reproduce the
> live numbers end-to-end, run the harness against the DESTILL gateway (pilot / request access). See `DATA.md`.

## Reproduce it

```bash
# Prerequisites: Node 20+, Python 3, ollama with llama-guard3:1b, DESTILL gateway (pilot/request)
ollama pull llama-guard3:1b

# Stage 1+2+3 — the full buyer scorecard (against the DESTILL gateway):
npx tsx harness/buyer_repro_vertical_test.ts --inj 200 --con 100 --safe 150
#   → injection_tpr, benign_fpr, content F1 ≈ 0.81,
#     POAW VALID + both tamper attacks CAUGHT
#   → writes results/BUYER_REPRO_RESULTS.json (every metric, machine-readable)

# Inspect the last published run without the engine:
cat results/BUYER_REPRO_RESULTS.json

# Score any run in GA format + per-class honesty (stdlib Python only, no engine needed):
python scorer/ga_scorer.py <stellschrauben.json> --split dataset_split_manifest.json
```

## What each number means
- **injection_tpr** — % of real injection/jailbreak prompts AEGIS blocks.
- **benign_fpr** — % of safe OR-Bench prompts wrongly blocked (over-refusal). OR-Bench is the
  *hardest* benign set — prompts engineered to look toxic. Real traffic FPR is lower.
- **content F1** — harmonic mean of Llama-Guard precision+recall (sovereign, on-prem, no cloud).
- **POAW verdict** — `VALID` + both tamper tests `CAUGHT` proves the audit chain detects forgery.

## Token compression — deliberately NOT claimed
This benchmark makes **no token-compression claim**. An earlier internal "STENO 19–34%" figure
was a salted-corpus artifact (the benchmark dictionary was built from its own 5 templates; the
honest number on real text is ≈0.01%) and has been retired. Real compute-cost levers are standard
prompt-caching + model-tiering at the gateway. We'd rather ship nothing than a number you can't reproduce.

## Data provenance (inspect every prompt)
- **Injection adversarial:** hackerprompt + jailbreakhub (`mega-corpus/`)
- **Content adversarial:** StrongREJECT 313-set + OR-Bench-toxic (`public_eval_set.jsonl`)
- **Benign:** OR-Bench-80k ("safe prompts that look toxic" — hardest neutral baseline)
- **Splits:** `dataset_split_manifest.json` (TUNE / HELD_OUT / NOVEL, no-leak rule enforced)

## License & contact
Benchmark harness: open for inspection and reproduction. Built to be re-run, not believed.
DESTILL.ai · Hagen Schmidt.
