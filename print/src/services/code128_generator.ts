import JsBarcode from "jsbarcode";

export function createCode128Svg(value: string): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    width: 2,
    height: 60,
    background: "#ffffff",
    lineColor: "#000000",
  });
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  return svg.outerHTML;
}

export async function createCode128PngBytes(
  value: string,
  widthPx = 720,
  heightPx = 180,
): Promise<Uint8Array> {
  const svgMarkup = createCode128Svg(value);
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () => reject(new Error("CODE128_RENDER_FAILED"));
      candidate.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("CODE128_RENDER_FAILED");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, widthPx, heightPx);
    context.drawImage(image, 0, 0, widthPx, heightPx);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("CODE128_RENDER_FAILED"));
      }, "image/png");
    });
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
