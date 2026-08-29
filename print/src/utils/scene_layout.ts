import type {
  ScanSimulationSettings,
  SceneLayout,
  SceneLayoutItem,
} from "../types/print";

export const SIMULATION_LIMITS = {
  minQrSizePx: 48,
  maxQrSizePx: 512,
  minZoom: 0.5,
  maxZoom: 2,
  zoomStep: 0.1,
} as const;

const SCENE_WIDTH_MULTIPLIER = 3;
const SCENE_HEIGHT_MULTIPLIER = 2;
const MIN_SCENE_WIDTH = 2400;
const MIN_SCENE_HEIGHT = 1600;
const SCENE_PADDING = 48;
const ITEM_GAP = 24;
const POSITION_STEP = 16;
const RANDOM_POSITION_ATTEMPTS = 600;

interface LayoutInputItem {
  id: string;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

type RandomSource = () => number;

function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInteger(
  random: RandomSource,
  minimum: number,
  maximum: number,
): number {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function getLabelHeight(id: string, qrSize: number): number {
  const charactersPerLine = Math.max(6, Math.floor(qrSize / 10));
  const lineCount = Math.max(1, Math.ceil(id.length / charactersPerLine));
  return qrSize + 14 + lineCount * 18;
}

function overlaps(first: Rectangle, second: Rectangle): boolean {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

function canPlace(
  candidate: Rectangle,
  placed: Rectangle[],
): boolean {
  const expandedCandidate = {
    x: candidate.x - ITEM_GAP / 2,
    y: candidate.y - ITEM_GAP / 2,
    width: candidate.width + ITEM_GAP,
    height: candidate.height + ITEM_GAP,
  };

  return placed.every((rectangle) => {
    const expandedRectangle = {
      x: rectangle.x - ITEM_GAP / 2,
      y: rectangle.y - ITEM_GAP / 2,
      width: rectangle.width + ITEM_GAP,
      height: rectangle.height + ITEM_GAP,
    };
    return !overlaps(expandedCandidate, expandedRectangle);
  });
}

function findPosition(
  width: number,
  height: number,
  itemWidth: number,
  itemHeight: number,
  placed: Rectangle[],
  random: RandomSource,
): { x: number; y: number } | null {
  const maximumX = width - SCENE_PADDING - itemWidth;
  const maximumY = height - SCENE_PADDING - itemHeight;

  if (maximumX < SCENE_PADDING || maximumY < SCENE_PADDING) {
    return null;
  }

  const candidate = {
    width: itemWidth,
    height: itemHeight,
    x: 0,
    y: 0,
  };

  for (let attempt = 0; attempt < RANDOM_POSITION_ATTEMPTS; attempt += 1) {
    candidate.x = randomInteger(random, SCENE_PADDING, maximumX);
    candidate.y = randomInteger(random, SCENE_PADDING, maximumY);
    if (canPlace(candidate, placed)) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  for (
    let y = SCENE_PADDING;
    y <= maximumY;
    y += POSITION_STEP
  ) {
    for (
      let x = SCENE_PADDING;
      x <= maximumX;
      x += POSITION_STEP
    ) {
      candidate.x = x;
      candidate.y = y;
      if (canPlace(candidate, placed)) {
        return { x, y };
      }
    }
  }

  return null;
}

function validateSettings(settings: ScanSimulationSettings): void {
  if (
    !Number.isFinite(settings.minQrSizePx) ||
    !Number.isFinite(settings.maxQrSizePx) ||
    settings.minQrSizePx < SIMULATION_LIMITS.minQrSizePx ||
    settings.maxQrSizePx > SIMULATION_LIMITS.maxQrSizePx ||
    settings.minQrSizePx > settings.maxQrSizePx
  ) {
    throw new Error("INVALID_SCENE_SIZE");
  }

  if (
    !Number.isFinite(settings.zoom) ||
    settings.zoom < SIMULATION_LIMITS.minZoom ||
    settings.zoom > SIMULATION_LIMITS.maxZoom
  ) {
    throw new Error("INVALID_SCENE_ZOOM");
  }
}

export function buildSceneLayout(
  items: LayoutInputItem[],
  settings: ScanSimulationSettings,
  viewportWidth = 1280,
  viewportHeight = 720,
): SceneLayout {
  validateSettings(settings);

  const random = createRandomSource(settings.seed);
  const minimumWidth = Math.max(
    MIN_SCENE_WIDTH,
    Math.ceil(viewportWidth * SCENE_WIDTH_MULTIPLIER),
    settings.maxQrSizePx + SCENE_PADDING * 2,
  );
  const minimumHeight = Math.max(
    MIN_SCENE_HEIGHT,
    Math.ceil(viewportHeight * SCENE_HEIGHT_MULTIPLIER),
    settings.maxQrSizePx + SCENE_PADDING * 2,
  );
  let width = minimumWidth;
  let height = minimumHeight;
  const placed: Rectangle[] = [];
  const layoutItems: SceneLayoutItem[] = [];

  items.forEach((item) => {
    const size = randomInteger(
      random,
      Math.round(settings.minQrSizePx),
      Math.round(settings.maxQrSizePx),
    );
    const itemHeight = getLabelHeight(item.id, size);
    let position = findPosition(
      width,
      height,
      size,
      itemHeight,
      placed,
      random,
    );

    while (!position) {
      width = Math.ceil(width * 1.25);
      height = Math.ceil(height * 1.15);
      position = findPosition(
        width,
        height,
        size,
        itemHeight,
        placed,
        random,
      );
    }

    const rectangle = {
      x: position.x,
      y: position.y,
      width: size,
      height: itemHeight,
    };
    placed.push(rectangle);
    layoutItems.push({
      id: item.id,
      x: rectangle.x,
      y: rectangle.y,
      size,
      width: rectangle.width,
      height: rectangle.height,
    });
  });

  return {
    width,
    height,
    items: layoutItems,
  };
}
