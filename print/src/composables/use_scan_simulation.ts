import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Ref,
} from "vue";
import {
  DEFAULT_SCAN_SIMULATION_SETTINGS,
  loadScanSimulationSettings,
  saveScanSimulationSettings,
} from "../services/print_storage";
import type {
  InventoryItem,
  ScanSimulationSettings,
  SceneLayout,
  SimulationItemCount,
} from "../types/print";
import {
  buildSceneLayout,
  SIMULATION_LIMITS,
} from "../utils/scene_layout";

const COUNT_OPTIONS: SimulationItemCount[] = [5, 10, 20, "all"];

function createRandomSeed(): number {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] || DEFAULT_SCAN_SIMULATION_SETTINGS.seed;
  }

  return Math.max(
    1,
    Math.floor(Math.random() * 2 ** 32),
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function useScanSimulation(
  sourceItems: Readonly<Ref<InventoryItem[]>>,
) {
  const savedSettings = loadScanSimulationSettings();
  const itemCount = ref<SimulationItemCount>(savedSettings.itemCount);
  const minQrSizePx = ref(savedSettings.minQrSizePx);
  const maxQrSizePx = ref(savedSettings.maxQrSizePx);
  const zoom = ref(savedSettings.zoom);
  const seed = ref(savedSettings.seed);
  const layout = ref<SceneLayout | null>(null);
  const layoutErrorKey = ref<string | null>(null);
  const viewport = reactive({
    width: 1280,
    height: 720,
  });

  const effectiveItemCount = computed(() => {
    const availableCount = sourceItems.value.length;
    if (itemCount.value === "all") return availableCount;
    return Math.min(itemCount.value, availableCount);
  });

  const selectedItems = computed(() =>
    sourceItems.value.slice(0, effectiveItemCount.value),
  );
  const zoomPercent = computed(() => Math.round(zoom.value * 100));
  const validationErrorKey = computed(() => {
    if (minQrSizePx.value > maxQrSizePx.value) {
      return "errors.SIMULATION_MIN_SIZE_GREATER_THAN_MAX";
    }
    return layoutErrorKey.value;
  });
  const isValid = computed(
    () => sourceItems.value.length > 0 && !validationErrorKey.value,
  );

  function getSettings(): ScanSimulationSettings {
    return {
      itemCount: itemCount.value,
      minQrSizePx: minQrSizePx.value,
      maxQrSizePx: maxQrSizePx.value,
      zoom: zoom.value,
      seed: seed.value,
    };
  }

  function rebuildLayout(): void {
    if (!sourceItems.value.length) {
      layout.value = null;
      layoutErrorKey.value = null;
      return;
    }

    if (minQrSizePx.value > maxQrSizePx.value) {
      layout.value = null;
      layoutErrorKey.value = "errors.SIMULATION_MIN_SIZE_GREATER_THAN_MAX";
      return;
    }

    try {
      layout.value = buildSceneLayout(
        selectedItems.value,
        getSettings(),
        viewport.width,
        viewport.height,
      );
      layoutErrorKey.value = null;
    } catch (error) {
      layout.value = null;
      layoutErrorKey.value =
        error instanceof Error && error.message === "INVALID_SCENE_ZOOM"
          ? "errors.SIMULATION_ZOOM_OUT_OF_RANGE"
          : "errors.SIMULATION_SIZE_OUT_OF_RANGE";
    }
  }

  function normalizeItemCount(): void {
    const availableCount = sourceItems.value.length;
    if (
      availableCount > 0 &&
      itemCount.value !== "all" &&
      itemCount.value > availableCount
    ) {
      itemCount.value = "all";
    }
  }

  function updateMinQrSize(value: unknown): void {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    minQrSizePx.value = clamp(
      Math.round(number),
      SIMULATION_LIMITS.minQrSizePx,
      SIMULATION_LIMITS.maxQrSizePx,
    );
  }

  function updateMaxQrSize(value: unknown): void {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    maxQrSizePx.value = clamp(
      Math.round(number),
      SIMULATION_LIMITS.minQrSizePx,
      SIMULATION_LIMITS.maxQrSizePx,
    );
  }

  function updateItemCount(value: unknown): void {
    if (value === "all") {
      itemCount.value = value;
      return;
    }

    const number = Number(value);
    if (number === 5 || number === 10 || number === 20) {
      itemCount.value = number;
    }
  }

  function changeZoom(delta: number): void {
    zoom.value = clamp(
      Math.round((zoom.value + delta) * 10) / 10,
      SIMULATION_LIMITS.minZoom,
      SIMULATION_LIMITS.maxZoom,
    );
  }

  function resetZoom(): void {
    zoom.value = 1;
  }

  function randomizeSeed(): void {
    seed.value = createRandomSeed();
  }

  function rebuildWithSameSeed(): void {
    rebuildLayout();
  }

  function updateViewport(): void {
    viewport.width = Math.max(320, window.innerWidth);
    viewport.height = Math.max(480, window.innerHeight);
  }

  watch(sourceItems, normalizeItemCount, { immediate: true });
  watch(
    [sourceItems, itemCount, minQrSizePx, maxQrSizePx, zoom, seed],
    () => {
      saveScanSimulationSettings(getSettings());
      rebuildLayout();
    },
    { immediate: true },
  );
  watch(viewport, rebuildLayout);

  onMounted(() => {
    updateViewport();
    window.addEventListener("resize", updateViewport);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", updateViewport);
  });

  return {
    itemCount,
    countOptions: COUNT_OPTIONS,
    minQrSizePx,
    maxQrSizePx,
    zoom,
    zoomPercent,
    seed,
    layout,
    selectedItems,
    effectiveItemCount,
    validationErrorKey,
    isValid,
    updateItemCount,
    updateMinQrSize,
    updateMaxQrSize,
    changeZoom,
    resetZoom,
    randomizeSeed,
    rebuildWithSameSeed,
  };
}
