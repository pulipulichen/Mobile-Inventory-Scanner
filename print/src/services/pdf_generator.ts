import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { InventoryItem, PrintSettings } from "../types/print";
import { calculateLayout, getPageItems } from "../utils/print_layout";
import { createQrMatrix } from "./qr_generator";

const POINTS_PER_MM = 72 / 25.4;
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);

function mmToPoints(value: number): number {
  return value * POINTS_PER_MM;
}

export async function generatePdf(
  items: InventoryItem[],
  settings: PrintSettings,
): Promise<Blob> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const metrics = calculateLayout(settings, items.length);
  const pages = getPageItems(items, metrics);
  const fontSize = settings.idFontSizePt;

  pages.forEach((pageItems) => {
    const page = document.addPage([
      mmToPoints(metrics.pageWidthMm),
      mmToPoints(metrics.pageHeightMm),
    ]);
    const pageHeight = mmToPoints(metrics.pageHeightMm);
    const pageMargin = mmToPoints(settings.pageMarginMm);
    const labelWidth = mmToPoints(metrics.labelWidthMm);
    const labelHeight = mmToPoints(metrics.labelHeightMm);
    const labelGap = mmToPoints(settings.labelGapMm);
    const labelPadding = mmToPoints(metrics.labelPaddingMm);
    const qrSize = mmToPoints(settings.qrSizeMm);
    const textHeight = mmToPoints(metrics.textHeightMm);
    const textGap = mmToPoints(settings.qrTextGapMm);

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

      const qrMatrix = createQrMatrix(item.id);
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

      const textWidth = font.widthOfTextAtSize(item.id, fontSize);
      page.drawText(item.id, {
        x: x + (labelWidth - textWidth) / 2,
        y: y + labelPadding,
        size: fontSize,
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
