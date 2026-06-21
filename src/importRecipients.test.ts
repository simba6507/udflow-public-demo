import { describe, it, expect } from 'vitest';
import { importRecipients } from './importRecipients';

describe('importRecipients', () => {
  describe('headers', () => {
    it('empty input → single line-1 error, no recipients', () => {
      const result = importRecipients('');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(1);
    });

    it('whitespace-only input → single line-1 error', () => {
      const result = importRecipients('   \n  \n');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(1);
    });

    it('missing headers (data where header should be) → line-1 error, no data parsed', () => {
      const result = importRecipients('a@b.com,Alice\nc@d.com,Carol');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(1);
    });

    it('wrong-order headers (name,email) → line-1 error, no recipients', () => {
      const result = importRecipients('name,email\nAlice,a@b.com');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(1);
    });

    it('wrong column count in header → line-1 error', () => {
      const result = importRecipients('email,name,extra\na@b.com,Alice');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(1);
    });

    it('case-insensitive header with surrounding whitespace is accepted', () => {
      const result = importRecipients(' Email , Name \na@b.com,Alice');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });
  });

  describe('happy path', () => {
    it('trims surrounding whitespace on both fields', () => {
      const result = importRecipients('email,name\n  a@b.com  ,   Alice   ');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });
  });

  describe('malformed rows', () => {
    it('1-field row and 3-field row → errors at correct 1-based lines', () => {
      const csv = 'email,name\njustonefield\na@b.com,Alice,extra';
      const result = importRecipients(csv);
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.line).toBe(2);
      expect(result.errors[1]?.line).toBe(3);
    });

    it('blank line in the middle of data is a malformed row error', () => {
      const csv = 'email,name\na@b.com,Alice\n\nc@d.com,Carol';
      const result = importRecipients(csv);
      expect(result.recipients).toEqual([
        { email: 'a@b.com', name: 'Alice' },
        { email: 'c@d.com', name: 'Carol' },
      ]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(3);
    });
  });

  describe('trailing blank lines (position-independent)', () => {
    it('one trailing blank line → no error, one recipient', () => {
      const result = importRecipients('email,name\na@b.com,Alice\n\n');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });

    it('multiple trailing blank lines → no error, one recipient', () => {
      const result = importRecipients('email,name\na@b.com,Alice\n\n\n');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });
  });

  describe('required fields', () => {
    it('empty name → 0 recipients, 1 error at line 2', () => {
      const result = importRecipients('email,name\na@b.com,');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(2);
    });

    it('empty email → 0 recipients, 1 error at line 2', () => {
      const result = importRecipients('email,name\n,Bob');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(2);
    });
  });

  describe('control characters and homoglyphs', () => {
    it('control char in email → rejected (0 recipients, 1 error)', () => {
      const result = importRecipients('email,name\nadmin\x00@evil.com,Bob');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(2);
    });

    it('control char in name → rejected (0 recipients, 1 error)', () => {
      const result = importRecipients('email,name\na@b.com,Bo\x07b');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(2);
    });

    it('legitimate multibyte name is still accepted', () => {
      const result = importRecipients('email,name\na@b.com,山田太郎');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: '山田太郎' }]);
    });

    it('U+212A Kelvin-sign homoglyph email → rejected (non-ASCII)', () => {
      const result = importRecipients('email,name\nKelvin@b.com,K');
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(2);
    });
  });

  describe('accounting without trailing newline (TEST-M1)', () => {
    it('recipients + errors equals exact data-row count', () => {
      const csv =
        'email,name\n' +
        'a@b.com,Alice\n' + // valid
        'bad-email,Bob\n' + // invalid email
        'c@d.com,\n' + // missing name
        ',Dave\n' + // missing email
        'a@b.com,Dup'; // duplicate (no trailing newline)
      const dataRowCount = 5;
      const result = importRecipients(csv);
      expect(result.recipients.length + result.errors.length).toBe(dataRowCount);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });
  });

  describe('email validation', () => {
    it('rejects missing @, missing domain dot, and internal space', () => {
      const csv = 'email,name\nnoatsign.com,A\nuser@nodot,B\nhas space@b.com,C';
      const result = importRecipients(csv);
      expect(result.recipients).toEqual([]);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.map((e) => e.line)).toEqual([2, 3, 4]);
    });
  });

  describe('dedup (case-insensitive)', () => {
    it('keeps first occurrence with original case; later dup is an error', () => {
      const csv = 'email,name\nA@B.com,First\na@b.com,Second';
      const result = importRecipients(csv);
      expect(result.recipients).toEqual([{ email: 'A@B.com', name: 'First' }]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBe(3);
    });
  });

  describe('multibyte names preserved exactly', () => {
    it('preserves CJK, accented, and emoji names verbatim', () => {
      const csv =
        'email,name\na@b.com,山田太郎\nc@d.com,Renée\ne@f.com,Joy 😀';
      const result = importRecipients(csv);
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([
        { email: 'a@b.com', name: '山田太郎' },
        { email: 'c@d.com', name: 'Renée' },
        { email: 'e@f.com', name: 'Joy 😀' },
      ]);
    });
  });

  describe('line endings', () => {
    it('trailing newline at EOF produces no spurious error', () => {
      const result = importRecipients('email,name\na@b.com,Alice\n');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });

    it('CRLF line endings do not leak \\r into the last field', () => {
      const result = importRecipients('email,name\r\na@b.com,Alice\r\n');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
      expect(result.recipients[0]?.name).toBe('Alice');
    });

    it('bare CR line endings are handled', () => {
      const result = importRecipients('email,name\ra@b.com,Alice');
      expect(result.errors).toEqual([]);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
    });
  });

  describe('no silent drops', () => {
    it('every data row is accounted for by exactly one recipient or one error', () => {
      const csv =
        'email,name\n' +
        'a@b.com,Alice\n' + // valid
        'bad-email,Bob\n' + // invalid email
        'a@b.com,Dup\n' + // duplicate
        'one\n' + // malformed (1 field)
        'c@d.com,Carol,extra\n'; // malformed (3 fields)
      const dataRowCount = 5;
      const result = importRecipients(csv);
      expect(result.recipients.length + result.errors.length).toBe(dataRowCount);
      expect(result.recipients).toEqual([{ email: 'a@b.com', name: 'Alice' }]);
      expect(result.errors.map((e) => e.line)).toEqual([3, 4, 5, 6]);
    });
  });
});
