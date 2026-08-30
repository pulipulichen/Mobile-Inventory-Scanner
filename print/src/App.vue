<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onUnmounted,
  ref,
  toRaw,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import GoogleSheetSource from "./components/GoogleSheetSource.vue";
import PrintPreview from "./components/PrintPreview.vue";
import PrintSettings from "./components/PrintSettings.vue";
import { usePrintSettings } from "./composables/use_print_settings";
import type { SimulationSourceState } from "./composables/use_scan_simulation";
import { setLocale, type SupportedLocale } from "./i18n";
import { createQrSvg, QrGeneratorError } from "./services/qr_generator";
import { canEncodeCode128 } from "./services/code128_generator";
import { readSheet, SheetSourceError } from "./services/sheet_source";
import {
  getQrPayload,
  showsCode128,
  showsQrCode,
  type InventoryItem,
  type LayoutMetrics,
  type PrintMode,
  type PrintSettings as PrintSettingsModel,
  type SheetData,
} from "./types/print";
import { calculateLayout } from "./utils/print_layout";
import { saveBlob } from "./utils/save_blob";
import { tryParseSpreadsheetId } from "./utils/sheet_url";

const SHEET_URL_DEBOUNCE_MS = 400;

const ScanSimulator = defineAsyncComponent(
  () => import("./components/ScanSimulator.vue"),
);

const { googleSheetUrl, settings, resetSettings } = usePrintSettings();
const { t, locale, n } = useI18n({ useScope: "global" });

const sheetData = ref<SheetData | null>(null);
const qrSvgs = ref<Record<string, string>>({});
const isLoading = ref(false);
const isGeneratingQr = ref(false);
const isGeneratingPdf = ref(false);
const statusKey = ref("status.ready");
const statusParams = ref<Record<string, unknown>>({});
const statusTone = ref<"info" | "success" | "warning" | "error">("info");
const lastErrorCode = ref<string | null>(null);
const mode = ref<PrintMode>("pdf");

const statusMessage = computed(() =>
  t(statusKey.value, statusParams.value),
);
const showStatusAlert = computed(() => statusKey.value !== "status.ready");
const sourceErrorMessage = computed(() =>
  lastErrorCode.value === "INVALID_SHEET_URL"
    ? t(`errors.${lastErrorCode.value}`)
    : "",
);
const metrics = computed<LayoutMetrics>(() =>
  calculateLayout(settings, sheetData.value?.items.length ?? 0),
);
const duplicateGroups = computed(
  () => sheetData.value?.duplicateGroups ?? [],
);
const uniqueIds = computed(
  () => new Set((sheetData.value?.items ?? []).map((item) => item.id)),
);
const code128UnsupportedIds = computed(() => {
  if (!showsCode128(settings.barcodeMode) || !sheetData.value) return [];
  return [...uniqueIds.value].filter((id) => !canEncodeCode128(id));
});
const qrReady = computed(
  () =>
    !showsQrCode(settings.barcodeMode) ||
    Object.keys(qrSvgs.value).length === uniqueIds.value.size,
);
const canDownload = computed(
  () =>
    Boolean(sheetData.value) &&
    duplicateGroups.value.length === 0 &&
    code128UnsupportedIds.value.length === 0 &&
    sheetData.value!.items.length > 0 &&
    qrReady.value &&
    !isLoading.value &&
    !isGeneratingQr.value &&
    !isGeneratingPdf.value,
);
const simulationSourceState = computed<SimulationSourceState>(() => {
  if (!sheetData.value) return "not_loaded";
  if (duplicateGroups.value.length > 0) return "duplicates";
  if (code128UnsupportedIds.value.length > 0) return "code128_error";
  if (isGeneratingQr.value) return "qr_loading";
  if (uniqueIds.value.size === 0) return "not_loaded";
  if (!qrReady.value) return "qr_error";
  return "ready";
});
const canUseSimulation = computed(
  () => simulationSourceState.value === "ready" && !isLoading.value,
);
const isPdfStatusVisible = computed(
  () =>
    statusKey.value === "status.pdf_generating" ||
    statusKey.value === "status.pdf_success" ||
    statusKey.value === "status.pdf_error",
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

watch(canUseSimulation, (available) => {
  if (
    !available &&
    mode.value === "simulation" &&
    simulationSourceState.value !== "qr_loading"
  ) {
    mode.value = "pdf";
  }
});

function setError(error: unknown): void {
  const code =
    error instanceof SheetSourceError ||
    error instanceof QrGeneratorError
      ? error.code
      : "UNKNOWN";
  lastErrorCode.value = code;
  setStatus(`errors.${code}`, {}, "error");
}

async function createQrSvgs(
  items: InventoryItem[],
): Promise<Record<string, string>> {
  const uniqueItems = [
    ...new Map(items.map((item) => [item.id, item])).values(),
  ];
  const svgEntries = await Promise.all(
    uniqueItems.map(
      async (item) =>
        [item.id, await createQrSvg(getQrPayload(item))] as const,
    ),
  );
  return Object.fromEntries(svgEntries);
}

let qrGenerationVersion = 0;

async function refreshQrSvgs(
  items: InventoryItem[],
): Promise<boolean> {
  if (!showsQrCode(settings.barcodeMode)) {
    return true;
  }

  const generationVersion = ++qrGenerationVersion;
  isGeneratingQr.value = true;

  try {
    const nextQrSvgs = await createQrSvgs(items);
    if (generationVersion !== qrGenerationVersion) return false;
    qrSvgs.value = nextQrSvgs;
    return true;
  } catch (error) {
    if (generationVersion === qrGenerationVersion) {
      setError(error);
    }
    return false;
  } finally {
    if (generationVersion === qrGenerationVersion) {
      isGeneratingQr.value = false;
    }
  }
}

let sheetLoadVersion = 0;
let sheetUrlDebounceId = 0;
let loadedSpreadsheetId: string | null = null;

function cancelPendingSheetLoad(): void {
  window.clearTimeout(sheetUrlDebounceId);
  sheetLoadVersion += 1;
  qrGenerationVersion += 1;
  isLoading.value = false;
  isGeneratingQr.value = false;
}

function resetSheetData(): void {
  cancelPendingSheetLoad();
  sheetData.value = null;
  qrSvgs.value = {};
  loadedSpreadsheetId = null;
}

function handleUrlUpdate(value: string): void {
  googleSheetUrl.value = value;
  if (lastErrorCode.value === "INVALID_SHEET_URL") {
    lastErrorCode.value = null;
  }
}

async function loadSheet(options: { force?: boolean } = {}): Promise<void> {
  const spreadsheetId = tryParseSpreadsheetId(googleSheetUrl.value);
  if (!spreadsheetId) {
    lastErrorCode.value = "INVALID_SHEET_URL";
    setStatus("errors.INVALID_SHEET_URL", {}, "error");
    return;
  }

  if (
    !options.force &&
    loadedSpreadsheetId === spreadsheetId &&
    sheetData.value
  ) {
    return;
  }

  const loadVersion = ++sheetLoadVersion;
  isLoading.value = true;
  qrGenerationVersion += 1;
  isGeneratingQr.value = false;
  sheetData.value = null;
  qrSvgs.value = {};
  loadedSpreadsheetId = null;
  lastErrorCode.value = null;
  setStatus("status.loading_sheet");

  try {
    const data = await readSheet(googleSheetUrl.value);
    if (loadVersion !== sheetLoadVersion) return;
    if (tryParseSpreadsheetId(googleSheetUrl.value) !== data.spreadsheetId) {
      return;
    }

    sheetData.value = data;
    loadedSpreadsheetId = data.spreadsheetId;

    if (data.duplicateGroups.length > 0) {
      setStatus(
        "status.duplicate_found",
        { count: data.duplicateGroups.length },
        "warning",
      );
      return;
    }

    const generated = await refreshQrSvgs(data.items);
    if (!generated) return;
    setStatus(
      "status.sheet_loaded",
      {
        count: data.items.length,
        sheet: data.spreadsheetTitle,
      },
      "success",
    );
  } catch (error) {
    if (loadVersion !== sheetLoadVersion) return;
    sheetData.value = null;
    qrSvgs.value = {};
    loadedSpreadsheetId = null;
    setError(error);
  } finally {
    if (loadVersion === sheetLoadVersion) {
      isLoading.value = false;
    }
  }
}

function scheduleSheetLoad(immediate = false): void {
  window.clearTimeout(sheetUrlDebounceId);
  const delay = immediate ? 0 : SHEET_URL_DEBOUNCE_MS;
  sheetUrlDebounceId = window.setTimeout(() => {
    const spreadsheetId = tryParseSpreadsheetId(googleSheetUrl.value);
    if (!spreadsheetId) {
      if (sheetData.value || isLoading.value) {
        resetSheetData();
        lastErrorCode.value = null;
        setStatus("status.ready");
      }
      return;
    }

    void loadSheet();
  }, delay);
}

async function downloadPdf(): Promise<void> {
  if (!canDownload.value || !sheetData.value) return;

  const date = new Date().toISOString().slice(0, 10);
  const filenameKey =
    settings.barcodeMode === "code128"
      ? "print.pdf_filename_code128"
      : settings.barcodeMode === "both"
        ? "print.pdf_filename_both"
        : "print.pdf_filename";
  const filename = `${t(filenameKey)}-${date}.pdf`;

  isGeneratingPdf.value = true;
  setStatus("status.pdf_generating");
  await nextTick();

  try {
    const { generatePdf } = await import("./services/pdf_generator");
    const blob = await generatePdf(
      sheetData.value.items,
      { ...toRaw(settings) },
    );
    saveBlob(blob, filename);
    setStatus("status.pdf_success", {}, "success");
  } catch (error) {
    console.error(error);
    setStatus("status.pdf_error", {}, "error");
  } finally {
    isGeneratingPdf.value = false;
  }
}

function updateSettings(value: PrintSettingsModel): void {
  Object.assign(settings, value);
}

function handleResetSettings(): void {
  resetSheetData();
  lastErrorCode.value = null;
  resetSettings();
  setStatus("status.settings_reset", {}, "success");
}

function handleLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value === "zh-TW" || value === "en") {
    setLocale(value as SupportedLocale);
  }
}

watch(
  googleSheetUrl,
  (_value, previousValue) => {
    scheduleSheetLoad(previousValue === undefined);
  },
  { immediate: true },
);

watch(
  () => settings.barcodeMode,
  () => {
    if (!sheetData.value || duplicateGroups.value.length > 0) return;
    if (!showsQrCode(settings.barcodeMode)) return;
    if (qrReady.value) return;
    void refreshQrSvgs(sheetData.value.items);
  },
);

onUnmounted(() => {
  window.clearTimeout(sheetUrlDebounceId);
  sheetLoadVersion += 1;
  qrGenerationVersion += 1;
});

</script>

<template>
  <v-app>
    <a class="skip-link" href="#main-content">
      {{ t("common.skip_to_content") }}
    </a>

    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <p class="eyebrow">MOBILE INVENTORY SCANNER</p>
          <h1>{{ t("common.app_title") }}</h1>
          <p>{{ t("print.subtitle") }}</p>
        </div>

        <div class="header-actions">
          <div class="locale-control">
            <label for="locale-select">{{ t("common.language") }}</label>
            <select
              id="locale-select"
              :value="locale"
              @change="handleLocaleChange"
            >
              <option value="zh-TW">{{ t("common.chinese") }}</option>
              <option value="en">{{ t("common.english") }}</option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <v-main id="main-content" tag="main">
      <v-container class="app-container" fluid>
        <GoogleSheetSource
          :model-value="googleSheetUrl"
          :loading="isLoading"
          :loaded="Boolean(sheetData)"
          :error-message="sourceErrorMessage"
          @update:model-value="handleUrlUpdate"
          @load="loadSheet({ force: true })"
        />

        <v-alert
          v-if="showStatusAlert && !isPdfStatusVisible"
          class="status-alert"
          :type="statusTone"
          variant="tonal"
          role="status"
          aria-live="polite"
        >
          {{ statusMessage }}
        </v-alert>

        <v-card
          v-if="sheetData"
          class="section-card report-card"
          tag="section"
          aria-labelledby="report-heading"
        >
          <v-card-item>
            <v-card-title id="report-heading">
              {{ t("print.summary_heading") }}
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <dl class="report-grid">
              <div>
                <dt>{{ t("print.summary_sheet") }}</dt>
                <dd>{{ sheetData.spreadsheetTitle }}</dd>
              </div>
              <div>
                <dt>{{ t("print.summary_spreadsheet_id") }}</dt>
                <dd class="report-id">{{ sheetData.spreadsheetId }}</dd>
              </div>
              <div>
                <dt>{{ t("print.summary_valid_ids") }}</dt>
                <dd>{{ n(sheetData.items.length) }}</dd>
              </div>
              <div>
                <dt>{{ t("print.summary_rows") }}</dt>
                <dd>{{ n(sheetData.totalRows) }}</dd>
              </div>
              <div>
                <dt>{{ t("print.summary_data_errors") }}</dt>
                <dd>{{ n(sheetData.dataErrorCount) }}</dd>
              </div>
              <div>
                <dt>{{ t("print.summary_duplicate_groups") }}</dt>
                <dd>{{ n(sheetData.duplicateGroups.length) }}</dd>
              </div>
            </dl>
          </v-card-text>
        </v-card>

        <v-alert
          v-if="code128UnsupportedIds.length"
          class="duplicate-alert"
          type="warning"
          variant="tonal"
          role="alert"
          aria-live="assertive"
        >
          <h2 class="alert-heading">{{ t("print.code128_unsupported_heading") }}</h2>
          <p>{{ t("print.code128_unsupported_description") }}</p>
          <ul class="duplicate-list">
            <li v-for="id in code128UnsupportedIds" :key="id">
              {{ t("print.code128_unsupported_item", { id }) }}
            </li>
          </ul>
        </v-alert>

        <v-alert
          v-if="duplicateGroups.length"
          class="duplicate-alert"
          type="warning"
          variant="tonal"
          role="alert"
          aria-live="assertive"
        >
          <h2 class="alert-heading">{{ t("print.duplicate_heading") }}</h2>
          <p>{{ t("print.duplicate_description") }}</p>
          <ul class="duplicate-list">
            <li v-for="group in duplicateGroups" :key="group.id">
              {{ t("print.duplicate_item", {
                id: group.id,
                locations: group.locations.join("、"),
              }) }}
            </li>
          </ul>
        </v-alert>

        <section
          class="section-card mode-card"
          aria-labelledby="mode-heading"
        >
          <div class="mode-card-content">
            <div>
              <h2 id="mode-heading">{{ t("simulation.mode_heading") }}</h2>
              <p>{{ t("simulation.mode_hint") }}</p>
            </div>
            <div class="mode-actions" role="group" aria-labelledby="mode-heading">
              <v-btn
                type="button"
                :variant="mode === 'pdf' ? 'flat' : 'outlined'"
                :color="mode === 'pdf' ? 'primary' : 'secondary'"
                :aria-pressed="mode === 'pdf'"
                @click="mode = 'pdf'"
              >
                {{ t("simulation.pdf_mode") }}
              </v-btn>
              <v-btn
                type="button"
                :variant="mode === 'simulation' ? 'flat' : 'outlined'"
                :color="mode === 'simulation' ? 'primary' : 'secondary'"
                :aria-pressed="mode === 'simulation'"
                :disabled="!canUseSimulation"
                :title="
                  !canUseSimulation
                    ? t('simulation.simulation_unavailable')
                    : undefined
                "
                @click="mode = 'simulation'"
              >
                {{ t("simulation.simulation_mode") }}
              </v-btn>
            </div>
            <a class="mode-scan-link" href="../scan/">
              {{ t("simulation.go_to_scan") }}
            </a>
            <p v-if="!canUseSimulation" class="field-description">
              {{ t("simulation.simulation_unavailable") }}
            </p>
          </div>
        </section>

        <PrintSettings
          :settings="settings"
          @update="updateSettings"
          @reset="handleResetSettings"
        />

        <template v-if="mode === 'pdf'">
          <PrintPreview
            :items="canDownload ? sheetData?.items ?? [] : []"
            :qr-svgs="qrSvgs"
            :settings="settings"
            :metrics="metrics"
          >
            <template #actions>
              <div class="pdf-download-panel">
                <v-btn
                  class="pdf-download-button"
                  type="button"
                  color="primary"
                  variant="flat"
                  size="large"
                  block
                  prepend-icon="mdi-file-pdf-box"
                  :disabled="!canDownload"
                  :loading="isGeneratingPdf"
                  aria-describedby="pdf-download-status"
                  @click="downloadPdf"
                >
                  {{ t("print.download_pdf") }}
                </v-btn>
                <p
                  id="pdf-download-status"
                  class="pdf-download-status"
                  role="status"
                  aria-live="polite"
                >
                  {{ isPdfStatusVisible ? statusMessage : "" }}
                </p>
              </div>
            </template>
          </PrintPreview>
        </template>

        <ScanSimulator
          v-else
          :items="sheetData?.items ?? []"
          :qr-svgs="qrSvgs"
          :source-state="simulationSourceState"
          :print-settings="settings"
          :metrics="metrics"
        />

        <p class="privacy-note">{{ t("print.footer_note") }}</p>
      </v-container>
    </v-main>
  </v-app>
</template>
