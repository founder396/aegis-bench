# Data Provenance — every prompt is public, inspect it yourself

This benchmark uses **only public datasets**. We do not ship a curated/relabeled copy that could
hide cherry-picking — you download them from the original sources and split them per
`dataset_split_manifest.json` (the no-leak TUNE / HELD_OUT / NOVEL contract).

## Sources (HuggingFace / public)

| Role | Dataset | Source |
|---|---|---|
| Injection adversarial | HackAPrompt | `hackaprompt/hackaprompt-dataset` |
| Injection adversarial | Jailbreak-Hub (in-the-wild jailbreaks) | `walledai/JailbreakHub` |
| Narrative jailbreaks (the disclosed gap) | WildJailbreak | `allenai/wildjailbreak` |
| Content adversarial | StrongREJECT | `walledai/StrongREJECT` |
| Benign (hardest neutral baseline) | OR-Bench-80k ("safe prompts that look toxic") | `bench-llm/or-bench` |

## The honesty rule (enforced by `scorer/ga_scorer.py`)
- A dataset name may appear in exactly ONE of TUNE / HELD_OUT / NOVEL.
- The **headline number must come from HELD_OUT or NOVEL** — never TUNE.
- `ga_scorer.py` refuses to call a run `credible` unless `this_run_role` is HELD_OUT or NOVEL.
- Always publish two numbers: in-sample (diagnostic) AND held-out/novel (the real claim). **The gap
  between them is the honesty signal.**

## What is NOT in this repo (and why)
The DESTILL gateway engine (the ~115-agent cascade, the trained SVM, the PMB) is **proprietary** and
not open-sourced — like every commercial guardrail vendor. This repo publishes the **harness, scorer,
data manifest, and result artifacts** so you can verify there is no trick in the methodology, and so
the **data and splits are auditable**. To reproduce the live numbers end-to-end, run the harness
against the DESTILL gateway (available on pilot / request) — that is exactly the "buyer reruns it and
gets the same number" path the harness is built for.
