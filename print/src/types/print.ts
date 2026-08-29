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

export interface PrintSettings {
  paperSize: PaperSize;
  qrSizeMm: number;
  idFontSizePt: number;
  qrTextGapMm: number;
  labelGapMm: number;
  pageMarginMm: number;
  orientation: Orientation;
  showIdText: boolean;
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

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: "a4",
  qrSizeMm: 30,
  idFontSizePt: 11,
  qrTextGapMm: 2,
  labelGapMm: 4,
  pageMarginMm: 8,
  orientation: "portrait",
  showIdText: true,
};

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

export const MIN_PAGE_MARGIN_MM = 8;
export const MAX_PAGE_MARGIN_MM = 40;
