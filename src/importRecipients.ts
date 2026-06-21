/**
 * importRecipients — parse & validate a CSV of recipients.
 *
 * This file pins the public contract (types + signature). The behavior is implemented
 * per Issue #1 — see RUNBOOK.md and docs/udflow-run-2026-06-21/00-task.md.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Email must be printable ASCII: blocks control chars and non-ASCII homoglyphs (e.g. U+212A). */
const ASCII_EMAIL_RE = /^[\x21-\x7E]+$/;
/** C0 (U+0000–U+001F) and C1 (U+007F–U+009F) control characters. */
// eslint-disable-next-line no-control-regex -- matching control chars is the intent here
const CONTROL_RE = /[\x00-\x1F\x7F-\x9F]/;

/** Split CSV text into lines, handling CRLF, CR, and LF terminators. */
function splitLines(csv: string): string[] {
  return csv.split(/\r\n|\r|\n/);
}

/** Validate the header line: exactly `email,name`, case-insensitive, in that order. */
function hasValidHeader(headerLine: string): boolean {
  const cols = headerLine.split(',');
  if (cols.length !== 2) {
    return false;
  }
  const first = (cols[0] ?? '').trim().toLowerCase();
  const second = (cols[1] ?? '').trim().toLowerCase();
  return first === 'email' && second === 'name';
}

export function importRecipients(csv: string): ImportResult {
  const recipients: Recipient[] = [];
  const errors: RowError[] = [];

  if (csv.trim() === '') {
    errors.push({ line: 1, message: 'CSV is empty; expected a header row "email,name".' });
    return { recipients, errors };
  }

  const lines = splitLines(csv);
  const header = lines[0] ?? '';

  if (!hasValidHeader(header)) {
    errors.push({
      line: 1,
      message: 'Invalid header row; expected exactly two columns "email,name" in that order.',
    });
    return { recipients, errors };
  }

  // Strip ALL trailing empty lines (e.g. from terminal EOF newline(s)), but never the header.
  // A blank line in the MIDDLE of data remains a malformed-row error.
  let end = lines.length;
  while (end > 1 && (lines[end - 1] ?? '') === '') {
    end--;
  }
  const seenEmails = new Set<string>();

  for (let i = 1; i < end; i++) {
    const raw = lines[i] ?? '';
    const lineNumber = i + 1;

    const fields = raw.split(',');
    if (fields.length !== 2) {
      errors.push({
        line: lineNumber,
        message: `Malformed row; expected exactly 2 fields but found ${fields.length}.`,
      });
      continue;
    }

    const email = (fields[0] ?? '').trim();
    const name = (fields[1] ?? '').trim();

    if (!EMAIL_RE.test(email) || !ASCII_EMAIL_RE.test(email)) {
      errors.push({ line: lineNumber, message: `Invalid email address: "${email}".` });
      continue;
    }

    if (name === '') {
      errors.push({ line: lineNumber, message: 'Missing name.' });
      continue;
    }

    if (CONTROL_RE.test(name)) {
      errors.push({ line: lineNumber, message: 'Name contains control characters.' });
      continue;
    }

    const key = email.toLowerCase();
    if (seenEmails.has(key)) {
      errors.push({ line: lineNumber, message: `Duplicate email address: "${email}".` });
      continue;
    }

    seenEmails.add(key);
    recipients.push({ email, name });
  }

  return { recipients, errors };
}
