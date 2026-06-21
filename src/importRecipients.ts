/**
 * importRecipients — parse & validate a CSV of recipients.
 *
 * SCAFFOLD STUB. This file pins the public contract (types + signature) so the udflow
 * run reviews against contract-level intent, but the behavior and its behavioral tests
 * are intentionally produced by that run — see RUNBOOK.md and Issue #1. Do not implement
 * it here as part of scaffolding.
 *
 * Contract (full text: docs/udflow-run-2026-06-21/00-task.md):
 *  - Required headers: email,name (reject if missing)
 *  - Trim whitespace around fields
 *  - Reject malformed emails
 *  - Reject duplicate emails, case-insensitively
 *  - Preserve non-ASCII / multibyte names exactly
 *  - Row-level errors with 1-based line numbers (the header is line 1)
 *  - Never silently drop malformed rows — every bad row yields an error entry
 */

export interface Recipient {
  email: string;
  name: string;
}

export interface RowError {
  /** 1-based line number in the source CSV; the header is line 1. */
  line: number;
  message: string;
}

export interface ImportResult {
  recipients: Recipient[];
  errors: RowError[];
}

export function importRecipients(_csv: string): ImportResult {
  throw new Error('not implemented');
}
