import type {
  InventoryItem,
  LayoutMetrics,
  PrintSettings,
} from "../types/print";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const LABEL_PADDING_MM = 3;

export function calculateLayout(
  settings: PrintSettings,
  itemCount: number,
): LayoutMetrics {
  const isPortrait = settings.orientation === "portrait";
  const pageWidthMm = isPortrait ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pageHeightMm = isPortrait ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const textHeightMm = Math.max(5, settings.idFontSizePt * 0.42);
  const labelWidthMm = settings.qrSizeMm + LABEL_PADDING_MM * 2;
  const labelHeightMm =
    settings.qrSizeMm +
    settings.qrTextGapMm +
    textHeightMm +
    LABEL_PADDING_MM * 2;
  const contentWidthMm = pageWidthMm - settings.pageMarginMm * 2;
  const contentHeightMm = pageHeightMm - settings.pageMarginMm * 2;
  const columns = Math.max(
    1,
    Math.floor(
      (contentWidthMm + settings.labelGapMm) /
        (labelWidthMm + settings.labelGapMm),
    ),
  );
  const rows = Math.max(
    1,
    Math.floor(
      (contentHeightMm + settings.labelGapMm) /
        (labelHeightMm + settings.labelGapMm),
    ),
  );
  const labelsPerPage = columns * rows;

  return {
    pageWidthMm,
    pageHeightMm,
    labelWidthMm,
    labelHeightMm,
    labelPaddingMm: LABEL_PADDING_MM,
    textHeightMm,
    columns,
    rows,
    labelsPerPage,
    pageCount: itemCount ? Math.ceil(itemCount / labelsPerPage) : 0,
  };
}

export function splitIntoPages<T>(
  items: T[],
  itemsPerPage: number,
): T[][] {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += itemsPerPage) {
    pages.push(items.slice(index, index + itemsPerPage));
  }
  return pages;
}

export function getPageItems(
  items: InventoryItem[],
  metrics: LayoutMetrics,
): InventoryItem[][] {
  return splitIntoPages(items, metrics.labelsPerPage);
}
