export type Code128ErrorCode =
  | "CODE128_EMPTY"
  | "CODE128_UNSUPPORTED_CHARACTER"
  | "CODE128_ENCODING_FAILED";

export class Code128GeneratorError extends Error {
  constructor(
    public readonly code: Code128ErrorCode,
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = "Code128GeneratorError";
  }
}

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

export interface Code128Bar {
  x: number;
  width: number;
}

export interface Code128Layout {
  bars: Code128Bar[];
  totalWidth: number;
}

export function canEncodeCode128(value: string): boolean {
  return (
    value.length > 0 &&
    [...value].every((character) => {
      const codePoint = character.codePointAt(0) ?? -1;
      return codePoint >= 32 && codePoint <= 126;
    })
  );
}

function encodeCode128B(value: string): number[] {
  if (!value.length) throw new Code128GeneratorError("CODE128_EMPTY");

  const dataCodes = [...value].map((character) => {
    const codePoint = character.codePointAt(0) ?? -1;
    if (codePoint < 32 || codePoint > 126) {
      throw new Code128GeneratorError("CODE128_UNSUPPORTED_CHARACTER");
    }
    return codePoint - 32;
  });

  const checksum = (
    CODE_B_START +
    dataCodes.reduce((sum, code, index) => sum + code * (index + 1), 0)
  ) % 103;

  return [CODE_B_START, ...dataCodes, checksum, STOP_CODE];
}

export function createCode128Layout(value: string): Code128Layout {
  const codes = encodeCode128B(value);
  const bars: Code128Bar[] = [];
  let x = QUIET_ZONE_MODULES;

  codes.forEach((code) => {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) throw new Code128GeneratorError("CODE128_ENCODING_FAILED");

    [...pattern].forEach((digit, index) => {
      const width = Number(digit);
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    });
  });

  return {
    bars,
    totalWidth: x + QUIET_ZONE_MODULES,
  };
}

export function createCode128Svg(value: string): string {
  const { bars, totalWidth } = createCode128Layout(value);
  const rects = bars
    .map(
      (bar) =>
        `<rect x="${bar.x}" y="0" width="${bar.width}" height="60" fill="#000"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 60" preserveAspectRatio="none" width="100%" height="100%" role="img"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`;
}
