<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useScanSimulation, type SimulationSourceState } from "../composables/use_scan_simulation";
import QrLabel from "./QrLabel.vue";
import {
  isSimulationItemCount,
  SIMULATION_ZOOM_STEP,
  type InventoryItem,
  type LayoutMetrics,
  type PrintSettings,
} from "../types/print";
import { CSS_PX_PER_MM } from "../utils/print_layout";

const props = defineProps<{
  items: InventoryItem[];
  qrSvgs: Record<string, string>;
  sourceState: SimulationSourceState;
  printSettings: PrintSettings;
  metrics: LayoutMetrics;
}>();

const { t, n } = useI18n({ useScope: "global" });
const simulation = useScanSimulation({
  items: toRef(props, "items"),
  qrSvgs: toRef(props, "qrSvgs"),
  sourceState: toRef(props, "sourceState"),
  printSettings: toRef(props, "printSettings"),
});
const settings = simulation.settings;
const layout = simulation.layout;
const isBuilding = simulation.isBuilding;
const canBuildScene = simulation.canBuildScene;
const effectiveItemCount = simulation.effectiveItemCount;
const statusTone = simulation.statusTone;

const simulationStage = ref<HTMLElement | null>(null);
const simulationViewport = ref<HTMLElement | null>(null);
const isNativeFullscreen = ref(false);
const isFallbackMaximized = ref(false);

const statusMessage = computed(() =>
  t(simulation.statusKey.value, simulation.statusParams.value),
);
const statusRole = computed(() =>
  simulation.statusTone.value === "error" ? "alert" : "status",
);
const statusLive = computed(() =>
  simulation.statusTone.value === "error" ? "assertive" : "polite",
);
const sourceIsReady = computed(() => props.sourceState === "ready");
const hasScene = computed(() => Boolean(simulation.layout.value));
const isFullscreenActive = computed(
  () => isNativeFullscreen.value || isFallbackMaximized.value,
);
const zoomLabel = computed(() => `${simulation.settings.zoom}%`);
const itemCountOptions = computed(() => [
  ...([5, 10, 20] as const).map((count) => ({
    title: t("simulation.item_count_option", { count: n(count) }),
    value: count,
  })),
  {
    title: t("simulation.item_count_all"),
    value: "all" as const,
  },
]);
const canvasStyle = computed(() => {
  const currentLayout = simulation.layout.value;
  if (!currentLayout) return undefined;
  const scale = simulation.settings.zoom / 100;
  return {
    width: `${currentLayout.widthPx * scale}px`,
    height: `${currentLayout.heightPx * scale}px`,
  };
});
const sceneStyle = computed(() => {
  const currentLayout = simulation.layout.value;
  if (!currentLayout) return undefined;
  const scale = simulation.settings.zoom / 100;
  return {
    width: `${currentLayout.widthPx * scale}px`,
    height: `${currentLayout.heightPx * scale}px`,
  };
});
const configurationErrorMessage = computed(() =>
  simulation.settingsError.value
    ? t(`errors.${simulation.settingsError.value}`)
    : "",
);

function updateItemCount(value: unknown): void {
  const parsedValue =
    value === "all" ? value : Number(value);
  if (isSimulationItemCount(parsedValue)) {
    simulation.settings.itemCount = parsedValue;
  }
}

function updateNumber(
  key: "minQrSizePx" | "maxQrSizePx",
  value: unknown,
): void {
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  simulation.settings[key] = Math.min(
    simulation.maxQrSizePx,
    Math.max(simulation.minQrSizePx, Math.round(number)),
  );
}

function increaseZoom(): void {
  simulation.setZoom(simulation.settings.zoom + SIMULATION_ZOOM_STEP);
}

function decreaseZoom(): void {
  simulation.setZoom(simulation.settings.zoom - SIMULATION_ZOOM_STEP);
}

function resetZoom(): void {
  simulation.setZoom(100);
}

function itemStyle(item: {
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}): Record<string, string> {
  const scale = simulation.settings.zoom / 100;
  return {
    left: `${item.xPx * scale}px`,
    top: `${item.yPx * scale}px`,
    width: `${item.widthPx * scale}px`,
    height: `${item.heightPx * scale}px`,
  };
}

function scaledLabelStyle(item: { widthPx: number }): Record<string, string> {
  const displayWidthPx = item.widthPx * (simulation.settings.zoom / 100);
  const naturalWidthPx = props.metrics.labelWidthMm * CSS_PX_PER_MM;
  const labelScale = naturalWidthPx > 0 ? displayWidthPx / naturalWidthPx : 1;
  return {
    width: `${props.metrics.labelWidthMm}mm`,
    height: `${props.metrics.labelHeightMm}mm`,
    transform: `scale(${labelScale})`,
  };
}

function handleSceneKeydown(event: KeyboardEvent): void {
  const viewport = simulationViewport.value;
  if (!viewport) return;

  const distance = event.key === "PageUp" || event.key === "PageDown"
    ? viewport.clientHeight * 0.8
    : 120;
  const movements: Record<string, { left: number; top: number }> = {
    ArrowLeft: { left: -distance, top: 0 },
    ArrowRight: { left: distance, top: 0 },
    ArrowUp: { left: 0, top: -distance },
    ArrowDown: { left: 0, top: distance },
    PageUp: { left: 0, top: -distance },
    PageDown: { left: 0, top: distance },
    Home: { left: -viewport.scrollLeft, top: -viewport.scrollTop },
    End: {
      left: viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft,
      top: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
    },
  };
  const movement = movements[event.key];
  if (!movement) return;
  event.preventDefault();
  viewport.scrollBy({ left: movement.left, top: movement.top });
}

const suppressNextFullscreenEnterAnnouncement = ref(false);

function focusFullscreenButton(): void {
  document.getElementById("simulation-fullscreen-button")?.focus();
}

function focusSceneViewport(): void {
  simulationViewport.value?.focus();
}

function handleFullscreenChange(): void {
  const wasFullscreen = isNativeFullscreen.value;
  isNativeFullscreen.value =
    document.fullscreenElement === simulationStage.value;
  if (isNativeFullscreen.value) {
    void nextTick(focusSceneViewport);
    if (suppressNextFullscreenEnterAnnouncement.value) {
      suppressNextFullscreenEnterAnnouncement.value = false;
      return;
    }
    simulation.setStatus("simulation.fullscreen_entered", {}, "success");
    return;
  }
  suppressNextFullscreenEnterAnnouncement.value = false;
  if (wasFullscreen) {
    simulation.setStatus("simulation.fullscreen_exited", {}, "info");
    void nextTick(focusFullscreenButton);
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (!isFallbackMaximized.value) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    void exitFullscreen();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    simulationViewport.value?.focus();
  }
}

async function enterFullscreen(options: { announce?: boolean } = {}): Promise<void> {
  if (isFullscreenActive.value) {
    return;
  }

  await nextTick();
  const announce = options.announce !== false;
  const stage = simulationStage.value;
  if (document.fullscreenEnabled && stage?.requestFullscreen) {
    try {
      suppressNextFullscreenEnterAnnouncement.value = !announce;
      await stage.requestFullscreen();
      return;
    } catch {
      suppressNextFullscreenEnterAnnouncement.value = false;
    }
  }

  isFallbackMaximized.value = true;
  simulation.setStatus("simulation.fullscreen_unsupported", {}, "warning");
  void nextTick(focusSceneViewport);
}

async function exitFullscreen(): Promise<void> {
  if (isFallbackMaximized.value) {
    isFallbackMaximized.value = false;
    simulation.setStatus("simulation.fullscreen_exited", {}, "info");
    void nextTick(focusFullscreenButton);
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
}

async function toggleFullscreen(): Promise<void> {
  if (isFullscreenActive.value) {
    await exitFullscreen();
    return;
  }
  await enterFullscreen();
}

async function buildScanScene(): Promise<void> {
  const built = simulation.buildScene();
  if (!built) {
    return;
  }
  await enterFullscreen({ announce: false });
}

function measureViewport(): void {
  const viewport = simulationViewport.value;
  if (viewport) {
    simulation.updateViewportSize(viewport.clientWidth, viewport.clientHeight);
    return;
  }
  simulation.updateViewportSize(
    window.innerWidth,
    Math.max(240, window.innerHeight - 200),
  );
}

let resizeObserver: ResizeObserver | null = null;

function observeViewport(): void {
  if (resizeObserver && simulationViewport.value) {
    resizeObserver.observe(simulationViewport.value);
  }
}

watch(hasScene, async (sceneIsVisible) => {
  if (!sceneIsVisible) {
    resizeObserver?.disconnect();
    return;
  }
  await nextTick();
  measureViewport();
  observeViewport();
});

onMounted(() => {
  measureViewport();
  window.addEventListener("resize", measureViewport);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("keydown", handleDocumentKeydown, true);
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(measureViewport);
    observeViewport();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", measureViewport);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener("keydown", handleDocumentKeydown, true);
  resizeObserver?.disconnect();
});
</script>

<template>
  <section
    class="section-card simulation-card"
    :class="{ 'simulation-card-maximized': isFallbackMaximized }"
    aria-labelledby="simulation-heading"
  >
    <header class="simulation-header simulation-chrome" :inert="isFallbackMaximized">
      <div>
        <h2 id="simulation-heading">{{ t("simulation.heading") }}</h2>
        <p>{{ t("simulation.description") }}</p>
      </div>
      <v-btn
        id="simulation-fullscreen-button"
        type="button"
        color="primary"
        variant="outlined"
        prepend-icon="mdi-fullscreen"
        :disabled="!hasScene"
        :aria-label="
          isFullscreenActive
            ? t('simulation.exit_fullscreen')
            : t('simulation.enter_fullscreen')
        "
        @click="toggleFullscreen"
      >
        {{
          isFullscreenActive
            ? t("simulation.exit_fullscreen")
            : t("simulation.enter_fullscreen")
        }}
      </v-btn>
    </header>

    <div
      class="simulation-toolbar simulation-chrome"
      aria-labelledby="simulation-controls-heading"
      :inert="isFallbackMaximized"
    >
      <h3 id="simulation-controls-heading" class="visually-hidden">
        {{ t("simulation.controls_heading") }}
      </h3>

      <div class="simulation-control-grid">
        <v-select
          id="simulation-item-count"
          :model-value="settings.itemCount"
          :items="itemCountOptions"
          item-title="title"
          item-value="value"
          :label="t('simulation.item_count')"
          :hint="
            t('simulation.item_count_hint', {
              count: n(effectiveItemCount),
            })
          "
          persistent-hint
          variant="outlined"
          :disabled="!sourceIsReady"
          @update:model-value="updateItemCount"
        />

        <v-text-field
          id="simulation-min-qr-size"
          :model-value="settings.minQrSizePx"
          :label="t('simulation.min_qr_size')"
          :hint="t('simulation.qr_size_hint')"
          type="number"
          :min="simulation.minQrSizePx"
          :max="simulation.maxQrSizePx"
          suffix="px"
          persistent-hint
          variant="outlined"
          :disabled="!sourceIsReady"
          @update:model-value="updateNumber('minQrSizePx', $event)"
        />

        <v-text-field
          id="simulation-max-qr-size"
          :model-value="settings.maxQrSizePx"
          :label="t('simulation.max_qr_size')"
          :hint="t('simulation.qr_size_hint')"
          type="number"
          :min="simulation.minQrSizePx"
          :max="simulation.maxQrSizePx"
          suffix="px"
          persistent-hint
          variant="outlined"
          :disabled="!sourceIsReady"
          @update:model-value="updateNumber('maxQrSizePx', $event)"
        />
      </div>

      <div class="simulation-actions-row">
        <div class="simulation-action-row">
          <v-btn
            type="button"
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-shuffle-variant"
            :disabled="!canBuildScene"
            @click="simulation.randomizeScene"
          >
            {{ t("simulation.randomize") }}
          </v-btn>
          <v-btn
            type="button"
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-reload"
            :disabled="!canBuildScene"
            @click="simulation.rebuildWithSameSeed"
          >
            {{ t("simulation.rebuild_same_seed") }}
          </v-btn>
        </div>

        <div class="simulation-zoom-controls">
          <span id="simulation-zoom-label" class="simulation-control-label">
            {{ t("simulation.zoom") }}: <strong>{{ zoomLabel }}</strong>
          </span>
          <v-btn
            type="button"
            variant="outlined"
            size="small"
            prepend-icon="mdi-minus"
            :disabled="settings.zoom <= simulation.minZoom"
            :aria-label="t('simulation.zoom_out')"
            @click="decreaseZoom"
          >
            {{ t("simulation.zoom_out") }}
          </v-btn>
          <v-btn
            type="button"
            variant="outlined"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="settings.zoom >= simulation.maxZoom"
            :aria-label="t('simulation.zoom_in')"
            @click="increaseZoom"
          >
            {{ t("simulation.zoom_in") }}
          </v-btn>
          <v-btn
            type="button"
            variant="text"
            size="small"
            :disabled="settings.zoom === 100"
            @click="resetZoom"
          >
            {{ t("simulation.zoom_reset") }}
          </v-btn>
        </div>
      </div>

      <div class="simulation-build-row">
        <v-btn
          type="button"
          color="primary"
          size="large"
          block
          prepend-icon="mdi-play-circle-outline"
          :disabled="!canBuildScene"
          :loading="isBuilding"
          @click="buildScanScene"
        >
          {{ t("simulation.build_scene") }}
        </v-btn>
      </div>
    </div>

    <div class="simulation-chrome" :inert="isFallbackMaximized">
      <v-alert
        class="simulation-status"
        :type="statusTone"
        variant="tonal"
        :role="statusRole"
        :aria-live="statusLive"
      >
        {{ statusMessage }}
      </v-alert>

      <v-alert
        v-if="configurationErrorMessage"
        class="simulation-status"
        type="error"
        variant="tonal"
        role="alert"
      >
        {{ configurationErrorMessage }}
      </v-alert>
    </div>

    <div ref="simulationStage" class="simulation-stage">
      <p v-if="!hasScene" class="simulation-empty">
        {{ t("simulation.build_hint") }}
      </p>

      <div
        v-else
        ref="simulationViewport"
        class="simulation-viewport"
        tabindex="0"
        role="region"
        aria-labelledby="simulation-scene-heading"
        :aria-describedby="
          isFullscreenActive ? 'simulation-fullscreen-hint' : undefined
        "
        @keydown="handleSceneKeydown"
      >
        <p
          v-if="isFullscreenActive"
          id="simulation-fullscreen-hint"
          class="visually-hidden"
        >
          {{ t("simulation.exit_fullscreen_hint") }}
        </p>
        <h3 id="simulation-scene-heading" class="visually-hidden">
          {{ t("simulation.scene_heading") }}
        </h3>
        <div class="simulation-canvas" :style="canvasStyle">
          <ol class="simulation-scene" :style="sceneStyle">
            <li
              v-for="sceneItem in layout?.items"
              :key="sceneItem.item.cellAddress"
              class="simulation-scene-item"
              :style="itemStyle(sceneItem)"
            >
              <div class="simulation-qr-scale">
                <div
                  class="simulation-qr-scale-inner"
                  :style="scaledLabelStyle(sceneItem)"
                >
                  <QrLabel
                    :item="sceneItem.item"
                    :svg-markup="sceneItem.svgMarkup"
                    :metrics="metrics"
                    :settings="printSettings"
                  />
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <footer
      v-if="hasScene"
      class="simulation-footer simulation-chrome"
      :inert="isFallbackMaximized"
    >
      <p>
        {{ t("simulation.scene_summary", {
          count: n(effectiveItemCount),
          width: n(layout?.widthPx ?? 0),
          height: n(layout?.heightPx ?? 0),
        }) }}
      </p>
    </footer>
  </section>
</template>
