import type { DuplicateGroup, InventoryItem, SheetData } from "../types/print";
import { parseSpreadsheetId, toA1Column } from "../utils/sheet_url";

const CSV_EXPORT_URL = "https://docs.google.com/spreadsheets/d";

interface CsvDownload {
  csv: string;
  spreadsheetTitle: string;
}

type SheetSourceErrorCode =
  | "INVALID_SHEET_URL"
  | "SHEET_NOT_FOUND"
  | "SHEET_ACCESS_DENIED"
  | "SHEET_READ_FAILED"
  | "COLUMN_NOT_FOUND"
  | "NO_VALID_ID";

export class SheetSourceError extends Error {
  constructor(
    public readonly code: SheetSourceErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = "SheetSourceError";
  }
}

function getFetchErrorCode(status: number): SheetSourceErrorCode {
  if (status === 401 || status === 403) return "SHEET_ACCESS_DENIED";
  if (status === 404) return "SHEET_NOT_FOUND";
  return "SHEET_READ_FAILED";
}

function decodeFilename(value: string): string | null {
  const trimmed = value.trim().replace(/^"(.*)"$/, "$1");

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed || null;
  }
}

function getSpreadsheetTitle(response: Response, spreadsheetId: string): string {
  const contentDisposition = response.headers.get("Content-Disposition");
  if (!contentDisposition) return spreadsheetId;

  const extendedMatch = contentDisposition.match(
    /filename\*\s*=\s*[^']*'[^']*'([^;]+)/i,
  );
  const plainMatch = contentDisposition.match(
    /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i,
  );
  const filename = decodeFilename(
    extendedMatch?.[1] ?? plainMatch?.[1] ?? plainMatch?.[2] ?? "",
  );
  if (!filename) return spreadsheetId;

  const titleWithExtension = filename.replace(/\.[^.]+$/, "").trim();
  const separatorIndex = titleWithExtension.lastIndexOf(" - ");
  const title =
    separatorIndex > 0
      ? titleWithExtension.slice(0, separatorIndex).trim()
      : titleWithExtension;

  return title || spreadsheetId;
}

async function downloadCsv(spreadsheetId: string): Promise<CsvDownload> {
  const exportUrl = `${CSV_EXPORT_URL}/${encodeURIComponent(spreadsheetId)}/export?format=csv`;
  let response: Response;

  try {
    response = await fetch(exportUrl);
  } catch (error) {
    throw new SheetSourceError("SHEET_READ_FAILED", error);
  }

  if (!response.ok) {
    throw new SheetSourceError(getFetchErrorCode(response.status));
  }

  let csv: string;
  try {
    csv = await response.text();
  } catch (error) {
    throw new SheetSourceError("SHEET_READ_FAILED", error);
  }

  if (!csv.trim()) {
    throw new SheetSourceError("SHEET_READ_FAILED");
  }

  if (/<(?:html|body)\b/i.test(csv.slice(0, 500))) {
    throw new SheetSourceError("SHEET_ACCESS_DENIED");
  }

  return {
    csv,
    spreadsheetTitle: getSpreadsheetTitle(response, spreadsheetId),
  };
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }
    } else {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new SheetSourceError("SHEET_READ_FAILED");
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows[0]?.[0]?.startsWith("\uFEFF")) {
    rows[0][0] = rows[0][0].slice(1);
  }

  return rows;
}

function isNonEmptyRow(row: string[]): boolean {
  return row.some((cell) => cell.trim().length > 0);
}

function buildDuplicateGroups(items: InventoryItem[]): DuplicateGroup[] {
  const locationsById = new Map<string, string[]>();
  items.forEach((item) => {
    const locations = locationsById.get(item.id) ?? [];
    locations.push(item.cellAddress);
    locationsById.set(item.id, locations);
  });

  return [...locationsById.entries()]
    .filter(([, locations]) => locations.length > 1)
    .map(([id, locations]) => ({ id, locations }));
}

export async function readSheet(url: string): Promise<SheetData> {
  let spreadsheetId: string;
  try {
    spreadsheetId = parseSpreadsheetId(url);
  } catch (error) {
    throw new SheetSourceError("INVALID_SHEET_URL", error);
  }

  const csvDownload = await downloadCsv(spreadsheetId);
  const rows = parseCsv(csvDownload.csv);
  const headers = rows[0] ?? [];
  const idColumnIndex = headers.findIndex((header) => header.trim() === "id");

  if (idColumnIndex < 0) {
    throw new SheetSourceError("COLUMN_NOT_FOUND");
  }

  const items: InventoryItem[] = [];
  let dataErrorCount = 0;

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const id = (row[idColumnIndex] ?? "").trim();

    if (!id) {
      if (isNonEmptyRow(row)) dataErrorCount += 1;
      return;
    }

    items.push({
      id,
      rowNumber,
      cellAddress: `${toA1Column(idColumnIndex)}${rowNumber}`,
    });
  });

  if (items.length === 0) {
    throw new SheetSourceError("NO_VALID_ID");
  }

  return {
    spreadsheetId,
    spreadsheetTitle: csvDownload.spreadsheetTitle,
    sheetName: "CSV export",
    items,
    totalRows: Math.max(0, rows.length - 1),
    dataErrorCount,
    duplicateGroups: buildDuplicateGroups(items),
  };
}
