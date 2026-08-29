import type { DuplicateGroup, InventoryItem, SheetData } from "../types/print";
import { parseSpreadsheetId, toA1Column } from "../utils/sheet_url";

const API_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_IDENTITY_SCRIPT =
  "https://accounts.google.com/gsi/client";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

type SheetSourceErrorCode =
  | "CONFIG_MISSING"
  | "INVALID_SHEET_URL"
  | "GOOGLE_IDENTITY_UNAVAILABLE"
  | "GOOGLE_AUTH_FAILED"
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

interface SpreadsheetMetadata {
  properties?: {
    title?: unknown;
  };
  sheets?: Array<{
    properties?: {
      title?: unknown;
    };
  }>;
}

interface ValuesResponse {
  values?: unknown;
}

let accessToken: string | null = null;
let tokenClient: GoogleTokenClient | null = null;
let identityScriptPromise: Promise<void> | null = null;

function getClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new SheetSourceError("CONFIG_MISSING");
  }
  return clientId;
}

function waitForGoogleIdentity(timeoutMs = 10000): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (identityScriptPromise) {
    return identityScriptPromise;
  }

  identityScriptPromise = new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
    );

    const finish = (error?: SheetSourceError) => {
      window.clearInterval(timer);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
      identityScriptPromise = null;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const handleLoad = () => {
      if (window.google?.accounts?.oauth2) {
        finish();
      }
    };
    const handleError = () => finish(new SheetSourceError("GOOGLE_IDENTITY_UNAVAILABLE"));
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        finish();
      } else if (Date.now() - startedAt > timeoutMs) {
        finish(new SheetSourceError("GOOGLE_IDENTITY_UNAVAILABLE"));
      }
    }, 100);

    if (script) {
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
    } else {
      const dynamicScript = document.createElement("script");
      dynamicScript.src = GOOGLE_IDENTITY_SCRIPT;
      dynamicScript.async = true;
      dynamicScript.defer = true;
      dynamicScript.addEventListener("load", handleLoad, { once: true });
      dynamicScript.addEventListener("error", handleError, { once: true });
      document.head.append(dynamicScript);
    }
  });

  return identityScriptPromise;
}

async function signIn(): Promise<void> {
  await waitForGoogleIdentity();

  if (!tokenClient) {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: SHEETS_SCOPE,
      callback: () => undefined,
    });
  }

  await new Promise<void>((resolve, reject) => {
    tokenClient!.callback = (response) => {
      if (response.error || !response.access_token) {
        reject(new SheetSourceError("GOOGLE_AUTH_FAILED"));
        return;
      }
      accessToken = response.access_token;
      resolve();
    };

    tokenClient!.requestAccessToken({
      prompt: accessToken ? "" : "consent",
    });
  });
}

function getApiErrorCode(status: number): SheetSourceErrorCode {
  if (status === 403) return "SHEET_ACCESS_DENIED";
  if (status === 404) return "SHEET_NOT_FOUND";
  return "SHEET_READ_FAILED";
}

async function apiGet<T>(path: string): Promise<T> {
  if (!accessToken) {
    await signIn();
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    throw new SheetSourceError("SHEET_READ_FAILED", error);
  }

  if (response.status === 401) {
    accessToken = null;
    throw new SheetSourceError("GOOGLE_AUTH_FAILED");
  }

  if (!response.ok) {
    throw new SheetSourceError(getApiErrorCode(response.status));
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new SheetSourceError("SHEET_READ_FAILED", error);
  }
}

function quoteSheetName(name: string): string {
  return `'${name.replaceAll("'", "''")}'`;
}

function getRows(response: ValuesResponse): string[][] {
  if (!Array.isArray(response.values)) return [];

  return response.values
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => String(cell ?? "")));
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

  const metadata = await apiGet<SpreadsheetMetadata>(
    `${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties.title`,
  );
  const spreadsheetTitle =
    typeof metadata.properties?.title === "string"
      ? metadata.properties.title
      : spreadsheetId;
  const sheetName =
    typeof metadata.sheets?.[0]?.properties?.title === "string"
      ? metadata.sheets[0].properties.title
      : "";

  if (!sheetName) {
    throw new SheetSourceError("SHEET_NOT_FOUND");
  }

  const range = `${quoteSheetName(sheetName)}!A:Z`;
  const valuesResponse = await apiGet<ValuesResponse>(
    `${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
  );
  const rows = getRows(valuesResponse);
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
    spreadsheetTitle,
    sheetName,
    items,
    totalRows: Math.max(0, rows.length - 1),
    dataErrorCount,
    duplicateGroups: buildDuplicateGroups(items),
  };
}

export function signOut(): void {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => undefined);
  }
  accessToken = null;
}
