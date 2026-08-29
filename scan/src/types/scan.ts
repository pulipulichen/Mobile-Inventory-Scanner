export type ScanResultState = "queued" | "sending" | "success" | "error";

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
  errorCode?: string;
}

export interface PendingLocationGroup {
  location: string;
  items: InventoryItem[];
}
