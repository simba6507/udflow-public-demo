# 03 — Implementation summary

**English** · [繁體中文](03-implementation-summary.zh-TW.md)

Two phases: the initial implementation, then a repair pass after the gatekeeper returned
`FIX REQUIRED` (see `06-gatekeeper.md`). This file reflects the final state.

## Files changed
- `src/importRecipients.ts` — replaced the `throw new Error('not implemented')` stub body
  (`+95 / -6`). Pinned types (`Recipient`, `RowError`, `ImportResult`) and the
  `importRecipients` signature are verbatim. No new exports, no new dependencies.
- `src/importRecipients.test.ts` — **new** behavioral test file (vitest), 25 cases.
- `src/importRecipients.smoke.test.ts` — untouched (still green). Config files untouched.

## Approach
- Split input on `/\r\n|\r|\n/` (handles CRLF / CR / LF).
- Validate header (`hasValidHeader`): exactly two columns resolving — trimmed,
  case-insensitive — to `email` then `name`; on failure return one `RowError{line:1}` and
  parse no data rows. Empty/whitespace-only input short-circuits to the same line-1 error.
- Strip a contiguous suffix of empty trailing lines (terminal-newline artifacts) without
  removing the header; a blank line in the **middle** of data remains a malformed-row error.
- Per data row (1-based `lineNumber = i + 1`): require exactly 2 comma fields, else
  malformed-row error. Trim both fields. Then, in order: reject email failing
  `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` **or** `ASCII_EMAIL_RE = /^[\x21-\x7E]+$/`
  (printable-ASCII); reject empty name; reject name containing a C0/C1 control char
  (`CONTROL_RE = /[\x00-\x1F\x7F-\x9F]/`); reject case-insensitive duplicate (key =
  `email.toLowerCase()`, first occurrence kept with trimmed original case). Otherwise push
  the `Recipient`.
- Every rejected row pushes exactly one `RowError` and `continue`s — no silent drops, no
  double-counting.

## Assumptions
- "Missing headers" includes a first line that looks like data — reported as the same line-1
  header error; no separate "header looks like data" detection.
- **Both `email` and `name` are required** — an empty trimmed field is rejected. (This was an
  ambiguity the contract left open; the gatekeeper confirmed "reject empty required fields" as
  a safe call rather than a user round-trip.)
- Email is restricted to **printable ASCII** — internationalized (IDN / non-ASCII local part)
  emails are rejected. The contract requires multibyte preservation for **names**, not emails.
- Error-message wording is not part of the contract (tests assert on `line` and counts).

## Risks introduced / reduced
- **Reduced:** control-char injection (NUL/ESC/DEL/C1) into email and name; Unicode homoglyph
  dedup-collision (`U+212A` Kelvin → `k`); position-dependent trailing-blank-line false errors;
  silently-accepted empty required fields.
- **Introduced:** the ASCII email restriction rejects valid-but-non-ASCII (IDN) addresses —
  an intentional security trade-off, disclosed.
- **Accepted (non-blocking):** no max input-size / row-count cap (pure, linear function;
  ReDoS affirmatively ruled out — caller's boundary). Bidi/zero-width chars may pass into
  `name` — a downstream render/send-sink concern, not this no-sink parser's responsibility,
  and stripping them would violate the verbatim-multibyte contract.
