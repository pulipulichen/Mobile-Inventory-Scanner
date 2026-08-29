export class InvalidSheetUrlError extends Error {
  constructor() {
    super("INVALID_SHEET_URL");
    this.name = "InvalidSheetUrlError";
  }
}

export function parseSpreadsheetId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidSheetUrlError();
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidSheetUrlError();
  }

  if (
    !["https:", "http:"].includes(url.protocol) ||
    !["docs.google.com", "docs.googleusercontent.com"].includes(url.hostname)
  ) {
    throw new InvalidSheetUrlError();
  }

  const match = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
  if (!match?.[1]) {
    throw new InvalidSheetUrlError();
  }

  return match[1];
}

export function tryParseSpreadsheetId(value: string): string | null {
  try {
    return parseSpreadsheetId(value);
  } catch {
    return null;
  }
}

export function toA1Column(index: number): string {
  let value = index + 1;
  let column = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }

  return column;
}
