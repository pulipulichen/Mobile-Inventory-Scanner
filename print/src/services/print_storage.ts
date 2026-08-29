import {
  DEFAULT_PRINT_SETTINGS,
  type Orientation,
  type PrintSettings,
  type ScanSimulationSettings,
  type SimulationItemCount,
} from "../types/print";

const STORAGE_KEYS = {
  googleSheetUrl: "mis.print.google_sheet_url",
  qrSizeMm: "mis.print.qr_size_mm",
  idFontSizePt: "mis.print.id_font_size_pt",
  qrTextGapMm: "mis.print.qr_text_gap_mm",
  labelGapMm: "mis.print.label_gap_mm",
  pageMarginMm: "mis.print.page_margin_mm",
  orientation: "mis.print.orientation",
  locale: "mis.print.locale",
  simulationItemCount: "mis.print.simulator.item_count",
  simulationMinQrSizePx: "mis.print.simulator.min_qr_size_px",
  simulationMaxQrSizePx: "mis.print.simulator.max_qr_size_px",
  simulationZoom: "mis.print.simulator.zoom",
  simulationSeed: "mis.print.simulator.seed",
} as const;

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

function readNumber(key: string, fallback: number): number {
  const value = Number(getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function readSimulationItemCount(
  fallback: SimulationItemCount,
): SimulationItemCount {
  const value = getItem(STORAGE_KEYS.simulationItemCount);
  if (value === "all" || value === "5" || value === "10" || value === "20") {
    return value === "all" ? value : Number(value) as 5 | 10 | 20;
  }
  return fallback;
}

export function loadPrintSettings(): PrintSettings {
  const savedOrientation = getItem(STORAGE_KEYS.orientation);
  const orientation: Orientation =
    savedOrientation === "landscape" ? "landscape" : "portrait";

  return {
    qrSizeMm: readNumber(STORAGE_KEYS.qrSizeMm, DEFAULT_PRINT_SETTINGS.qrSizeMm),
    idFontSizePt: readNumber(
      STORAGE_KEYS.idFontSizePt,
      DEFAULT_PRINT_SETTINGS.idFontSizePt,
    ),
    qrTextGapMm: readNumber(
      STORAGE_KEYS.qrTextGapMm,
      DEFAULT_PRINT_SETTINGS.qrTextGapMm,
    ),
    labelGapMm: readNumber(
      STORAGE_KEYS.labelGapMm,
      DEFAULT_PRINT_SETTINGS.labelGapMm,
    ),
    pageMarginMm: readNumber(
      STORAGE_KEYS.pageMarginMm,
      DEFAULT_PRINT_SETTINGS.pageMarginMm,
    ),
    orientation,
  };
}

export function savePrintSettings(settings: PrintSettings): void {
  setItem(STORAGE_KEYS.qrSizeMm, String(settings.qrSizeMm));
  setItem(STORAGE_KEYS.idFontSizePt, String(settings.idFontSizePt));
  setItem(STORAGE_KEYS.qrTextGapMm, String(settings.qrTextGapMm));
  setItem(STORAGE_KEYS.labelGapMm, String(settings.labelGapMm));
  setItem(STORAGE_KEYS.pageMarginMm, String(settings.pageMarginMm));
  setItem(STORAGE_KEYS.orientation, settings.orientation);
}

export function loadGoogleSheetUrl(): string {
  return getItem(STORAGE_KEYS.googleSheetUrl) ?? "";
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

export const DEFAULT_SCAN_SIMULATION_SETTINGS: ScanSimulationSettings = {
  itemCount: 10,
  minQrSizePx: 96,
  maxQrSizePx: 240,
  zoom: 1,
  seed: 123456789,
};

export function loadScanSimulationSettings(): ScanSimulationSettings {
  const seed = Math.trunc(
    readNumber(
      STORAGE_KEYS.simulationSeed,
      DEFAULT_SCAN_SIMULATION_SETTINGS.seed,
    ),
  );

  return {
    itemCount: readSimulationItemCount(
      DEFAULT_SCAN_SIMULATION_SETTINGS.itemCount,
    ),
    minQrSizePx: readNumber(
      STORAGE_KEYS.simulationMinQrSizePx,
      DEFAULT_SCAN_SIMULATION_SETTINGS.minQrSizePx,
    ),
    maxQrSizePx: readNumber(
      STORAGE_KEYS.simulationMaxQrSizePx,
      DEFAULT_SCAN_SIMULATION_SETTINGS.maxQrSizePx,
    ),
    zoom: readNumber(
      STORAGE_KEYS.simulationZoom,
      DEFAULT_SCAN_SIMULATION_SETTINGS.zoom,
    ),
    seed: Number.isSafeInteger(seed)
      ? seed
      : DEFAULT_SCAN_SIMULATION_SETTINGS.seed,
  };
}

export function saveScanSimulationSettings(
  settings: ScanSimulationSettings,
): void {
  setItem(STORAGE_KEYS.simulationItemCount, String(settings.itemCount));
  setItem(
    STORAGE_KEYS.simulationMinQrSizePx,
    String(settings.minQrSizePx),
  );
  setItem(
    STORAGE_KEYS.simulationMaxQrSizePx,
    String(settings.maxQrSizePx),
  );
  setItem(STORAGE_KEYS.simulationZoom, String(settings.zoom));
  setItem(STORAGE_KEYS.simulationSeed, String(settings.seed));
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
