import QRCode from "qrcode";

export interface QrMatrix {
  size: number;
  modules: boolean[];
}

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 4,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

export class QrGeneratorError extends Error {
  readonly code = "QR_GENERATION_FAILED";

  constructor(cause?: unknown) {
    super("QR_GENERATION_FAILED", { cause });
    this.name = "QrGeneratorError";
  }
}

export async function createQrSvg(payload: string): Promise<string> {
  try {
    return await QRCode.toString(payload, {
      type: "svg",
      ...QR_OPTIONS,
    });
  } catch (error) {
    throw new QrGeneratorError(error);
  }
}

export function createQrMatrix(payload: string): QrMatrix {
  const qrCode = QRCode.create(payload, {
    errorCorrectionLevel: QR_OPTIONS.errorCorrectionLevel,
  });

  return {
    size: qrCode.modules.size,
    modules: Array.from(qrCode.modules.data, Boolean),
  };
}
