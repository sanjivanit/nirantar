import { parse } from 'csv-parse/sync';

// Engineering decisions, not spec requirements — the spec (docs/spec.md
// Piece 2) states no file-size or row-count limit at all. These exist so a
// single upload can't exhaust memory or block the event loop; both values
// are arbitrary but generous for a real vendor-master export.
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_ROWS = 5000;

const REQUIRED_COLUMNS = ['name'];

// Structural GSTIN format only (state code + 10-char PAN + entity code +
// literal 'Z' + checksum char) — not full checksum verification, which is a
// separate, more involved algorithm the spec doesn't ask for. This is the
// standard structural pattern used for basic format validation.
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface ParsedRow {
  raw_name: string;
  raw_gstin: string | null;
  raw_pan: string | null;
  raw_bank_account: string | null;
  raw_ifsc: string | null;
}

export interface RowParseError {
  row: number; // 1-based, counting the header as row 0
  reason: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: RowParseError[];
}

// Thrown for problems that make the whole file unusable — as opposed to a
// single bad row, which becomes a RowParseError and doesn't stop the rest
// of the file from importing (spec.md: "messy uploads are never silently
// lost"). A missing required column, or content that isn't parseable CSV
// structure at all (row boundaries can't even be determined), can't be
// scoped to a row number, so those reject the whole request instead.
export class CsvFileError extends Error {}

function normalize(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseVendorCsv(buffer: Buffer): ParseResult {
  if (buffer.length === 0) {
    throw new CsvFileError('File is empty');
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new CsvFileError(`File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
  }

  // columns:false — parse as raw string[][] rather than csv-parse's own
  // columns:true mode, which throws and aborts the entire parse on the
  // first row with a different field count than the header. We want a
  // mismatched row to become a single RowParseError, not kill the import.
  let raw: string[][];
  try {
    raw = parse(buffer, { columns: false, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw new CsvFileError(`Could not parse file as CSV: ${(err as Error).message}`);
  }

  if (raw.length === 0) {
    throw new CsvFileError('File is empty');
  }

  const headers = raw[0].map((h) => h.trim().toLowerCase());
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      throw new CsvFileError(`CSV is missing required column: ${col}`);
    }
  }

  const dataRows = raw.slice(1);
  if (dataRows.length > MAX_ROWS) {
    throw new CsvFileError(`File exceeds the ${MAX_ROWS}-row limit (has ${dataRows.length} rows)`);
  }

  const nameIdx = headers.indexOf('name');
  const gstinIdx = headers.indexOf('gstin');
  const panIdx = headers.indexOf('pan');
  const bankIdx = headers.indexOf('bank_account');
  const ifscIdx = headers.indexOf('ifsc');

  const rows: ParsedRow[] = [];
  const errors: RowParseError[] = [];

  dataRows.forEach((fields, i) => {
    const rowNum = i + 1; // 1-based, data rows only (header is row 0)

    if (fields.length !== headers.length) {
      errors.push({
        row: rowNum,
        reason: `expected ${headers.length} columns, got ${fields.length}`,
      });
      return;
    }

    const name = normalize(fields[nameIdx]);
    if (!name) {
      errors.push({ row: rowNum, reason: 'missing required field: name' });
      return;
    }

    const gstin = normalize(fields[gstinIdx]);
    if (gstin && !GSTIN_FORMAT.test(gstin)) {
      errors.push({ row: rowNum, reason: 'invalid GSTIN format' });
      return;
    }

    rows.push({
      raw_name: name,
      raw_gstin: gstin,
      raw_pan: normalize(fields[panIdx]),
      raw_bank_account: normalize(fields[bankIdx]),
      raw_ifsc: normalize(fields[ifscIdx]),
    });
  });

  return { rows, errors };
}
