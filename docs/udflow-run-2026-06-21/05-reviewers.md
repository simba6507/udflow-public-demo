# 05 — Reviewers

Findings as reported by each selected reviewer. The run had **two review rounds**: an initial
panel (which surfaced four `major` findings) and a re-review after the repair. Severity labels
(`blocker` / `major` / `minor`) are the reviewers' own. Nothing here is staged.

## Selected panel (and why)
Smallest sufficient set for an **attacker-controlled CSV parser** (parsing / encoding / dedup /
untrusted input):
- **spec-reviewer** — core; requirement & contract fidelity. Always selected for non-trivial work.
- **test-reviewer** — core; coverage, edge/failure paths, regression risk. Always selected.
- **code-reviewer** — conditional; non-trivial logic (regex, indexing, branch ordering).
- **security-reviewer** — conditional; untrusted input at a validation boundary.

Not selected (not applicable): `architecture-reviewer`, `operability-reviewer` (single pure
function, no integration/persistence/deploy surface), `ui-ux-reviewer` (no UI).

---

## Round 1 — initial panel

### spec-reviewer — no `blocker`; **2 major**, 2 minor
- **MAJOR-1 (trailing blank line):** `email,name\na@b.com,Alice\n\n` → spurious malformed-row
  error at line 3 (and `\n\n\n` → lines 3 and 4). The `i === lastIndex` guard only forgives a
  single trailing empty line; a trailing **blank** line (two terminal newlines — common from
  real exporters) is mis-reported. Positionally inconsistent. Fix: make trailing-empty handling
  position-independent + tests for `\n\n` / `\n\n\n`.
- **MAJOR-2 (empty required field):** `a@b.com,` (valid email, empty name) is silently
  **accepted** as `{email:'a@b.com', name:''}` — a hidden business-rule assumption. Contract is
  silent on empty required fields. Fix: decide the rule (recommend reject) + tests, or document
  acceptance.
- Minors: header-only input returns `{[],[]}` with no positive signal (undocumented corner, not
  a defect); missing-header-vs-data-shaped-first-line discards data diagnostics (matches the
  documented assumption).

### test-reviewer — no `blocker`/`major`; minors
- All 9 acceptance clauses exercised with tight assertions (exact line arrays / objects).
- **Minor:** empty-email field (`,Bob`) and empty-name acceptance (`a@b.com,` → `{email,
  name:''}`) are real untested branches; recommends adding them.
- **Minor:** the no-silent-drop omnibus test conflates "5 data rows" with the trailing-newline
  skip; recommends a no-trailing-newline accounting case.
- Confirmed dedup-no-double-add and name-casing-differs are already implicitly covered.

### code-reviewer — no `blocker`/`major`; 2 explanatory minors (no action)
- Traced parsing / dedup / line-numbering correct on all changed paths (incl. trailing-newline,
  CRLF, dedup case).
- **Minor (no change):** redundant-but-required `?? ''` guards forced by
  `noUncheckedIndexedAccess`.
- **Minor (no change):** email regex intentionally loose per the pinned spec.

### security-reviewer — no `blocker`; **2 major**, 1 minor
- **MAJOR-1 (control chars):** `EMAIL_RE` excludes only `@` and `\s`; NUL/BEL/BS/ESC/DEL all
  pass `.test()`. Confirmed empirically. The `name` field is **never validated** (only trimmed).
  Returning NUL/ESC-bearing values verbatim is a downstream exposure (NUL-truncation,
  terminal-escape injection, header smuggling). Fix: reject C0/C1 control chars in email and name.
- **MAJOR-2 (homoglyph dedup collision):** `"Kelvin@b.com"` (KELVIN SIGN `U+212A`) passes
  the regex and `.toLowerCase()` → `"kelvin@b.com"`, colliding with real `"Kelvin@b.com"` —
  dedup-key poisoning. Fix: ASCII-restrict email and/or NFKC-normalize the dedup key.
- **Minor:** no max input-size/row-count bound (linear; arguably caller's responsibility).
- Explicitly ruled out: **ReDoS** — the regex is linear (1M-char worst case ≈ 3 ms).

---

## Round 2 — re-review after the repair

### spec-reviewer — **both prior majors RESOLVED**; no `blocker`/`major`; 2 minor
- Verified at runtime: trailing `\n` / `\n\n` / `\n\n\n` → no spurious error; middle blank still
  errors at the correct line; empty email and empty name both rejected at line 2. New
  ASCII-email + control-char-name rejections do **not** violate "preserve multibyte names
  exactly" (CJK / accented / emoji / NBSP still accepted). No-silent-drop and 1-based lines
  preserved.
- **Minor:** empty-email message `Invalid email address: ""` is less precise than `Missing
  name.` — could add a `Missing email.` branch for symmetry.
- **Minor:** naive comma split (no RFC-4180 quoting) — **pre-existing**, out of pinned scope,
  fails loud (no silent mis-parse).

### security-reviewer — **both prior majors CLOSED** (verified by direct probing); no
`blocker`/`major`; 1 minor
- ASCII gate rejects all C0/C1/DEL and `U+212A` **before** `toLowerCase()`; scanned every
  `0x21–0x7E` codepoint — no residual case-fold collision. ReDoS re-cleared (anchored
  single-class regexes, ~0.1–0.25 ms on 100k-char adversarial input).
- **Minor:** Bidi / zero-width / format chars (`U+202E` RLO, `U+200B` ZWSP) pass into `name`.
  Rated minor **deliberately**: this is a no-sink pure parser and the contract requires verbatim
  multibyte preservation, so stripping would violate the spec; the proportionate response is a
  doc note — defense belongs at the render/send sink. **Recommends no code change here.**

### code-reviewer — no `blocker`/`major`; 1 minor
- `noUncheckedIndexedAccess` satisfied; `eslint-disable no-control-regex` correctly/narrowly
  scoped; regex ranges verified empirically; `end`-index loop has no off-by-one; branch ordering
  yields exactly one error per bad row.
- **Minor:** a whitespace-only trailing line (`...\n   `) is reported as malformed rather than
  stripped (strict-empty `=== ''` check) — defensible under no-silent-drop; one-char fix
  `(lines[end-1] ?? '').trim() === ''` if stripping is intended. Judgment call, flagged for
  deliberateness.

### test-reviewer — no `blocker`/`major`; minors (verified by mutation testing)
- Verified by codepoint inspection + **mutation testing** that every new assertion is
  non-tautological and regression-catching: the Kelvin test truly carries `U+212A`; control-char
  tests carry real NUL/BEL bytes; empty-name vs empty-email vs control-char branches are each
  independently pinned; strip-all vs strip-one is distinguished; accounting tests catch silent
  drops. Pre-existing middle-blank + multibyte tests unweakened.
- **Minor:** email control-char test only covers C0 NUL in the local-part, not C1/DEL or the
  domain-part — recommends e.g. `a@b\x7f.com` (regression guard; code already rejects these).
- **Minor:** `CONTROL_RE` upper boundary (just above `\x9F`, e.g. `U+00A0`) not pinned-as-accepted
  — recommends a boundary-accept case (regression guard; code already accepts `U+00A0`).
- **Minor:** counting note — the behavioral file has 25 `it` blocks; full suite is 26 with the
  smoke test.
