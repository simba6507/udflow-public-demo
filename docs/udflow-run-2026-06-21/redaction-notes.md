# Redaction notes

> ⏳ **TODO (Phase 2)** — record exactly what was redacted, and confirm nothing essential was cut.

The public [`transcript.redacted.md`](transcript.redacted.md) is derived from a local raw
transcript that is **not** committed (kept outside the repo, or as a gitignored `*.raw.*` file).

## Stripped
- [ ] Local absolute paths (`C:\Users\…`, `D:\github\…`) → `~` / `<repo>`
- [ ] Home / username paths
- [ ] Tokens / API keys / cookies / env vars (e.g. `gho_*`, `Token:` lines)
- [ ] Private repo names
- [ ] Unrelated shell output
- [ ] Internal system / tool content not meant to be public

## Preserved (verified present in the redacted transcript)
- [ ] User task
- [ ] Requirement understanding / restatement
- [ ] Plan
- [ ] Approval
- [ ] Changed-files summary
- [ ] Verification command + output summary
- [ ] Each reviewer finding
- [ ] Repair loop (if any)
- [ ] Gatekeeper final verdict

## Confirmation
_(state: "No workflow stage was removed; only the categories above were redacted.")_
