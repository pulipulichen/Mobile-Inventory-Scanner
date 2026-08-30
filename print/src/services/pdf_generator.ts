import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "pdflib-fontkit";
import {
  BARCODE_STACK_GAP_MM,
  getCode128HeightMm,
  getCode128WidthMm,
  getLabelCaption,
  getQrPayload,
  MIN_PAGE_MARGIN_MM,
  showsCode128,
  showsLabelText,
  showsQrCode,
  type InventoryItem,
  type PrintSettings,
} from "../types/print";
import { calculateLayout, getPageItems } from "../utils/print_layout";
import { createCode128Layout } from "./code128_generator";
import { createQrMatrix } from "./qr_generator";
import notoSansTcUrl from "../assets/fonts/noto_sans_tc_regular.otf?url";

type FontkitInstance = {
  create: (fontData: Uint8Array) => unknown;
};

function resolveFontkit(): FontkitInstance {
  const candidate = fontkit as FontkitInstance & { default?: FontkitInstance };
  if (typeof candidate.create === "function") return candidate;
  if (typeof candidate.default?.create === "function") return candidate.default;
  throw new Error("FONTKIT_UNAVAILABLE");
}

const POINTS_PER_MM = 72 / 25.4;
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const MIN_CAPTION_SIZE_PT = 6;
const LABEL_GRID_COLOR = rgb(203 / 255, 213 / 255, 225 / 255);
const LABEL_GRID_WIDTH_PT = mmToPoints(0.2);
const LABEL_GRID_DASH_PT = [mmToPoints(1), mmToPoints(1)];

function mmToPoints(value: number): number {
  return value * POINTS_PER_MM;
}

function needsUnicodeFont(texts: string[]): boolean {
  return texts.some((text) =>
    [...text].some((character) => (character.codePointAt(0) ?? 0) > 0xff),
  );
}

async function embedLabelFont(
  document: PDFDocument,
  captions: string[],
): Promise<PDFFont> {
  if (!needsUnicodeFont(captions)) {
    return document.embedFont(StandardFonts.Helvetica);
  }

  document.registerFontkit(
    resolveFontkit() as Parameters<PDFDocument["registerFontkit"]>[0],
  );
  const response = await fetch(notoSansTcUrl);
  if (!response.ok) {
    throw new Error("FONT_LOAD_FAILED");
  }
  const fontBytes = await response.arrayBuffer();
  return document.embedFont(fontBytes, { subset: true });
}

function drawCode128(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const { bars, totalWidth } = createCode128Layout(value);
  const moduleWidth = width / totalWidth;
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: WHITE,
  });
  bars.forEach((bar) => {
    page.drawRectangle({
      x: x + bar.x * moduleWidth,
      y,
      width: bar.width * moduleWidth,
      height,
      color: BLACK,
    });
  });
}

export async function generatePdf(
  items: InventoryItem[],
  settings: PrintSettings,
): Promise<Blob> {
  const document = await PDFDocument.create();
  const showText = showsLabelText(settings.labelText);
  const showQr = showsQrCode(settings.barcodeMode);
  const showCode128 = showsCode128(settings.barcodeMode);
  const captions = showText
    ? items.map((item) => getLabelCaption(item, settings.labelText))
    : [];
  const font = showText
    ? await embedLabelFont(document, captions)
    : await document.embedFont(StandardFonts.Helvetica);
  const metrics = calculateLayout(settings, items.length);
  const pages = getPageItems(items, metrics);
  const fontSize = settings.idFontSizePt;

  pages.forEach((pageItems) => {
    const page = document.addPage([
      mmToPoints(metrics.pageWidthMm),
      mmToPoints(metrics.pageHeightMm),
    ]);
    const pageHeight = mmToPoints(metrics.pageHeightMm);
    const pageMargin = mmToPoints(
      Math.max(MIN_PAGE_MARGIN_MM, settings.pageMarginMm),
    );
    const labelWidth = mmToPoints(metrics.labelWidthMm);
    const labelHeight = mmToPoints(metrics.labelHeightMm);
    const labelGap = mmToPoints(settings.labelGapMm);
    const labelPadding = mmToPoints(metrics.labelPaddingMm);
    const qrSize = mmToPoints(settings.qrSizeMm);
    const code128Width = mmToPoints(
      getCode128WidthMm(settings.qrSizeMm, settings.barcodeMode),
    );
    const code128Height = mmToPoints(getCode128HeightMm(settings.qrSizeMm));
    const barcodeStackGap = mmToPoints(BARCODE_STACK_GAP_MM);
    const textHeight = showText ? mmToPoints(metrics.textHeightMm) : 0;
    const textGap = showText ? mmToPoints(settings.qrTextGapMm) : 0;

    pageItems.forEach((item, index) => {
      const column = index % metrics.columns;
      const row = Math.floor(index / metrics.columns);
      const x = pageMargin + column * (labelWidth + labelGap);
      const y =
        pageHeight -
        pageMargin -
        labelHeight -
        row * (labelHeight + labelGap);
      const barcodeBaseY = y + labelPadding + textHeight + textGap;

      page.drawRectangle({
        x,
        y,
        width: labelWidth,
        height: labelHeight,
        borderColor: LABEL_GRID_COLOR,
        borderWidth: LABEL_GRID_WIDTH_PT,
        borderDashArray: LABEL_GRID_DASH_PT,
      });

      if (showCode128) {
        drawCode128(
          page,
          item.id,
          x + (labelWidth - code128Width) / 2,
          barcodeBaseY,
          code128Width,
          code128Height,
        );
      }

      if (showQr) {
        const qrY =
          barcodeBaseY +
          (showCode128 ? code128Height + barcodeStackGap : 0);
        const qrX = x + (labelWidth - qrSize) / 2;
        page.drawRectangle({
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
          color: WHITE,
        });

        const qrMatrix = createQrMatrix(getQrPayload(item));
        const totalModules = qrMatrix.size + 8;
        const moduleSize = qrSize / totalModules;

        qrMatrix.modules.forEach((isDark, moduleIndex) => {
          if (!isDark) return;
          const moduleX = moduleIndex % qrMatrix.size;
          const moduleY = Math.floor(moduleIndex / qrMatrix.size);
          page.drawRectangle({
            x: qrX + (moduleX + 4) * moduleSize,
            y: qrY + qrSize - (moduleY + 5) * moduleSize,
            width: moduleSize,
            height: moduleSize,
            color: BLACK,
          });
        });
      }

      if (!showText) return;

      const caption = getLabelCaption(item, settings.labelText);
      const maxWidth = Math.max(1, labelWidth - labelPadding * 2);
      let size = fontSize;
      let textWidth = font.widthOfTextAtSize(caption, size);
      while (textWidth > maxWidth && size > MIN_CAPTION_SIZE_PT) {
        size -= 0.5;
        textWidth = font.widthOfTextAtSize(caption, size);
      }

      page.drawText(caption, {
        x: x + (labelWidth - Math.min(textWidth, maxWidth)) / 2,
        y: y + labelPadding,
        size,
        font,
        color: BLACK,
      });
    });
  });

  const bytes = await document.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "application/pdf" });
}
