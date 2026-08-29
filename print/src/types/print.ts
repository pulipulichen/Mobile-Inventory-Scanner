export type Orientation = "portrait" | "landscape";

export interface PrintSettings {
  qrSizeMm: number;
  idFontSizePt: number;
  qrTextGapMm: number;
  labelGapMm: number;
  pageMarginMm: number;
  orientation: Orientation;
}

export interface InventoryItem {
  id: string;
  rowNumber: number;
  cellAddress: string;
}

export interface DuplicateGroup {
  id: string;
  locations: string[];
}

export interface SheetData {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetName: string;
  items: InventoryItem[];
  totalRows: number;
  dataErrorCount: number;
  duplicateGroups: DuplicateGroup[];
}

export interface LayoutMetrics {
  pageWidthMm: number;
  pageHeightMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  labelPaddingMm: number;
  textHeightMm: number;
  columns: number;
  rows: number;
  labelsPerPage: number;
  pageCount: number;
}

export type SimulationItemCount = 5 | 10 | 20 | "all";

export interface ScanSimulationSettings {
  itemCount: SimulationItemCount;
  minQrSizePx: number;
  maxQrSizePx: number;
  zoom: number;
  seed: number;
}

export interface SceneLayoutItem {
  id: string;
  x: number;
  y: number;
  size: number;
  width: number;
  height: number;
}

export interface SceneLayout {
  width: number;
  height: number;
  items: SceneLayoutItem[];
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  qrSizeMm: 30,
  idFontSizePt: 11,
  qrTextGapMm: 2,
  labelGapMm: 4,
  pageMarginMm: 8,
  orientation: "portrait",
};
