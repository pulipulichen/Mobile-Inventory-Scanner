import {
  MAX_SIMULATION_QR_SIZE_PX,
  MAX_SIMULATION_ZOOM,
  MIN_SIMULATION_QR_SIZE_PX,
  MIN_SIMULATION_ZOOM,
  SIMULATION_ITEM_COUNTS,
  type InventoryItem,
  type SceneLayout,
  type SceneLayoutItem,
  type SimulationSettings,
} from "../types/print";

export type SimulationSettingsErrorCode =
  | "SIMULATION_INVALID_ITEM_COUNT"
  | "SIMULATION_INVALID_QR_SIZE"
  | "SIMULATION_MIN_QR_LARGER_THAN_MAX"
  | "SIMULATION_INVALID_ZOOM";

export class SceneLayoutError extends Error {
  readonly code = "SIMULATION_LAYOUT_FAILED";

  constructor(cause?: unknown) {
    super("SIMULATION_LAYOUT_FAILED", { cause });
    this.name = "SceneLayoutError";
  }
}

const SCENE_WIDTH_MULTIPLIER = 3;
const SCENE_HEIGHT_MULTIPLIER = 2;
const MIN_SCENE_WIDTH_PX = 1_600;
const MIN_SCENE_HEIGHT_PX = 1_000;
const LABEL_HORIZONTAL_PADDING_PX = 12;
const LABEL_VERTICAL_PADDING_PX = 12;
const ID_TEXT_HEIGHT_PX = 22;
const ITEM_GAP_PX = 24;
const PLACEMENT_ATTEMPTS = 600;
const MAX_EXPANSIONS = 24;

export function validateSimulationSettings(
  settings: SimulationSettings,
): SimulationSettingsErrorCode | null {
  if (!SIMULATION_ITEM_COUNTS.includes(settings.itemCount)) {
    return "SIMULATION_INVALID_ITEM_COUNT";
  }

  const sizesAreValid =
    Number.isFinite(settings.minQrSizePx) &&
    Number.isFinite(settings.maxQrSizePx) &&
    settings.minQrSizePx >= MIN_SIMULATION_QR_SIZE_PX &&
    settings.maxQrSizePx <= MAX_SIMULATION_QR_SIZE_PX;
  if (!sizesAreValid) return "SIMULATION_INVALID_QR_SIZE";
  if (settings.minQrSizePx > settings.maxQrSizePx) {
    return "SIMULATION_MIN_QR_LARGER_THAN_MAX";
  }

  if (
    !Number.isFinite(settings.zoom) ||
    settings.zoom < MIN_SIMULATION_ZOOM ||
    settings.zoom > MAX_SIMULATION_ZOOM
  ) {
    return "SIMULATION_INVALID_ZOOM";
  }

  return null;
}

export function selectSimulationItems(
  items: InventoryItem[],
  itemCount: SimulationSettings["itemCount"],
): InventoryItem[] {
  if (itemCount === "all") return items.slice();
  return items.slice(0, Math.min(itemCount, items.length));
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function rectanglesOverlap(
  first: SceneLayoutItem,
  second: Pick<SceneLayoutItem, "xPx" | "yPx" | "widthPx" | "heightPx">,
): boolean {
  return (
    first.xPx < second.xPx + second.widthPx + ITEM_GAP_PX &&
    first.xPx + first.widthPx + ITEM_GAP_PX > second.xPx &&
    first.yPx < second.yPx + second.heightPx + ITEM_GAP_PX &&
    first.yPx + first.heightPx + ITEM_GAP_PX > second.yPx
  );
}

function createLayoutItem(
  item: InventoryItem,
  svgMarkup: string,
  qrSizePx: number,
  xPx: number,
  yPx: number,
): SceneLayoutItem {
  return {
    item,
    svgMarkup,
    xPx,
    yPx,
    qrSizePx,
    widthPx: qrSizePx + LABEL_HORIZONTAL_PADDING_PX * 2,
    heightPx:
      qrSizePx + LABEL_VERTICAL_PADDING_PX * 2 + ID_TEXT_HEIGHT_PX,
  };
}

function findPosition(
  layoutItems: SceneLayoutItem[],
  item: SceneLayoutItem,
  widthPx: number,
  heightPx: number,
  random: () => number,
): { xPx: number; yPx: number } | null {
  const availableWidth = widthPx - item.widthPx;
  const availableHeight = heightPx - item.heightPx;
  if (availableWidth < 0 || availableHeight < 0) return null;

  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt += 1) {
    const candidate = {
      xPx: Math.floor(random() * (availableWidth + 1)),
      yPx: Math.floor(random() * (availableHeight + 1)),
      widthPx: item.widthPx,
      heightPx: item.heightPx,
    };
    if (!layoutItems.some((placed) => rectanglesOverlap(placed, candidate))) {
      return { xPx: candidate.xPx, yPx: candidate.yPx };
    }
  }

  return null;
}

export function createSceneLayout(
  items: InventoryItem[],
  qrSvgs: Record<string, string>,
  settings: SimulationSettings,
  viewportWidthPx: number,
  viewportHeightPx: number,
): SceneLayout {
  const settingsError = validateSimulationSettings(settings);
  if (settingsError) throw new SceneLayoutError(settingsError);

  const selectedItems = selectSimulationItems(items, settings.itemCount);
  const random = createRandom(settings.seed);
  let widthPx = Math.max(
    MIN_SCENE_WIDTH_PX,
    Math.ceil(viewportWidthPx * SCENE_WIDTH_MULTIPLIER),
  );
  let heightPx = Math.max(
    MIN_SCENE_HEIGHT_PX,
    Math.ceil(viewportHeightPx * SCENE_HEIGHT_MULTIPLIER),
  );
  const layoutItems: SceneLayoutItem[] = [];

  selectedItems.forEach((item) => {
    const svgMarkup = qrSvgs[item.id];
    if (!svgMarkup) throw new SceneLayoutError("QR_GENERATION_FAILED");

    const qrSizePx = Math.round(
      settings.minQrSizePx +
        random() * (settings.maxQrSizePx - settings.minQrSizePx),
    );
    const itemWithoutPosition = createLayoutItem(
      item,
      svgMarkup,
      qrSizePx,
      0,
      0,
    );
    let position: { xPx: number; yPx: number } | null = null;

    for (let expansion = 0; !position && expansion <= MAX_EXPANSIONS; expansion += 1) {
      position = findPosition(
        layoutItems,
        itemWithoutPosition,
        widthPx,
        heightPx,
        random,
      );
      if (!position) {
        widthPx = Math.ceil(widthPx * 1.3 + itemWithoutPosition.widthPx);
        heightPx = Math.ceil(heightPx * 1.2 + itemWithoutPosition.heightPx);
      }
    }

    if (!position) throw new SceneLayoutError("SCENE_SPACE_EXHAUSTED");

    layoutItems.push(
      createLayoutItem(
        item,
        svgMarkup,
        qrSizePx,
        position.xPx,
        position.yPx,
      ),
    );
  });

  return {
    widthPx,
    heightPx,
    items: layoutItems,
  };
}
