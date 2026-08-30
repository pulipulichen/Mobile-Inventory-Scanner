export type ScanResultState = "queued" | "sending" | "success" | "error";

export const SCAN_INPUT_MODES = ["camera", "scanner"] as const;

export type ScanInputMode = (typeof SCAN_INPUT_MODES)[number];

export function isScanInputMode(value: string | null): value is ScanInputMode {
  return value === "camera" || value === "scanner";
}

export interface InventoryItem {
  id: string;
  name: string;
  checked_time: string;
  location: string;
}

export interface InventoryCheckItem {
  id: string;
  name: string;
  checked_time: string;
  location: string;
}

export interface ScanResult {
  id: string;
  name: string;
  state: ScanResultState;
  checked_time?: string;
  location?: string;
  locationProvided?: boolean;
  errorCode?: string;
}

export interface PendingLocationGroup {
  locationKey: string;
  location: string;
  isCurrent: boolean;
  items: InventoryItem[];
}
