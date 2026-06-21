# 06 — Gatekeeper

**English** · [繁體中文](06-gatekeeper.zh-TW.md)

The gatekeeper ran **twice**: once after the initial panel (verdict `FIX REQUIRED`) and once
after the repair + re-review (verdict `READY`).

## Iteration 1 — verdict `FIX REQUIRED`

### Blockers
None.

### Major (must-fix)
1. **SEC-M1** — control characters (C0/C1) bypass email validation; `name` never validated.
2. **SEC-M2** — `U+212A` Kelvin-sign `toLowerCase()` dedup-key collision.
3. **SPEC-M1** — trailing blank line (`…\n\n`) reported as a spurious malformed row.
4. **SPEC-M2** — empty required field silently accepted (`a@b.com,` → `{email, name:''}`).
   Reclassified from advisory to **must-fix**; the gatekeeper accepted "reject empty required
   fields" as a **safe orchestrator call**, not a product decision requiring a user round-trip.

### Minor
Promoted to land **with** the fix: empty-email/empty-name branch tests; a no-trailing-newline
accounting test. Accepted as-is / non-blocking: `?? ''` guards, loose-regex note, header-only
corner, input-size cap.

### Conflict resolution
No reviewer-vs-reviewer conflict. `code-reviewer`'s "no edits" was narrower (traced functional
correctness on changed paths but did not model attacker input or trailing-blank topology);
`security-reviewer` and `spec-reviewer` supplied concrete reproductions, so their majors govern.
All four majors re-confirmed by independent reproduction.

### Repair (one iteration)
1. Position-independent trailing-empty-line stripping (middle blanks still error).
2. Reject empty trimmed email **or** name.
3. `ASCII_EMAIL_RE = /^[\x21-\x7E]+$/` on email — closes SEC-M1 (email side) **and** SEC-M2 in
   one guard; `CONTROL_RE = /[\x00-\x1F\x7F-\x9F]/` rejects control chars in `name` while
   preserving CJK/accented/emoji.
4. Tests for all new branches + the `\n\n` / `\n\n\n` and no-trailing-newline cases.
Input-size cap intentionally left out as accepted non-blocking.

---

## Iteration 2 — verdict `READY`

### Blockers
None.

### Major
None. All four prior majors independently confirmed resolved (runtime probes, not just
re-reading): homoglyph/control gate runs before `toLowerCase()`; C1/DEL/NUL rejected across both
local and domain parts; C1-vs-Latin-1 boundary correct; trailing/middle blank handling correct.

### Minor (all optional follow-up; none gate the release)
- Empty-email message precision (`Missing email.` for symmetry).
- Naive comma split / no RFC-4180 quoting — pre-existing, out of scope, fails loud.
- Bidi/zero-width chars into `name` — security-reviewer explicitly recommends **no code change**
  (no-sink parser + verbatim-multibyte contract); doc note only.
- Whitespace-only trailing line reported as malformed — deliberate judgment call.
- Two security-relevant test minors (C1/DEL email case; `CONTROL_RE` boundary-accept case) —
  the gatekeeper verified by direct probe that the code **already** behaves correctly, so these
  are **regression-guard hardening, not defects**; acceptable as follow-up, recommended on the
  next touch of the file.

### Conflict resolution
No substantive conflict. The one place a reviewer could have pushed for a code change
(security-reviewer on Bidi/zero-width chars) was self-resolved **against** a change with explicit
rationale (no output sink + verbatim-preservation contract); the gatekeeper accepted that
position. No minor was re-rated upward — none describes a concrete wrong result.

### Repair loop
One iteration total (Round 1 → repair → Round 2). No second repair needed.

## Final verdict
**`READY`**

## Rationale
All four prior majors resolved and independently re-verified by runtime probe; typecheck, lint,
and the full 26-test suite pass on the gatekeeper's own run. The change's risky/boundary inputs
(control chars, homoglyphs, trailing/middle blanks, dedup case-fold, CRLF/CR, missing fields)
are each exercised by non-tautological tests confirmed via mutation testing. Every open item is a
genuine `minor` or a guard for already-correct behavior — none gates the release.

**Failure-memory decision:** not required — iteration-1 majors were resolved within the session,
no repeated blocker category across iterations, and the lessons are encoded as pinned regression
tests (the more durable prevention). No `ai/FAILURE_MEMORY.md` was written.

**Model:** the gatekeeper ran on Opus 4.8 (1M context); full verdict confidence, no fallback.
