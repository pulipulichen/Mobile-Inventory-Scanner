import {
  getCode128HeightMm,
  getCode128WidthMm,
  getPaperSizeMm,
  MIN_PAGE_MARGIN_MM,
  showsCode128,
  showsLabelText,
  showsQrCode,
  type InventoryItem,
  type LayoutMetrics,
  type PrintSettings,
} from "../types/print";

const LABEL_PADDING_MM = 3;
const BARCODE_STACK_GAP_MM = 2;
export const CSS_PX_PER_MM = 96 / 25.4;

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
  const qrVisible = showsQrCode(settings.barcodeMode);
  const code128Visible = showsCode128(settings.barcodeMode);
  const code128WidthMm = getCode128WidthMm(settings.qrSizeMm);
  const code128HeightMm = getCode128HeightMm(settings.qrSizeMm);
  const barcodeWidthMm = Math.max(
    qrVisible ? settings.qrSizeMm : 0,
    code128Visible ? code128WidthMm : 0,
  );
  const barcodeHeightMm =
    (qrVisible ? settings.qrSizeMm : 0) +
    (code128Visible ? code128HeightMm : 0) +
    (qrVisible && code128Visible ? BARCODE_STACK_GAP_MM : 0);
  const labelWidthMm = barcodeWidthMm + LABEL_PADDING_MM * 2;
  const labelHeightMm =
    barcodeHeightMm + textGapMm + textHeightMm + LABEL_PADDING_MM * 2;
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

export function getScaledLabelSizePx(
  qrSizePx: number,
  settings: PrintSettings,
): { widthPx: number; heightPx: number } {
  const metrics = calculateLayout(settings, 0);
  const qrSizeMm = Math.max(1, settings.qrSizeMm);
  const pxPerMm = qrSizePx / qrSizeMm;
  return {
    widthPx: metrics.labelWidthMm * pxPerMm,
    heightPx: metrics.labelHeightMm * pxPerMm,
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
