import {
  DEFAULT_PRINT_SETTINGS,
  isPaperSize,
  MAX_PAGE_MARGIN_MM,
  MIN_PAGE_MARGIN_MM,
  type Orientation,
  type PaperSize,
  type PrintSettings,
} from "../types/print";

const STORAGE_KEYS = {
  googleSheetUrl: "mis.print.google_sheet_url",
  paperSize: "mis.print.paper_size",
  qrSizeMm: "mis.print.qr_size_mm",
  idFontSizePt: "mis.print.id_font_size_pt",
  qrTextGapMm: "mis.print.qr_text_gap_mm",
  labelGapMm: "mis.print.label_gap_mm",
  pageMarginMm: "mis.print.page_margin_mm",
  orientation: "mis.print.orientation",
  showIdText: "mis.print.show_id_text",
  locale: "mis.print.locale",
} as const;

const DEFAULT_GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1XA-VP_7g0Op-1s_LTjNroFOsOA4DvJEyGq8GaytCkCI/edit?usp=sharing";

function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing and storage-disabled contexts should not block the app.
  }
}

function readNumber(
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(getItem(key));
  return Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

function readBoolean(key: string, fallback: boolean): boolean {
  const value = getItem(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function readPaperSize(key: string, fallback: PaperSize): PaperSize {
  const value = getItem(key);
  return isPaperSize(value) ? value : fallback;
}

export function loadPrintSettings(): PrintSettings {
  const savedOrientation = getItem(STORAGE_KEYS.orientation);
  const orientation: Orientation =
    savedOrientation === "landscape" ? "landscape" : "portrait";

  return {
    paperSize: readPaperSize(
      STORAGE_KEYS.paperSize,
      DEFAULT_PRINT_SETTINGS.paperSize,
    ),
    qrSizeMm: readNumber(
      STORAGE_KEYS.qrSizeMm,
      DEFAULT_PRINT_SETTINGS.qrSizeMm,
      10,
      100,
    ),
    idFontSizePt: readNumber(
      STORAGE_KEYS.idFontSizePt,
      DEFAULT_PRINT_SETTINGS.idFontSizePt,
      6,
      36,
    ),
    qrTextGapMm: readNumber(
      STORAGE_KEYS.qrTextGapMm,
      DEFAULT_PRINT_SETTINGS.qrTextGapMm,
      0,
      20,
    ),
    labelGapMm: readNumber(
      STORAGE_KEYS.labelGapMm,
      DEFAULT_PRINT_SETTINGS.labelGapMm,
      0,
      20,
    ),
    pageMarginMm: readNumber(
      STORAGE_KEYS.pageMarginMm,
      DEFAULT_PRINT_SETTINGS.pageMarginMm,
      MIN_PAGE_MARGIN_MM,
      MAX_PAGE_MARGIN_MM,
    ),
    orientation,
    showIdText: readBoolean(
      STORAGE_KEYS.showIdText,
      DEFAULT_PRINT_SETTINGS.showIdText,
    ),
  };
}

export function savePrintSettings(settings: PrintSettings): void {
  setItem(STORAGE_KEYS.paperSize, settings.paperSize);
  setItem(STORAGE_KEYS.qrSizeMm, String(settings.qrSizeMm));
  setItem(STORAGE_KEYS.idFontSizePt, String(settings.idFontSizePt));
  setItem(STORAGE_KEYS.qrTextGapMm, String(settings.qrTextGapMm));
  setItem(STORAGE_KEYS.labelGapMm, String(settings.labelGapMm));
  setItem(STORAGE_KEYS.pageMarginMm, String(settings.pageMarginMm));
  setItem(STORAGE_KEYS.orientation, settings.orientation);
  setItem(STORAGE_KEYS.showIdText, String(settings.showIdText));
}

export function loadGoogleSheetUrl(): string {
  return getItem(STORAGE_KEYS.googleSheetUrl) ?? DEFAULT_GOOGLE_SHEET_URL;
}

export function saveGoogleSheetUrl(url: string): void {
  setItem(STORAGE_KEYS.googleSheetUrl, url);
}

export function loadLocale(): string | null {
  return getItem(STORAGE_KEYS.locale);
}

export function saveLocale(locale: string): void {
  setItem(STORAGE_KEYS.locale, locale);
}

export function clearPrintSettings(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage-disabled contexts.
    }
  });
}
