import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import * as fontkit from "pdflib-fontkit";
import {
  getLabelCaption,
  getQrPayload,
  MIN_PAGE_MARGIN_MM,
  showsLabelText,
  type InventoryItem,
  type PrintSettings,
} from "../types/print";
import { calculateLayout, getPageItems } from "../utils/print_layout";
import { createQrMatrix } from "./qr_generator";
import notoSansTcUrl from "../assets/fonts/noto_sans_tc_regular.otf?url";

const POINTS_PER_MM = 72 / 25.4;
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const MIN_CAPTION_SIZE_PT = 6;

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

  document.registerFontkit(fontkit);
  const response = await fetch(notoSansTcUrl);
  if (!response.ok) {
    throw new Error("FONT_LOAD_FAILED");
  }
  const fontBytes = await response.arrayBuffer();
  return document.embedFont(fontBytes, { subset: true });
}

export async function generatePdf(
  items: InventoryItem[],
  settings: PrintSettings,
): Promise<Blob> {
  const document = await PDFDocument.create();
  const showText = showsLabelText(settings.labelText);
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

      page.drawRectangle({
        x: x + labelPadding,
        y: y + labelPadding + textHeight + textGap,
        width: qrSize,
        height: qrSize,
        color: WHITE,
      });

      const qrMatrix = createQrMatrix(
        getQrPayload(item, settings.labelText),
      );
      const totalModules = qrMatrix.size + 8;
      const moduleSize = qrSize / totalModules;
      const qrX = x + labelPadding;
      const qrY = y + labelPadding + textHeight + textGap;

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
