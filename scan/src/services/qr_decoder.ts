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

async function decodeWithZbar(imageData: ImageData): Promise<string[]> {
  configureWasm();
  const symbols = await scanImageData(imageData);
  return [...new Set(
    symbols
      .filter((symbol) => symbol.typeName === "QR-Code")
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
  const maxDimension = 1800;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("IMAGE_READ_FAILED");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let ids = await decodeQrImageData(
    context.getImageData(0, 0, canvas.width, canvas.height),
  );

  if (!ids.length && scale < 1) {
    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = image.naturalWidth;
    fullCanvas.height = image.naturalHeight;
    const fullContext = fullCanvas.getContext("2d", { willReadFrequently: true });
    if (fullContext) {
      fullContext.drawImage(image, 0, 0, fullCanvas.width, fullCanvas.height);
      ids = await decodeQrImageData(
        fullContext.getImageData(0, 0, fullCanvas.width, fullCanvas.height),
      );
    }
  }

  return ids;
}
