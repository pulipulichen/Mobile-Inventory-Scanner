import {
  getPaperSizeMm,
  MIN_PAGE_MARGIN_MM,
  showsLabelText,
  type InventoryItem,
  type LayoutMetrics,
  type PrintSettings,
} from "../types/print";

const LABEL_PADDING_MM = 3;

export function calculateLayout(
  settings: PrintSettings,
  itemCount: number,
): LayoutMetrics {
  const { widthMm: pageWidthMm, heightMm: pageHeightMm } = getPaperSizeMm(
    settings.paperSize,
    settings.orientation,
  );
  const textHeightMm = showsLabelText(settings.labelText)
    ? Math.max(5, settings.idFontSizePt * 0.42)
    : 0;
  const textGapMm = showsLabelText(settings.labelText)
    ? settings.qrTextGapMm
    : 0;
  const labelWidthMm = settings.qrSizeMm + LABEL_PADDING_MM * 2;
  const labelHeightMm =
    settings.qrSizeMm + textGapMm + textHeightMm + LABEL_PADDING_MM * 2;
  const pageMarginMm = Math.max(MIN_PAGE_MARGIN_MM, settings.pageMarginMm);
  const contentWidthMm = pageWidthMm - pageMarginMm * 2;
  const contentHeightMm = pageHeightMm - pageMarginMm * 2;
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
