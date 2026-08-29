import { computed, reactive, ref, watch, type Ref } from "vue";
import {
  clearSimulationSettings,
  loadSimulationSettings,
  saveSimulationSettings,
} from "../services/print_storage";
import {
  DEFAULT_SIMULATION_SETTINGS,
  MAX_SIMULATION_QR_SIZE_PX,
  MAX_SIMULATION_ZOOM,
  MIN_SIMULATION_QR_SIZE_PX,
  MIN_SIMULATION_ZOOM,
  type InventoryItem,
  type SceneLayout,
  type SimulationSettings,
} from "../types/print";
import {
  createSceneLayout,
  SceneLayoutError,
  selectSimulationItems,
  validateSimulationSettings,
} from "../utils/scene_layout";

export type SimulationSourceState =
  | "not_loaded"
  | "duplicates"
  | "qr_error"
  | "ready";

interface UseScanSimulationOptions {
  items: Ref<InventoryItem[]>;
  qrSvgs: Ref<Record<string, string>>;
  sourceState: Ref<SimulationSourceState>;
}

function createRandomSeed(): number {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] ?? DEFAULT_SIMULATION_SETTINGS.seed;
  }
  return (Date.now() >>> 0) || DEFAULT_SIMULATION_SETTINGS.seed;
}

function sourceStatusKey(state: SimulationSourceState): string {
  switch (state) {
    case "duplicates":
      return "simulation.source_duplicates";
    case "qr_error":
      return "simulation.source_qr_error";
    case "ready":
      return "simulation.ready";
    case "not_loaded":
    default:
      return "simulation.source_not_loaded";
  }
}

export function useScanSimulation({
  items,
  qrSvgs,
  sourceState,
}: UseScanSimulationOptions) {
  const settings = reactive<SimulationSettings>(loadSimulationSettings());
  const layout = ref<SceneLayout | null>(null);
  const isBuilding = ref(false);
  const viewportWidthPx = ref(1_280);
  const viewportHeightPx = ref(720);
  const statusKey = ref(sourceStatusKey(sourceState.value));
  const statusParams = ref<Record<string, unknown>>({});
  const statusTone = ref<"info" | "success" | "warning" | "error">("info");

  saveSimulationSettings(settings);
  watch(
    settings,
    (value) => {
      saveSimulationSettings(value);
    },
    { deep: true },
  );

  const selectedItems = computed(() =>
    selectSimulationItems(items.value, settings.itemCount),
  );
  const effectiveItemCount = computed(() => selectedItems.value.length);
  const settingsError = computed(() =>
    validateSimulationSettings(settings),
  );
  const canBuildScene = computed(
    () =>
      sourceState.value === "ready" &&
      effectiveItemCount.value > 0 &&
      !settingsError.value &&
      !isBuilding.value,
  );

  function setStatus(
    key: string,
    params: Record<string, unknown> = {},
    tone: "info" | "success" | "warning" | "error" = "info",
  ): void {
    statusKey.value = key;
    statusParams.value = params;
    statusTone.value = tone;
  }

  function setSourceStatus(): void {
    if (!layout.value) {
      setStatus(sourceStatusKey(sourceState.value));
    }
  }

  function clearScene(): void {
    layout.value = null;
    setSourceStatus();
  }

  function buildScene(announce = true): boolean {
    if (sourceState.value !== "ready") {
      clearScene();
      return false;
    }

    if (settingsError.value) {
      setStatus(`errors.${settingsError.value}`, {}, "error");
      return false;
    }

    if (effectiveItemCount.value === 0) {
      setStatus("simulation.no_items", {}, "error");
      return false;
    }

    isBuilding.value = true;
    try {
      layout.value = createSceneLayout(
        items.value,
        qrSvgs.value,
        settings,
        viewportWidthPx.value,
        viewportHeightPx.value,
      );
      if (announce) {
        setStatus(
          "simulation.scene_created",
          { count: effectiveItemCount.value },
          "success",
        );
      }
      return true;
    } catch (error) {
      layout.value = null;
      const cause =
        error instanceof SceneLayoutError && typeof error.cause === "string"
          ? error.cause
          : "";
      if (cause === "QR_GENERATION_FAILED") {
        setStatus("errors.QR_GENERATION_FAILED", {}, "error");
      } else {
        setStatus("errors.SIMULATION_LAYOUT_FAILED", {}, "error");
      }
      return false;
    } finally {
      isBuilding.value = false;
    }
  }

  function randomizeScene(): boolean {
    settings.seed = createRandomSeed();
    return buildScene();
  }

  function rebuildWithSameSeed(): boolean {
    return buildScene();
  }

  function updateViewportSize(widthPx: number, heightPx: number): void {
    const nextWidth = Math.max(320, Math.floor(widthPx));
    const nextHeight = Math.max(240, Math.floor(heightPx));
    if (
      nextWidth === viewportWidthPx.value &&
      nextHeight === viewportHeightPx.value
    ) {
      return;
    }
    viewportWidthPx.value = nextWidth;
    viewportHeightPx.value = nextHeight;
    if (layout.value) buildScene(false);
  }

  function setZoom(zoom: number): void {
    settings.zoom = Math.min(
      MAX_SIMULATION_ZOOM,
      Math.max(MIN_SIMULATION_ZOOM, zoom),
    );
  }

  function resetSettings(): void {
    clearSimulationSettings();
    Object.assign(settings, {
      ...DEFAULT_SIMULATION_SETTINGS,
      seed: createRandomSeed(),
    });
    clearScene();
  }

  watch(
    [items, qrSvgs, sourceState],
    () => {
      clearScene();
    },
    { deep: true },
  );

  return {
    settings,
    layout,
    isBuilding,
    statusKey,
    statusParams,
    statusTone,
    setStatus,
    selectedItems,
    effectiveItemCount,
    settingsError,
    canBuildScene,
    buildScene,
    randomizeScene,
    rebuildWithSameSeed,
    updateViewportSize,
    setZoom,
    resetSettings,
    minQrSizePx: MIN_SIMULATION_QR_SIZE_PX,
    maxQrSizePx: MAX_SIMULATION_QR_SIZE_PX,
    minZoom: MIN_SIMULATION_ZOOM,
    maxZoom: MAX_SIMULATION_ZOOM,
  };
}
