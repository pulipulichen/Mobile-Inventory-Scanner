const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
] as const;

const CODE_B_START = 104;
const STOP_CODE = 106;
const QUIET_ZONE_MODULES = 10;

function encodeCode128B(value: string): number[] {
  if (!value.length) throw new Error("CODE128_EMPTY");

  const dataCodes = [...value].map((character) => {
    const codePoint = character.codePointAt(0) ?? -1;
    if (codePoint < 32 || codePoint > 126) {
      throw new Error("CODE128_UNSUPPORTED_CHARACTER");
    }
    return codePoint - 32;
  });

  const checksum = (
    CODE_B_START +
    dataCodes.reduce((sum, code, index) => sum + code * (index + 1), 0)
  ) % 103;

  return [CODE_B_START, ...dataCodes, checksum, STOP_CODE];
}

function buildBars(value: string): { x: number; width: number }[] {
  const codes = encodeCode128B(value);
  const bars: { x: number; width: number }[] = [];
  let x = QUIET_ZONE_MODULES;

  codes.forEach((code) => {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) throw new Error("CODE128_ENCODING_FAILED");

    [...pattern].forEach((digit, index) => {
      const width = Number(digit);
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    });
  });

  return bars;
}

export function createCode128Svg(value: string): string {
  const bars = buildBars(value);
  const contentWidth = bars.reduce(
    (max, bar) => Math.max(max, bar.x + bar.width),
    QUIET_ZONE_MODULES,
  );
  const totalWidth = contentWidth + QUIET_ZONE_MODULES;
  const rects = bars
    .map(
      (bar) =>
        `<rect x="${bar.x}" y="0" width="${bar.width}" height="60" fill="#000"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 60" preserveAspectRatio="none" width="100%" height="100%" role="img"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`;
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
