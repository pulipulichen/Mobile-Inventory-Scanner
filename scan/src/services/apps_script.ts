import type { InventoryItem } from "../types/scan";

const REQUEST_TIMEOUT_MS = 20_000;

export type AppsScriptErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_ID"
  | "INVALID_LOCATION"
  | "ID_NOT_FOUND"
  | "DUPLICATE_ID"
  | "SHEET_NOT_FOUND"
  | "COLUMN_NOT_FOUND"
  | "WRITE_FAILED"
  | "READ_FAILED"
  | "UNKNOWN";

const POST_ABORT_MS = 12_000;
const SHEET_TIMEZONE = "Asia/Taipei";

interface AppsScriptSuccessResponse {
  success: true;
  item?: unknown;
  items?: unknown;
  results?: unknown;
}

interface AppsScriptFailureResponse {
  success: false;
  error?: unknown;
  message?: unknown;
  id?: unknown;
}

export class AppsScriptError extends Error {
  constructor(
    public readonly code: AppsScriptErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = "AppsScriptError";
  }
}

export function isAppsScriptUrl(url: string): boolean {
  try {
    const endpoint = new URL(url.trim());
    return (
      endpoint.protocol === "https:" &&
      endpoint.hostname === "script.google.com" &&
      /^\/macros\/s\/[^/]+\/exec\/?$/.test(endpoint.pathname)
    );
  } catch {
    return false;
  }
}

function getEndpoint(url: string, action?: string): URL {
  let endpoint: URL;
  try {
    endpoint = new URL(url.trim());
  } catch (error) {
    throw new AppsScriptError("INVALID_REQUEST", error);
  }

  if (!isAppsScriptUrl(url)) {
    throw new AppsScriptError("INVALID_REQUEST");
  }

  if (action) endpoint.searchParams.set("action", action);
  return endpoint;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorCode(value: unknown): AppsScriptErrorCode {
  const code = getString(value);
  const knownCodes: AppsScriptErrorCode[] = [
    "INVALID_REQUEST",
    "INVALID_ID",
    "INVALID_LOCATION",
    "ID_NOT_FOUND",
    "DUPLICATE_ID",
    "SHEET_NOT_FOUND",
    "COLUMN_NOT_FOUND",
    "WRITE_FAILED",
    "READ_FAILED",
    "UNKNOWN",
  ];
  return knownCodes.includes(code as AppsScriptErrorCode)
    ? (code as AppsScriptErrorCode)
    : "UNKNOWN";
}

async function readJson(
  response: Response,
): Promise<AppsScriptSuccessResponse | AppsScriptFailureResponse> {
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new AppsScriptError("READ_FAILED", error);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppsScriptError("READ_FAILED");
  }

  return body as AppsScriptSuccessResponse | AppsScriptFailureResponse;
}

async function request(
  endpoint: URL,
  init?: RequestInit,
): Promise<AppsScriptSuccessResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
    const body = await readJson(response);
    if (!response.ok || body.success !== true) {
      const failure = body as AppsScriptFailureResponse;
      throw new AppsScriptError(getErrorCode(failure.error), failure.message);
    }
    return body as AppsScriptSuccessResponse;
  } catch (error) {
    if (error instanceof AppsScriptError) throw error;
    throw new AppsScriptError("READ_FAILED", error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function parseInventoryItem(value: unknown): InventoryItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const id = getString(item.id);
  if (!id) return null;

  return {
    id,
    name: getString(item.name) || id,
    checked_time: getString(item.checked_time),
    location: getString(item.location),
  };
}

export interface InventoryWriteFailure {
  id: string;
  errorCode: AppsScriptErrorCode;
}

export interface InventoryBatchOutcome {
  items: InventoryItem[];
  failures: InventoryWriteFailure[];
}

export async function loadPendingInventory(url: string): Promise<InventoryItem[]> {
  return loadInventoryList(url, "pending");
}

export async function loadInventoryItems(url: string): Promise<InventoryItem[]> {
  return loadInventoryList(url, "list");
}

export function formatSheetTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHEET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}-${get("hour")}${get("minute")}${get("second")}`;
}

export function findConfirmedInventoryItem(
  items: InventoryItem[],
  id: string,
  options: {
    previousCheckedTime: string;
    minCheckedTime: string;
    expectedLocation: string;
  },
): InventoryItem | undefined {
  const item = items.find((candidate) => candidate.id === id);
  if (!item?.checked_time) return undefined;
  if (item.checked_time === options.previousCheckedTime) return undefined;
  if (item.checked_time < options.minCheckedTime) return undefined;
  if (options.expectedLocation && item.location !== options.expectedLocation) {
    return undefined;
  }
  return item;
}

async function loadInventoryList(
  url: string,
  action: "pending" | "list",
): Promise<InventoryItem[]> {
  const response = await request(getEndpoint(url, action));
  if (!Array.isArray(response.items)) {
    throw new AppsScriptError("READ_FAILED");
  }

  return response.items
    .map(parseInventoryItem)
    .filter((item): item is InventoryItem => item !== null);
}

function parseWriteFailure(value: unknown): InventoryWriteFailure | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as Record<string, unknown>;
  if (entry.success === true) return null;
  const id = getString(entry.id);
  if (!id) return null;
  return {
    id,
    errorCode: getErrorCode(entry.error),
  };
}

function parseBatchOutcome(
  response: AppsScriptSuccessResponse,
): InventoryBatchOutcome {
  const failures: InventoryWriteFailure[] = [];
  const itemsFromResults: InventoryItem[] = [];

  if (Array.isArray(response.results)) {
    response.results.forEach((entry) => {
      const failure = parseWriteFailure(entry);
      if (failure) {
        failures.push(failure);
        return;
      }
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const item = parseInventoryItem((entry as Record<string, unknown>).item);
      if (item) itemsFromResults.push(item);
    });
  }

  const itemsFromList = Array.isArray(response.items)
    ? response.items
        .map(parseInventoryItem)
        .filter((item): item is InventoryItem => item !== null)
    : [];
  const singleItem = parseInventoryItem(response.item);
  const items = itemsFromResults.length
    ? itemsFromResults
    : itemsFromList.length
      ? itemsFromList
      : singleItem
        ? [singleItem]
        : [];

  return { items, failures };
}

/**
 * Fires a batch inventory POST and returns parsed results only when the
 * redirected Apps Script body is readable. Unreadable CORS/redirect failures
 * return null so the caller can confirm writes with GET.
 */
export async function postInventoryChecks(
  url: string,
  ids: string[],
  location: string,
): Promise<InventoryBatchOutcome | null> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) {
    throw new AppsScriptError("INVALID_ID");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    POST_ABORT_MS,
  );

  try {
    const response = await fetch(getEndpoint(url), {
      method: "POST",
      headers: {
        // Apps Script Web Apps do not reliably handle the OPTIONS preflight
        // triggered by application/json. The body remains JSON for doPost().
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ ids: uniqueIds, location }),
      redirect: "follow",
      signal: controller.signal,
    });
    const body = await readJson(response);
    if (!response.ok || body.success !== true) {
      const failure = body as AppsScriptFailureResponse;
      throw new AppsScriptError(getErrorCode(failure.error), failure.message);
    }
    return parseBatchOutcome(body as AppsScriptSuccessResponse);
  } catch (error) {
    if (error instanceof AppsScriptError && error.code !== "READ_FAILED") {
      throw error;
    }
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
