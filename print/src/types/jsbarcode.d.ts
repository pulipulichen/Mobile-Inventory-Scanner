declare module "jsbarcode" {
  export interface JsBarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    margin?: number;
    background?: string;
    lineColor?: string;
  }

  export default function JsBarcode(
    element: SVGElement | HTMLCanvasElement | HTMLImageElement,
    text: string,
    options?: JsBarcodeOptions,
  ): unknown;
}
