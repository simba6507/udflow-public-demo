# udflow-public-demo

A **real, captured run** of [udflow](https://github.com/simba6507/universal-dev-flow-plugin) — the plan-gated, risk-proportional code-review & release-readiness workflow for Claude Code — on a small but non-trivial TypeScript task.

This repo exists so you can **see the workflow's actual behavior**, not a marketing GIF:

- the **plan gate** (no files change before you approve),
- **risk-selected reviewers** (spec / test / code / security — chosen by the task's risk, not all-of-them-every-time),
- the **repair loop**, and
- the **gatekeeper verdict** (`READY` / `FIX REQUIRED` / `NOT READY`).

> **Honesty note.** Everything under [`docs/udflow-run-2026-06-21/`](docs/udflow-run-2026-06-21/) is recorded as it actually happened. Findings are verbatim; if a reviewer found nothing, the docs say so. **No findings were staged.** The value here is that the run is *observable, reproducible, and auditable* — not that it always catches a bug. (The plugin's own README is equally blunt about its limits.)

## The task

Implement `importRecipients(csv)` — a CSV → recipients parser with a strict contract: required headers, whitespace trimming, malformed-email rejection, case-insensitive de-duplication, multibyte-name preservation, **1-based** row-error line numbers, and **no silent drops**. Full contract in [Issue #1](../../issues/1) and [`docs/udflow-run-2026-06-21/00-task.md`](docs/udflow-run-2026-06-21/00-task.md).

It's deliberately **correctness-critical** (parsing / encoding / dedup / untrusted input) — exactly the territory where udflow prefers **two independent reviewer lenses** rather than one.

## Where the evidence lives

| File | What it shows |
|---|---|
| [`00-task.md`](docs/udflow-run-2026-06-21/00-task.md) | The task / acceptance criteria |
| [`01-plan-gate.md`](docs/udflow-run-2026-06-21/01-plan-gate.md) | Restatement, plan, and `git status --short` **clean** before approval |
| [`02-approval.md`](docs/udflow-run-2026-06-21/02-approval.md) | The approval message that released implementation |
| [`03-implementation-summary.md`](docs/udflow-run-2026-06-21/03-implementation-summary.md) | What changed |
| [`04-verification.md`](docs/udflow-run-2026-06-21/04-verification.md) | typecheck / lint / test output |
| [`05-reviewers.md`](docs/udflow-run-2026-06-21/05-reviewers.md) | Each selected reviewer's findings (verbatim) |
| [`06-gatekeeper.md`](docs/udflow-run-2026-06-21/06-gatekeeper.md) | Aggregated findings + final verdict |
| [`transcript.redacted.md`](docs/udflow-run-2026-06-21/transcript.redacted.md) | The run transcript (redacted, workflow-complete) |

## Reproduce it yourself

Prerequisite: **Claude Code** with the udflow plugin installed:

```
/plugin marketplace add simba6507/universal-dev-flow-plugin
/plugin install udflow@kktmarketplace
/reload-plugins
```

Then follow [`RUNBOOK.md`](RUNBOOK.md). In short: from a clean branch, run
`/udflow:run Fix issue #1: implement CSV recipient import validation`, approve at the plan
gate, and let it run to the gatekeeper verdict.

## Verify locally

```
npm ci
npm run typecheck
npm run lint
npm test
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same on every push and PR.

## License

[MIT](LICENSE).
