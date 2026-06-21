# 01 — Plan gate

**English** · [繁體中文](01-plan-gate.zh-TW.md)

Captured at the plan gate, **before** approval. udflow entered Claude Code's native plan
mode first (read-only), did requirement understanding + grounding, asked one scoping
question, then presented the plan via `ExitPlanMode`.

## Task (verbatim)
```
/udflow:run Fix issue #1: implement CSV recipient import validation
```

## udflow restatement
Implement `importRecipients(csv: string): ImportResult` in `src/importRecipients.ts`,
replacing the scaffold stub, to the Issue #1 contract:

- Required headers `email,name` (reject if missing/wrong).
- Trim whitespace around fields.
- Reject malformed emails.
- Reject duplicate emails, case-insensitively.
- Preserve non-ASCII / multibyte names exactly.
- Row-level errors with **1-based** line numbers (header is line 1).
- Never silently drop malformed rows — every bad row yields an error entry.

Classified as **high-risk / correctness-critical** (untrusted input, parsing, encoding,
dedup), so the run pre-committed to two independent reviewer lenses rather than one.

## Decision surfaced at the gate (AskUserQuestion)
CSV field separation / quoting is unspecified by the contract. Options presented:
**Strict 2-column** (split on comma, exactly 2 fields per data row, no quote handling) vs
**RFC 4180 quoting**. User selected **Strict 2-column** — names cannot contain commas; a
1-field or 3+-field row is a malformed-row error.

## Plan (as presented via ExitPlanMode)
**Sharpened contract:** headers exactly two columns resolving (trimmed, case-insensitive) to
`email` then `name` in order, else one `RowError{line:1}` and no data parsed; trim fields,
preserve internal multibyte exactly; strict 2-column rows; pragmatic email regex
`^[^\s@]+@[^\s@]+\.[^\s@]+$`; case-insensitive dedup (first kept with trimmed original case,
later → error); 1-based line numbers; no silent drops.

**Edge checklist routed to verification:** empty/whitespace input → line-1 error; header with
no data → empty result; trailing EOF newline → no spurious error; middle blank line →
malformed error; mixed `\r\n`/`\n`; case-insensitive duplicate; multibyte names; malformed
emails; header order/casing.

**Approach:** single file `src/importRecipients.ts` (replace stub body, keep pinned
types/signature verbatim) + new `src/importRecipients.test.ts`; split on `/\r\n|\r|\n/`;
validate header → early return on failure; iterate data lines with 1-based index; small local
helpers; no new deps.

**Verification:** `npm run typecheck` / `npm run lint` / `npm test`.

**Review & readiness:** panel `spec` + `test` (core) + `code` + `security` (input-handling
risk), then `gatekeeper`.

## Working tree is clean before approval
```
$ git rev-parse --abbrev-ref HEAD
feat/csv-recipient-import

$ git status --short
(empty — the plan-gate hook blocks edits while in plan mode)
```
