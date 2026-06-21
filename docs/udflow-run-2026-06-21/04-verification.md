# 04 — Verification

Run after implementation and again after the repair pass. The orchestrator re-ran all three
commands independently (not only trusting the subagent's report).

## Commands
```
npm run typecheck
npm run lint
npm test
```

## Output summary
**Final state — all green:**
- `npm run typecheck` → `tsc --noEmit`, exit 0, no output. (tsconfig `strict` +
  `noUncheckedIndexedAccess`.)
- `npm run lint` → `eslint .`, exit 0, 0 problems (one narrowly-scoped
  `eslint-disable-next-line no-control-regex` on the deliberate control-char regex).
- `npm test` → `vitest run`: **Test Files 2 passed (2), Tests 26 passed (26)**
  (25 behavioral in `importRecipients.test.ts` + 1 scaffold smoke test).

Iteration 1 (initial implementation) was green at 17 tests; the repair pass added the new
branches and tests, bringing the suite to 26.

## Risky edge inputs actually exercised (by the test suite)
- **Empty / whitespace-only input** → single line-1 error, no recipients.
- **Missing / wrong-order (`name,email`) / wrong-count headers** → line-1 error, no data parsed.
- **Malformed rows** — 1-field and 3-field → errors at correct 1-based lines; **middle blank
  line** → malformed error; **trailing blank lines** (`\n\n`, `\n\n\n`) → no spurious error.
- **Malformed emails** — missing `@`, missing domain dot, internal space.
- **Empty required fields** — empty email (`,Bob`) and empty name (`a@b.com,`) → rejected.
- **Control chars / homoglyph** — NUL in email, BEL in name, `U+212A` Kelvin-sign email → all
  rejected; legitimate multibyte (`山田太郎`, `Renée`, `Joy 😀`) still accepted verbatim.
- **Duplicate emails, case-insensitive** (`A@B.com` then `a@b.com`) → first kept (original
  case), second is an error at the correct line.
- **Line endings** — CRLF (no `\r` leak into last field) and bare CR.
- **No silent drops** — `recipients.length + errors.length === data-row count`, asserted both
  with and without a trailing newline.
