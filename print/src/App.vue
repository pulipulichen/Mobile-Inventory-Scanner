<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import GoogleSheetSource from "./components/GoogleSheetSource.vue";
import PrintPreview from "./components/PrintPreview.vue";
import PrintSettings from "./components/PrintSettings.vue";
import ScanSimulator from "./components/scan_simulator.vue";
import { usePrintSettings } from "./composables/use_print_settings";
import { setLocale, type SupportedLocale } from "./i18n";
import { generatePdf } from "./services/pdf_generator";
import { createQrSvg, QrGeneratorError } from "./services/qr_generator";
import { readSheet, SheetSourceError } from "./services/sheet_source";
import type {
  LayoutMetrics,
  PrintSettings as PrintSettingsModel,
  SheetData,
} from "./types/print";
import { calculateLayout } from "./utils/print_layout";

const { googleSheetUrl, settings, resetSettings } = usePrintSettings();
const { t, locale, n } = useI18n({ useScope: "global" });

const sheetData = ref<SheetData | null>(null);
const qrSvgs = ref<Record<string, string>>({});
const isLoading = ref(false);
const isGeneratingPdf = ref(false);
const statusKey = ref("status.ready");
const statusParams = ref<Record<string, unknown>>({});
const statusTone = ref<"info" | "success" | "warning" | "error">("info");
const lastErrorCode = ref<string | null>(null);
const printMode = ref<"pdf" | "simulation">("pdf");

const statusMessage = computed(() =>
  t(statusKey.value, statusParams.value),
);
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
const canUseSimulation = computed(() => {
  const data = sheetData.value;
  return Boolean(
    data &&
      !isLoading.value &&
      data.items.length > 0 &&
      duplicateGroups.value.length === 0 &&
      data.items.every((item) => Boolean(qrSvgs.value[item.id])),
  );
});
const simulationItems = computed(() =>
  canUseSimulation.value ? sheetData.value?.items ?? [] : [],
);
const simulationBlockedMessage = computed(() => {
  if (isLoading.value) return t("print.simulation_waiting_for_sheet");
  if (!sheetData.value) return t("print.simulation_requires_sheet");
  if (duplicateGroups.value.length > 0) {
    return t("print.simulation_blocked_duplicates");
  }
  if (lastErrorCode.value === "QR_GENERATION_FAILED") {
    return t("errors.QR_GENERATION_FAILED");
  }
  return t("print.simulation_requires_valid_data");
});
const canDownload = computed(
  () =>
    Boolean(sheetData.value) &&
    duplicateGroups.value.length === 0 &&
    sheetData.value!.items.length > 0 &&
    Object.keys(qrSvgs.value).length ===
      new Set(sheetData.value!.items.map((item) => item.id)).size &&
    !isLoading.value &&
    !isGeneratingPdf.value,
);
const scanAppUrl = import.meta.env.VITE_SCAN_APP_URL?.trim() || "../scan/";

function setStatus(
  key: string,
  params: Record<string, unknown> = {},
  tone: "info" | "success" | "warning" | "error" = "info",
): void {
  statusKey.value = key;
  statusParams.value = params;
  statusTone.value = tone;
}

function setError(error: unknown): void {
  const code =
    error instanceof SheetSourceError || error instanceof QrGeneratorError
      ? error.code
      : "UNKNOWN";
  lastErrorCode.value = code;
  setStatus(`errors.${code}`, {}, "error");
}

function handleUrlUpdate(value: string): void {
  googleSheetUrl.value = value;
  lastErrorCode.value = null;
  if (sheetData.value) {
    sheetData.value = null;
    qrSvgs.value = {};
    setStatus("status.ready");
  }
  printMode.value = "pdf";
}

async function loadSheet(): Promise<void> {
  if (!googleSheetUrl.value.trim()) {
    lastErrorCode.value = "INVALID_SHEET_URL";
    setStatus("errors.INVALID_SHEET_URL", {}, "error");
    return;
  }

  isLoading.value = true;
  sheetData.value = null;
  qrSvgs.value = {};
  lastErrorCode.value = null;
  setStatus("status.loading_sheet");

  try {
    const data = await readSheet(googleSheetUrl.value);
    sheetData.value = data;

    if (data.duplicateGroups.length > 0) {
      setStatus(
        "status.duplicate_found",
        { count: data.duplicateGroups.length },
        "warning",
      );
      return;
    }

    const uniqueIds = [...new Set(data.items.map((item) => item.id))];
    const svgEntries = await Promise.all(
      uniqueIds.map(async (id) => [id, await createQrSvg(id)] as const),
    );
    qrSvgs.value = Object.fromEntries(svgEntries);
    setStatus(
      "status.sheet_loaded",
      {
        count: data.items.length,
        sheet: data.spreadsheetTitle,
      },
      "success",
    );
  } catch (error) {
    sheetData.value = null;
    qrSvgs.value = {};
    setError(error);
  } finally {
    isLoading.value = false;
  }
}

function handleModeChange(value: unknown): void {
  if (value !== "pdf" && value !== "simulation") return;
  if (value === "simulation" && !canUseSimulation.value) {
    printMode.value = "pdf";
    return;
  }
  printMode.value = value;
}

async function downloadPdf(): Promise<void> {
  if (!canDownload.value || !sheetData.value) return;

  isGeneratingPdf.value = true;
  setStatus("status.pdf_generating");

  try {
    const blob = await generatePdf(sheetData.value.items, settings);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = objectUrl;
    link.download = `${t("print.pdf_filename")}-${date}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setStatus("status.pdf_success", {}, "success");
  } catch {
    setStatus("status.pdf_error", {}, "error");
  } finally {
    isGeneratingPdf.value = false;
  }
}

function updateSettings(value: PrintSettingsModel): void {
  Object.assign(settings, value);
}

function handleResetSettings(): void {
  sheetData.value = null;
  qrSvgs.value = {};
  lastErrorCode.value = null;
  resetSettings();
  printMode.value = "pdf";
  setStatus("status.settings_reset", {}, "success");
}

function handleLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value === "zh-TW" || value === "en") {
    setLocale(value as SupportedLocale);
  }
}

watch(canUseSimulation, (value) => {
  if (!value && printMode.value === "simulation") {
    printMode.value = "pdf";
  }
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
          <a class="scan-link" :href="scanAppUrl">
            {{ t("print.scan_link") }}
          </a>
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
      <v-container class="app-container">
        <GoogleSheetSource
          :model-value="googleSheetUrl"
          :loading="isLoading"
          :error-message="sourceErrorMessage"
          @update:model-value="handleUrlUpdate"
          @load="loadSheet"
        />

        <v-alert
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

        <v-card
          class="section-card mode-card"
          tag="section"
          aria-labelledby="mode-heading"
        >
          <v-card-item>
            <v-card-title id="mode-heading">
              {{ t("print.mode_heading") }}
            </v-card-title>
            <v-card-subtitle>{{ t("print.mode_hint") }}</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-btn-toggle
              :model-value="printMode"
              color="primary"
              mandatory
              :aria-label="t('print.mode_heading')"
              @update:model-value="handleModeChange"
            >
              <v-btn value="pdf" type="button">
                {{ t("print.mode_pdf") }}
              </v-btn>
              <v-btn
                value="simulation"
                type="button"
                :disabled="!canUseSimulation"
              >
                {{ t("print.mode_simulation") }}
              </v-btn>
            </v-btn-toggle>
            <p class="field-description mode-description">
              {{
                canUseSimulation
                  ? t("print.mode_simulation_available")
                  : simulationBlockedMessage
              }}
            </p>
          </v-card-text>
        </v-card>

        <template v-if="printMode === 'pdf'">
          <PrintSettings
            :settings="settings"
            @update="updateSettings"
            @reset="handleResetSettings"
          />

          <PrintPreview
            :items="canDownload ? sheetData?.items ?? [] : []"
            :qr-svgs="qrSvgs"
            :settings="settings"
            :metrics="metrics"
          >
            <template #actions>
              <v-btn
                type="button"
                color="primary"
                size="large"
                :disabled="!canDownload"
                :loading="isGeneratingPdf"
                @click="downloadPdf"
              >
                {{ t("print.download_pdf") }}
              </v-btn>
            </template>
          </PrintPreview>
        </template>
        <ScanSimulator
          v-else
          :items="simulationItems"
          :qr-svgs="qrSvgs"
          :can-create="canUseSimulation"
          :blocked-message="simulationBlockedMessage"
        />

        <p class="privacy-note">{{ t("print.footer_note") }}</p>
      </v-container>
    </v-main>
  </v-app>
</template>
