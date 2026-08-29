import {
  scanImageData,
  setModuleArgs,
} from "@undecaf/zbar-wasm";
import wasmUrl from "@undecaf/zbar-wasm/dist/zbar.wasm?url";

setModuleArgs({
  locateFile: () => wasmUrl,
});

let barcodeDetector: BarcodeDetector | null | undefined;
let barcodeDetectorPromise: Promise<BarcodeDetector | null> | null = null;

function configureWasm(): void {
  // setModuleArgs is already invoked at module level
}

function getBarcodeDetector(): Promise<BarcodeDetector | null> {
  if (barcodeDetector !== undefined) return Promise.resolve(barcodeDetector);
  if (barcodeDetectorPromise) return barcodeDetectorPromise;

  barcodeDetectorPromise = (async () => {
    if (typeof BarcodeDetector === "undefined") {
      barcodeDetector = null;
      return null;
    }

    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      if (!formats.includes("qr_code")) {
        barcodeDetector = null;
        return null;
      }
      barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      barcodeDetector = null;
    }
    return barcodeDetector;
  })();

  return barcodeDetectorPromise;
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
        .filter((barcode) => barcode.format === "qr_code")
        .map((barcode) => barcode.rawValue.trim())
        .filter(Boolean),
    )];
  } catch {
    return [];
  }
}

function isQrSymbol(typeName: string): boolean {
  return typeName.replace(/[_-\s]/g, "").toUpperCase().includes("QRCODE");
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
  configureWasm();
  const symbols = await scanImageData(imageData);
  return [...new Set(
    symbols
      .filter((symbol) => isQrSymbol(symbol.typeName))
      .map((symbol) => symbol.decode().trim())
      .filter(Boolean),
  )];
}

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
