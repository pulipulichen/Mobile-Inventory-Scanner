export type Orientation = "portrait" | "landscape";

export const PAPER_SIZES = ["a4", "a3", "a5", "b4", "b5"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

export interface PaperSizeDimensions {
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZE_DIMENSIONS: Record<PaperSize, PaperSizeDimensions> = {
  a4: { widthMm: 210, heightMm: 297 },
  a3: { widthMm: 297, heightMm: 420 },
  a5: { widthMm: 148, heightMm: 210 },
  // JIS B-series dimensions used in Taiwan.
  b4: { widthMm: 257, heightMm: 364 },
  b5: { widthMm: 182, heightMm: 257 },
};

export const LABEL_TEXT_MODES = ["hidden", "id", "name"] as const;
export type LabelTextMode = (typeof LABEL_TEXT_MODES)[number];

export const BARCODE_MODES = ["qr", "code128", "both"] as const;
export type BarcodeMode = (typeof BARCODE_MODES)[number];

export interface PrintSettings {
  paperSize: PaperSize;
  qrSizeMm: number;
  idFontSizePt: number;
  qrTextGapMm: number;
  labelGapMm: number;
  pageMarginMm: number;
  orientation: Orientation;
  labelText: LabelTextMode;
  barcodeMode: BarcodeMode;
}

export interface InventoryItem {
  id: string;
  name: string;
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

export type PrintMode = "pdf" | "simulation";
export type SimulationItemCount = 5 | 10 | 20 | "all";

export interface SimulationSettings {
  itemCount: SimulationItemCount;
  minQrSizePx: number;
  maxQrSizePx: number;
  zoom: number;
  seed: number;
}

export interface SceneLayoutItem {
  item: InventoryItem;
  svgMarkup: string;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  qrSizePx: number;
}

export interface SceneLayout {
  widthPx: number;
  heightPx: number;
  items: SceneLayoutItem[];
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

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: "a4",
  qrSizeMm: 30,
  idFontSizePt: 11,
  qrTextGapMm: 2,
  labelGapMm: 4,
  pageMarginMm: 8,
  orientation: "portrait",
  labelText: "id",
  barcodeMode: "qr",
};

export function isBarcodeMode(value: unknown): value is BarcodeMode {
  return (
    typeof value === "string" &&
    (BARCODE_MODES as readonly string[]).includes(value)
  );
}

export function showsQrCode(mode: BarcodeMode): boolean {
  return mode === "qr" || mode === "both";
}

export function showsCode128(mode: BarcodeMode): boolean {
  return mode === "code128" || mode === "both";
}

export const BARCODE_STACK_GAP_MM = 2;

export function getCode128WidthMm(
  qrSizeMm: number,
  barcodeMode: BarcodeMode,
): number {
  if (barcodeMode === "code128") return qrSizeMm;
  return qrSizeMm * 1.8;
}

export function getCode128HeightMm(qrSizeMm: number): number {
  return Math.max(12, qrSizeMm * 0.4);
}

export function isLabelTextMode(value: unknown): value is LabelTextMode {
  return (
    typeof value === "string" &&
    (LABEL_TEXT_MODES as readonly string[]).includes(value)
  );
}

export function showsLabelText(mode: LabelTextMode): boolean {
  return mode !== "hidden";
}

export function getLabelCaption(
  item: InventoryItem,
  mode: LabelTextMode,
): string {
  if (mode === "hidden") return "";
  if (mode === "name") return item.name || item.id;
  return item.id;
}

export function getQrPayload(item: InventoryItem): string {
  return item.id;
}

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  itemCount: 10,
  minQrSizePx: 96,
  maxQrSizePx: 240,
  zoom: 100,
  seed: 20260829,
};

export const SIMULATION_ITEM_COUNTS: readonly SimulationItemCount[] = [
  5,
  10,
  20,
  "all",
];
export const MIN_SIMULATION_QR_SIZE_PX = 48;
export const MAX_SIMULATION_QR_SIZE_PX = 480;
export const MIN_SIMULATION_ZOOM = 50;
export const MAX_SIMULATION_ZOOM = 200;
export const SIMULATION_ZOOM_STEP = 10;

export function isPaperSize(value: unknown): value is PaperSize {
  return (
    typeof value === "string" &&
    (PAPER_SIZES as readonly string[]).includes(value)
  );
}

export function getPaperSizeMm(
  paperSize: PaperSize,
  orientation: Orientation,
): PaperSizeDimensions {
  const { widthMm, heightMm } = PAPER_SIZE_DIMENSIONS[paperSize];
  if (orientation === "landscape") {
    return { widthMm: heightMm, heightMm: widthMm };
  }
  return { widthMm, heightMm };
}

export function isSimulationItemCount(
  value: unknown,
): value is SimulationItemCount {
  return (
    value === "all" ||
    (typeof value === "number" &&
      SIMULATION_ITEM_COUNTS.includes(value as SimulationItemCount))
  );
}

export const MIN_PAGE_MARGIN_MM = 8;
export const MAX_PAGE_MARGIN_MM = 40;
