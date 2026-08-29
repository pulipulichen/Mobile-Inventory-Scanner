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
import { useScanSimulation } from "../composables/use_scan_simulation";
import type { InventoryItem } from "../types/print";

const props = defineProps<{
  items: InventoryItem[];
  qrSvgs: Record<string, string>;
  canCreate: boolean;
  blockedMessage: string;
}>();

const { t, n } = useI18n({ useScope: "global" });
const {
  itemCount,
  countOptions,
  minQrSizePx,
  maxQrSizePx,
  zoomPercent,
  seed,
  layout,
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
} = useScanSimulation(toRef(props, "items"));

const simulatorRoot = ref<HTMLElement | null>(null);
const fullscreenButton = ref<{ focus: () => void } | null>(null);
const isNativeFullscreen = ref(false);
const isFallbackFullscreen = ref(false);
const announcement = ref("");

const isFullscreen = computed(
  () => isNativeFullscreen.value || isFallbackFullscreen.value,
);
const canInteract = computed(
  () => props.canCreate && isValid.value && Boolean(layout.value),
);
const sceneViewportStyle = computed(() => {
  if (!layout.value) return {};
  return {
    width: `${layout.value.width * (zoomPercent.value / 100)}px`,
    height: `${layout.value.height * (zoomPercent.value / 100)}px`,
  };
});
const sceneStyle = computed(() => {
  if (!layout.value) return {};
  return {
    width: `${layout.value.width}px`,
    height: `${layout.value.height}px`,
    transform: `scale(${zoomPercent.value / 100})`,
  };
});
const emptyMessage = computed(() => {
  if (validationErrorKey.value) return t(validationErrorKey.value);
  if (props.blockedMessage) return props.blockedMessage;
  return t("print.simulation_no_data");
});

function announce(
  key: string,
  params: Record<string, unknown> = {},
): void {
  announcement.value = "";
  void nextTick(() => {
    announcement.value = t(key, params);
  });
}

function focusFullscreenButton(): void {
  void nextTick(() => fullscreenButton.value?.focus());
}

function updateNativeFullscreenState(): void {
  const previousState = isNativeFullscreen.value;
  isNativeFullscreen.value =
    document.fullscreenElement === simulatorRoot.value;

  if (isNativeFullscreen.value && !previousState) {
    announce("print.simulation_fullscreen_entered");
  } else if (!isNativeFullscreen.value && previousState) {
    announce("print.simulation_fullscreen_exited");
    focusFullscreenButton();
  }
}

async function toggleFullscreen(): Promise<void> {
  if (isFallbackFullscreen.value) {
    isFallbackFullscreen.value = false;
    announce("print.simulation_fullscreen_exited");
    focusFullscreenButton();
    return;
  }

  if (isNativeFullscreen.value) {
    await document.exitFullscreen();
    return;
  }

  const root = simulatorRoot.value;
  if (!root?.requestFullscreen || !document.fullscreenEnabled) {
    isFallbackFullscreen.value = true;
    announce("print.simulation_fullscreen_fallback");
    return;
  }

  try {
    await root.requestFullscreen();
  } catch {
    isFallbackFullscreen.value = true;
    announce("print.simulation_fullscreen_fallback");
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === "Escape" && isFallbackFullscreen.value) {
    event.preventDefault();
    void toggleFullscreen();
  }
}

function handleItemCountChange(event: Event): void {
  updateItemCount((event.target as HTMLSelectElement).value);
}

function itemStyle(item: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Record<string, string> {
  return {
    width: `${item.width}px`,
    minHeight: `${item.height}px`,
    left: `${item.x}px`,
    top: `${item.y}px`,
  };
}

watch(
  [layout, () => props.canCreate],
  ([newLayout, canCreate]) => {
    if (newLayout && canCreate) {
      announce("print.simulation_scene_created", {
        count: n(effectiveItemCount.value),
      });
    }
  },
  { flush: "post" },
);

onMounted(() => {
  document.addEventListener("fullscreenchange", updateNativeFullscreenState);
  if (layout.value && props.canCreate) {
    announce("print.simulation_scene_created", {
      count: n(effectiveItemCount.value),
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener(
    "fullscreenchange",
    updateNativeFullscreenState,
  );
  if (document.fullscreenElement === simulatorRoot.value) {
    void document.exitFullscreen();
  }
});
</script>

<template>
  <section
    ref="simulatorRoot"
    class="scan-simulator"
    :class="{ 'is-fallback-fullscreen': isFallbackFullscreen }"
    aria-labelledby="simulation-heading"
    @keydown="handleEscape"
  >
    <header class="simulation-header">
      <div>
        <h2 id="simulation-heading">{{ t("print.simulation_heading") }}</h2>
        <p>{{ t("print.simulation_description") }}</p>
      </div>
      <div class="simulation-header-actions">
        <p class="fullscreen-status" role="status" aria-live="polite">
          {{
            t(
              isFullscreen
                ? "print.simulation_fullscreen_status"
                : "print.simulation_windowed_status",
            )
          }}
        </p>
        <v-btn
          ref="fullscreenButton"
          type="button"
          color="primary"
          variant="outlined"
          :disabled="!canInteract"
          @click="toggleFullscreen"
        >
          {{
            t(
              isFullscreen
                ? "print.simulation_exit_fullscreen"
                : "print.simulation_enter_fullscreen",
            )
          }}
        </v-btn>
      </div>
    </header>

    <div
      class="simulation-toolbar"
      :aria-label="t('print.simulation_controls')"
    >
      <div class="simulation-control">
        <label for="simulation-item-count">
          {{ t("print.simulation_item_count") }}
        </label>
        <select
          id="simulation-item-count"
          :value="itemCount"
          :disabled="!props.canCreate"
          aria-describedby="simulation-item-count-hint"
          @change="handleItemCountChange"
        >
          <option
            v-for="option in countOptions"
            :key="option"
            :value="option"
          >
            {{
              option === "all"
                ? t("print.simulation_count_all")
                : t(`print.simulation_count_${option}`)
            }}
          </option>
        </select>
        <p id="simulation-item-count-hint" class="simulation-hint">
          {{
            t("print.simulation_effective_count", {
              count: n(effectiveItemCount),
              available: n(props.items.length),
            })
          }}
        </p>
      </div>

      <div class="simulation-size-controls">
        <v-text-field
          id="simulation-min-qr-size"
          :model-value="minQrSizePx"
          :label="t('print.simulation_min_qr_size')"
          :hint="t('print.simulation_qr_size_hint')"
          :error-messages="
            validationErrorKey
              ? [t(validationErrorKey)]
              : []
          "
          suffix="px"
          type="number"
          min="48"
          max="512"
          step="1"
          persistent-hint
          variant="outlined"
          :disabled="!props.canCreate"
          @update:model-value="updateMinQrSize"
        />
        <v-text-field
          id="simulation-max-qr-size"
          :model-value="maxQrSizePx"
          :label="t('print.simulation_max_qr_size')"
          :hint="t('print.simulation_qr_size_hint')"
          :error-messages="
            validationErrorKey
              ? [t(validationErrorKey)]
              : []
          "
          suffix="px"
          type="number"
          min="48"
          max="512"
          step="1"
          persistent-hint
          :disabled="!props.canCreate"
          variant="outlined"
          @update:model-value="updateMaxQrSize"
        />
      </div>

      <div class="simulation-control zoom-control">
        <span id="simulation-zoom-label" class="simulation-label">
          {{ t("print.simulation_zoom") }}
        </span>
        <div class="zoom-actions" aria-labelledby="simulation-zoom-label">
          <v-btn
            type="button"
            variant="outlined"
            :aria-label="t('print.simulation_zoom_out')"
            :disabled="!canInteract"
            @click="changeZoom(-0.1)"
          >
            −
          </v-btn>
          <output
            class="zoom-value"
            aria-live="polite"
            :aria-label="t('print.simulation_zoom_value', { zoom: zoomPercent })"
          >
            {{ zoomPercent }}%
          </output>
          <v-btn
            type="button"
            variant="outlined"
            :aria-label="t('print.simulation_zoom_in')"
            :disabled="!canInteract"
            @click="changeZoom(0.1)"
          >
            +
          </v-btn>
          <v-btn
            type="button"
            variant="text"
            :disabled="!canInteract"
            @click="resetZoom"
          >
            {{ t("print.simulation_zoom_reset") }}
          </v-btn>
        </div>
      </div>

      <div class="simulation-control seed-control">
        <span id="simulation-seed-label" class="simulation-label">
          {{ t("print.simulation_seed") }}
        </span>
        <output
          class="simulation-seed"
          aria-labelledby="simulation-seed-label"
        >
          {{ seed }}
        </output>
        <div class="seed-actions">
          <v-btn
            type="button"
            variant="outlined"
            :disabled="!canInteract"
            @click="randomizeSeed"
          >
            {{ t("print.simulation_randomize") }}
          </v-btn>
          <v-btn
            type="button"
            variant="text"
            :disabled="!canInteract"
            @click="rebuildWithSameSeed"
          >
            {{ t("print.simulation_rebuild_same_seed") }}
          </v-btn>
        </div>
      </div>
    </div>

    <p id="simulation-description" class="simulation-description">
      {{ t("print.simulation_keyboard_hint") }}
    </p>

    <div
      v-if="layout && canInteract"
      class="simulation-viewport"
      tabindex="0"
      :aria-label="t('print.simulation_scene_view')"
      aria-describedby="simulation-description"
    >
      <div class="simulation-viewport-content" :style="sceneViewportStyle">
        <ol class="simulation-scene" :style="sceneStyle">
          <li
            v-for="item in layout.items"
            :key="item.id"
            class="simulation-item"
            :style="itemStyle(item)"
          >
            <article
              class="simulation-qr-label"
              :aria-label="t('print.simulation_qr_label', { id: item.id })"
            >
              <div
                class="simulation-qr-image"
                role="img"
                :aria-label="t('print.simulation_qr_label', { id: item.id })"
                :style="{
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                }"
                v-html="props.qrSvgs[item.id] ?? ''"
              />
              <p class="simulation-qr-id">{{ item.id }}</p>
            </article>
          </li>
        </ol>
      </div>
    </div>
    <div v-else class="simulation-empty" role="alert">
      {{ emptyMessage }}
    </div>

    <p class="sr-only" role="status" aria-live="polite">
      {{ announcement }}
    </p>
  </section>
</template>
