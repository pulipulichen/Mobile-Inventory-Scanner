import {
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_SIMULATION_SETTINGS,
  isLabelTextMode,
  isPaperSize,
  isSimulationItemCount,
  MAX_PAGE_MARGIN_MM,
  MIN_PAGE_MARGIN_MM,
  type LabelTextMode,
  type Orientation,
  type PaperSize,
  type PrintSettings,
  type SimulationSettings,
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
  labelText: "mis.print.label_text",
  showIdText: "mis.print.show_id_text",
  locale: "mis.print.locale",
  simulationItemCount: "mis.print.simulator.item_count",
  simulationMinQrSizePx: "mis.print.simulator.min_qr_size_px",
  simulationMaxQrSizePx: "mis.print.simulator.max_qr_size_px",
  simulationZoom: "mis.print.simulator.zoom",
  simulationSeed: "mis.print.simulator.seed",
} as const;
const PRINT_SETTINGS_STORAGE_KEYS = [
  STORAGE_KEYS.googleSheetUrl,
  STORAGE_KEYS.paperSize,
  STORAGE_KEYS.qrSizeMm,
  STORAGE_KEYS.idFontSizePt,
  STORAGE_KEYS.qrTextGapMm,
  STORAGE_KEYS.labelGapMm,
  STORAGE_KEYS.pageMarginMm,
  STORAGE_KEYS.orientation,
  STORAGE_KEYS.showIdText,
  STORAGE_KEYS.locale,
] as const;

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

function readPaperSize(key: string, fallback: PaperSize): PaperSize {
  const value = getItem(key);
  return isPaperSize(value) ? value : fallback;
}

function readLabelText(fallback: LabelTextMode): LabelTextMode {
  const saved = getItem(STORAGE_KEYS.labelText);
  if (isLabelTextMode(saved)) return saved;
  if (getItem(STORAGE_KEYS.showIdText) === "false") return "hidden";
  return fallback;
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
    labelText: readLabelText(DEFAULT_PRINT_SETTINGS.labelText),
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
  setItem(STORAGE_KEYS.labelText, settings.labelText);
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

export function loadSimulationSettings(): SimulationSettings {
  const rawItemCount = getItem(STORAGE_KEYS.simulationItemCount);
  const parsedItemCount =
    rawItemCount === "all"
      ? "all"
      : Number(rawItemCount);
  const rawSeed = getItem(STORAGE_KEYS.simulationSeed);
  const savedSeed = rawSeed === null ? Number.NaN : Number(rawSeed);

  return {
    itemCount: isSimulationItemCount(parsedItemCount)
      ? parsedItemCount
      : DEFAULT_SIMULATION_SETTINGS.itemCount,
    minQrSizePx: readNumber(
      STORAGE_KEYS.simulationMinQrSizePx,
      DEFAULT_SIMULATION_SETTINGS.minQrSizePx,
      48,
      480,
    ),
    maxQrSizePx: readNumber(
      STORAGE_KEYS.simulationMaxQrSizePx,
      DEFAULT_SIMULATION_SETTINGS.maxQrSizePx,
      48,
      480,
    ),
    zoom: readNumber(
      STORAGE_KEYS.simulationZoom,
      DEFAULT_SIMULATION_SETTINGS.zoom,
      50,
      200,
    ),
    seed:
      Number.isSafeInteger(savedSeed) && savedSeed >= 0
        ? savedSeed >>> 0
        : DEFAULT_SIMULATION_SETTINGS.seed,
  };
}

export function saveSimulationSettings(settings: SimulationSettings): void {
  setItem(STORAGE_KEYS.simulationItemCount, String(settings.itemCount));
  setItem(STORAGE_KEYS.simulationMinQrSizePx, String(settings.minQrSizePx));
  setItem(STORAGE_KEYS.simulationMaxQrSizePx, String(settings.maxQrSizePx));
  setItem(STORAGE_KEYS.simulationZoom, String(settings.zoom));
  setItem(STORAGE_KEYS.simulationSeed, String(settings.seed >>> 0));
}

export function clearSimulationSettings(): void {
  [
    STORAGE_KEYS.simulationItemCount,
    STORAGE_KEYS.simulationMinQrSizePx,
    STORAGE_KEYS.simulationMaxQrSizePx,
    STORAGE_KEYS.simulationZoom,
    STORAGE_KEYS.simulationSeed,
  ].forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage-disabled contexts.
    }
  });
}

export function clearPrintSettings(): void {
  PRINT_SETTINGS_STORAGE_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage-disabled contexts.
    }
  });
}
