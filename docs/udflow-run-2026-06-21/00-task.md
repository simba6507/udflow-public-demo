# 00 — Task

> Source of truth: **Issue #1**. This file mirrors it so the evidence bundle is self-contained.

## Goal
Implement `importRecipients(csv: string): ImportResult` in `src/importRecipients.ts`.

## Contract
- Required headers: `email,name` (reject if missing)
- Trim whitespace around fields
- Reject malformed emails
- Reject duplicate emails, case-insensitively
- Preserve non-ASCII / multibyte names exactly
- Row-level errors with **1-based** line numbers (the header is line 1)
- Do **not** silently drop malformed rows — every bad row yields an error entry

## Return shape
`ImportResult { recipients: Recipient[]; errors: RowError[] }` (types are pinned in the stub).

## Tests (acceptance)
At least: missing headers · malformed rows / emails · duplicate emails (case-insensitive) · multibyte names preserved.

## Definition of done
`npm run typecheck && npm run lint && npm test` all green; udflow gatekeeper verdict recorded.
