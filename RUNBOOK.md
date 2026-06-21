# RUNBOOK — capturing the udflow demo run (Phase 2)

This is the **second session**. Phase 1 (scaffold, private repo, Issue #1, clean branch) is
already done. The goal of this session is to run the real udflow workflow on Issue #1,
capture the evidence into `docs/udflow-run-2026-06-21/`, redact the transcript, and open the PR.

> Why a fresh session: so the run's transcript has **zero scaffold noise** — it reads as exactly
> what a first-time user would see.

## 0. Preconditions
- You are in `D:\github\udflow-public-demo`.
- The udflow plugin is installed (`/plugin` lists `udflow@kktmarketplace`) and `node --version` works (the hooks are Node scripts; with no Node they silently no-op).
- You are on branch `feat/csv-recipient-import` and `git status --short` is **empty**.

## 1. Kickoff prompt (paste this to Claude)

> Read RUNBOOK.md and execute it. Run the udflow workflow on Issue #1 and, as it progresses,
> capture the real evidence into docs/udflow-run-2026-06-21/ (files 01–06) exactly as it
> happens — verbatim findings, "no findings" where true, nothing staged. Stop at the plan
> gate so I can approve, and stop again before opening the PR so I can eyeball the redacted
> transcript.

## 2. Start the workflow

```
/udflow:run Fix issue #1: implement CSV recipient import validation
```

## 3. At the plan gate — BEFORE approving — fill `01-plan-gate.md`
When udflow presents the plan via ExitPlanMode, capture:
- the task line (the `/udflow:run …` command),
- udflow's **restatement** of the requirement,
- the **plan** as presented,
- `git status --short` — it **must be empty** (the plan-gate hook blocks edits while in plan mode).

## 4. Approve — fill `02-approval.md`
Approve the plan, then record your exact approval message + timestamp. Only after this is the
implementer allowed to write files.

## 5. Let it run; capture `03`–`06`
- `03-implementation-summary.md` — changed files, approach, assumptions, risks.
- `04-verification.md` — the `npm run typecheck` / `npm run lint` / `npm test` commands and an output summary (note which edge inputs were exercised: empty, malformed, duplicate, multibyte).
- `05-reviewers.md` — for **each selected reviewer**, its findings **verbatim** (or "no findings"). Do not edit or invent. Note which reviewers were selected and, briefly, why.
- `06-gatekeeper.md` — aggregated blockers / major / minor, conflict resolution if any, the **final verdict**, and the repair loop if one occurred.

## 6. Transcript → `transcript.redacted.md`
- The raw session transcript JSONL is under `C:\Users\simba\.claude\projects\D--github-udflow-public-demo\`.
- Keep the RAW copy **local / outside the repo** (or named `*.raw.*`, which `.gitignore` already excludes). **Never commit the raw transcript.**
- Produce `transcript.redacted.md` per `redaction-notes.md`:
  - **Strip:** local absolute paths, home/username paths, tokens/keys/cookies/env vars, private repo names, unrelated shell output, internal system/tool content. **Do not run `gh auth status` during the run** — it prints a token.
  - **Preserve:** task, restatement, plan, approval, changed-files summary, verification summary, every reviewer finding, repair loop, gatekeeper verdict.
- Fill `redaction-notes.md` and confirm no workflow stage was cut.

## 7. Commit + open the PR
- **Commit 1 (code):** the implementation + tests the run produced — `feat: implement importRecipients CSV validation (refs #1)`.
- **Commit 2 (evidence):** the filled docs — `docs: add udflow run evidence (2026-06-21)`.
- Push: `git push -u origin feat/csv-recipient-import`.
- Open the PR (base `main`) with this description, filled with the **real** outcomes:

```
## What This Demonstrates
- /udflow:run started the workflow
- Plan gate happened before any file modification
- User approved the plan before implementation
- Selected reviewers ran: spec / test / code / security
- Gatekeeper final verdict: <READY | FIX REQUIRED | NOT READY>

## Plan Gate Evidence
- Before plan: git status --short = clean
- Before approval: git status --short = clean
- After approval: implementation commits/files changed

## Verification
- npm run typecheck    - npm run lint    - npm test    (+ CI on the PR)

## Review Evidence
- spec-reviewer / test-reviewer / code-reviewer / security-reviewer: <actual findings or "no findings">
- gatekeeper: <verdict>

## Transcript
See docs/udflow-run-2026-06-21/transcript.redacted.md
```

## 8. Hand back (Phase 3)
Stop after the PR is opened. The repo stays **private** until you've reviewed the redacted
evidence. Then flip it public:

```
gh repo edit simba6507/udflow-public-demo --visibility public --accept-visibility-change-consequences
```
