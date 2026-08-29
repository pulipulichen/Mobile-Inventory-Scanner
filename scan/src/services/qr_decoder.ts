import {
  scanImageData,
  setModuleArgs,
} from "@undecaf/zbar-wasm";
import wasmUrl from "@undecaf/zbar-wasm/dist/zbar.wasm?url";

let isConfigured = false;

function configureWasm(): void {
  if (isConfigured) return;

  setModuleArgs({
    locateFile: () => wasmUrl,
  });
  isConfigured = true;
}

export async function decodeQrImageData(imageData: ImageData): Promise<string[]> {
  configureWasm();
  const symbols = await scanImageData(imageData);
  const ids = symbols
    .filter((symbol) => symbol.typeName === "QR-Code")
    .map((symbol) => symbol.decode().trim())
    .filter(Boolean);

  return [...new Set(ids)];
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
  return decodeQrImageData(
    context.getImageData(0, 0, canvas.width, canvas.height),
  );
}
