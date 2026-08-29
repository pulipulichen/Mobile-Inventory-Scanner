import type { InventoryCheckItem, InventoryItem } from "../types/scan";

type AppsScriptErrorCode =
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

interface AppsScriptSuccessResponse {
  success: true;
  item?: unknown;
  items?: unknown;
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
  let response: Response;
  try {
    response = await fetch(endpoint, init);
  } catch (error) {
    throw new AppsScriptError("READ_FAILED", error);
  }

  const body = await readJson(response);
  if (!response.ok || body.success !== true) {
    const failure = body as AppsScriptFailureResponse;
    throw new AppsScriptError(getErrorCode(failure.error), failure.message);
  }

  return body as AppsScriptSuccessResponse;
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

export async function loadPendingInventory(url: string): Promise<InventoryItem[]> {
  const response = await request(getEndpoint(url, "pending"));
  if (!Array.isArray(response.items)) {
    throw new AppsScriptError("READ_FAILED");
  }

  return response.items
    .map(parseInventoryItem)
    .filter((item): item is InventoryItem => item !== null);
}

export async function submitInventoryCheck(
  url: string,
  id: string,
  location: string,
): Promise<InventoryCheckItem> {
  const response = await request(getEndpoint(url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, location }),
  });
  const item = parseInventoryItem(response.item);
  if (!item) throw new AppsScriptError("READ_FAILED");
  return item;
}
