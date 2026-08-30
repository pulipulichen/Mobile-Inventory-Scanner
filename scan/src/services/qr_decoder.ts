import {
  scanImageData,
  setModuleArgs,
  ZBarConfigType,
  ZBarScanner,
  ZBarSymbolType,
} from "@undecaf/zbar-wasm";
import wasmUrl from "@undecaf/zbar-wasm/dist/zbar.wasm?url";

setModuleArgs({
  locateFile: () => wasmUrl,
});

const NATIVE_FORMATS = ["qr_code", "code_128"] as const;
type NativeFormat = (typeof NATIVE_FORMATS)[number];

let barcodeDetector: BarcodeDetector | null | undefined;
let barcodeDetectorPromise: Promise<BarcodeDetector | null> | null = null;
let inventoryScannerPromise: Promise<ZBarScanner> | null = null;

function getBarcodeDetector(): Promise<BarcodeDetector | null> {
  if (barcodeDetector !== undefined) return Promise.resolve(barcodeDetector);
  if (barcodeDetectorPromise) return barcodeDetectorPromise;

  barcodeDetectorPromise = (async () => {
    if (typeof BarcodeDetector === "undefined") {
      barcodeDetector = null;
      return null;
    }

    try {
      const supported = await BarcodeDetector.getSupportedFormats();
      const formats = NATIVE_FORMATS.filter((format) =>
        supported.includes(format),
      ) as NativeFormat[];
      if (!formats.length) {
        barcodeDetector = null;
        return null;
      }
      barcodeDetector = new BarcodeDetector({ formats });
    } catch {
      barcodeDetector = null;
    }
    return barcodeDetector;
  })();

  return barcodeDetectorPromise;
}

function getInventoryScanner(): Promise<ZBarScanner> {
  if (inventoryScannerPromise) return inventoryScannerPromise;

  inventoryScannerPromise = (async () => {
    const scanner = await ZBarScanner.create();
    scanner.setConfig(
      ZBarSymbolType.ZBAR_NONE,
      ZBarConfigType.ZBAR_CFG_ENABLE,
      0,
    );
    scanner.setConfig(
      ZBarSymbolType.ZBAR_QRCODE,
      ZBarConfigType.ZBAR_CFG_ENABLE,
      1,
    );
    scanner.setConfig(
      ZBarSymbolType.ZBAR_CODE128,
      ZBarConfigType.ZBAR_CFG_ENABLE,
      1,
    );
    scanner.setConfig(
      ZBarSymbolType.ZBAR_NONE,
      ZBarConfigType.ZBAR_CFG_X_DENSITY,
      1,
    );
    scanner.setConfig(
      ZBarSymbolType.ZBAR_NONE,
      ZBarConfigType.ZBAR_CFG_Y_DENSITY,
      1,
    );
    scanner.enableCache(false);
    return scanner;
  })();

  return inventoryScannerPromise;
}

async function decodeWithBarcodeDetector(
  imageData: ImageData,
): Promise<string[]> {
  const detector = await getBarcodeDetector();
  if (!detector) return [];

  try {
    const barcodes = await detector.detect(imageData);
    return [...new Set(
      barcodes
        .filter((barcode) =>
          NATIVE_FORMATS.includes(barcode.format as NativeFormat),
        )
        .map((barcode) => barcode.rawValue.trim())
        .filter(Boolean),
    )];
  } catch {
    return [];
  }
}

function isSupportedSymbolType(type: ZBarSymbolType): boolean {
  return (
    type === ZBarSymbolType.ZBAR_QRCODE ||
    type === ZBarSymbolType.ZBAR_CODE128
  );
}

function drawScaledImage(
  image: CanvasImageSource,
  width: number,
  height: number,
): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const context = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  });
  if (!context) return null;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

async function decodeWithZbar(imageData: ImageData): Promise<string[]> {
  const scanner = await getInventoryScanner();
  const symbols = await scanImageData(imageData, scanner);
  return [...new Set(
    symbols
      .filter((symbol) => isSupportedSymbolType(symbol.type))
      .map((symbol) => symbol.decode().trim())
      .filter(Boolean),
  )];
}

/**
 * Decode inventory identifiers from either QR Code or Code 128 symbols.
 * The legacy function name is retained to avoid breaking existing callers.
 */
export async function decodeQrImageData(imageData: ImageData): Promise<string[]> {
  const [nativeIds, zbarIds] = await Promise.all([
    decodeWithBarcodeDetector(imageData),
    decodeWithZbar(imageData),
  ]);

  return [...new Set([...nativeIds, ...zbarIds])];
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("IMAGE_READ_FAILED"));
    };
    image.src = objectUrl;
  });
}

/** Decode QR Code and Code 128 symbols from an uploaded/captured image. */
export async function decodeQrImageFile(file: File): Promise<string[]> {
  const image = await loadImage(file);
  const maxSide = Math.max(image.naturalWidth, image.naturalHeight);
  const allIds = new Set<string>();
  const targetResolutions = [1600, 1000, 600, 400];

  for (const maxDimension of targetResolutions) {
    const scale = Math.min(1, maxDimension / maxSide);
    const imageData = drawScaledImage(
      image,
      Math.round(image.naturalWidth * scale),
      Math.round(image.naturalHeight * scale),
    );
    if (!imageData) continue;

    const ids = await decodeQrImageData(imageData);
    ids.forEach((id) => allIds.add(id));
  }

  if (!allIds.size && maxSide > 1600) {
    const imageData = drawScaledImage(
      image,
      image.naturalWidth,
      image.naturalHeight,
    );
    if (imageData) {
      const ids = await decodeQrImageData(imageData);
      ids.forEach((id) => allIds.add(id));
    }
  }

  return [...allIds];
}
