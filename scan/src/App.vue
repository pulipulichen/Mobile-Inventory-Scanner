<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import CameraScanner from "./components/CameraScanner.vue";
import ImageSourceButtons from "./components/ImageSourceButtons.vue";
import PendingInventoryList from "./components/PendingInventoryList.vue";
import ScanResultList from "./components/ScanResultList.vue";
import ScanSettings from "./components/ScanSettings.vue";
import {
  AppsScriptError,
  isAppsScriptUrl,
  loadPendingInventory,
  submitInventoryCheck,
} from "./services/apps_script";
import {
  loadAppsScriptUrl,
  loadLocation,
  loadLocationHistory,
  saveAppsScriptUrl,
  saveLocation,
  saveLocationToHistory,
} from "./services/scan_storage";
import { setLocale, type SupportedLocale } from "./i18n";
import type {
  InventoryItem,
  PendingLocationGroup,
  ScanResult,
} from "./types/scan";

const { t, locale } = useI18n({ useScope: "global" });

const appsScriptUrl = ref(loadAppsScriptUrl());
const location = ref(loadLocation());
const locationHistory = ref(loadLocationHistory());
const results = ref<ScanResult[]>([]);
const pendingItems = ref<InventoryItem[]>([]);
const hasLoadedPending = ref(false);
const isPendingLoading = ref(false);
const isPhotoLoading = ref(false);
const isCameraActive = ref(false);
const camera = ref<InstanceType<typeof CameraScanner> | null>(null);
const statusKey = ref("status.ready");
const statusParams = ref<Record<string, unknown>>({});
const statusTone = ref<"info" | "success" | "warning" | "error">("info");
const sessionIds = new Set<string>();
let submissionQueue: Promise<void> = Promise.resolve();

const statusMessage = computed(() =>
  t(statusKey.value, statusParams.value),
);
const isAppsScriptUrlInvalid = computed(() => {
  const value = appsScriptUrl.value.trim();
  return value.length > 0 && !isAppsScriptUrl(value);
});
const isInventoryReady = computed(
  () => isAppsScriptUrl(appsScriptUrl.value) && Boolean(location.value.trim()),
);
const showStatusAlert = computed(
  () =>
    isAppsScriptUrlInvalid.value ||
    (isInventoryReady.value && statusKey.value !== "status.ready"),
);
const effectiveStatusMessage = computed(() =>
  isAppsScriptUrlInvalid.value
    ? t("errors.INVALID_REQUEST")
    : statusMessage.value,
);
const effectiveStatusTone = computed<"info" | "success" | "warning" | "error">(
  () => (isAppsScriptUrlInvalid.value ? "error" : statusTone.value),
);
const canStartCamera = computed(() => !isCameraActive.value);
const pendingGroups = computed<PendingLocationGroup[]>(() => {
  const groups = new Map<string, InventoryItem[]>();
  pendingItems.value.forEach((item) => {
    const key = item.location || t("scan.unassigned_location");
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });
  return [...groups.entries()].map(([groupLocation, items]) => ({
    location: groupLocation,
    items,
  }));
});

const errorCodes = new Set([
  "INVALID_REQUEST",
  "INVALID_ID",
  "INVALID_LOCATION",
  "ID_NOT_FOUND",
  "DUPLICATE_ID",
  "SHEET_NOT_FOUND",
  "COLUMN_NOT_FOUND",
  "WRITE_FAILED",
  "READ_FAILED",
  "CAMERA_UNAVAILABLE",
  "CAMERA_PERMISSION_DENIED",
  "CAMERA_FRAME_UNAVAILABLE",
  "QR_DECODE_FAILED",
  "IMAGE_READ_FAILED",
]);

function setStatus(
  key: string,
  params: Record<string, unknown> = {},
  tone: "info" | "success" | "warning" | "error" = "info",
): void {
  statusKey.value = key;
  statusParams.value = params;
  statusTone.value = tone;
}

function getErrorCode(error: unknown): string {
  const code =
    error instanceof AppsScriptError
      ? error.code
      : error instanceof Error
        ? error.message
        : "";
  return errorCodes.has(code) ? code : "UNKNOWN";
}

function setError(error: unknown): string {
  const code = getErrorCode(error);
  setStatus(`errors.${code}`, {}, "error");
  return code;
}

function updateAppsScriptUrl(value: string): void {
  appsScriptUrl.value = value;
  saveAppsScriptUrl(value);
}

function updateLocation(value: string): void {
  location.value = value;
  saveLocation(value);
}

function validateAppsScriptUrl(): boolean {
  if (isAppsScriptUrl(appsScriptUrl.value)) return true;
  setStatus("errors.INVALID_REQUEST", {}, "error");
  return false;
}

function validateLocation(): boolean {
  if (location.value.trim()) return true;
  setStatus("errors.INVALID_LOCATION", {}, "error");
  return false;
}

function resetSession(): void {
  sessionIds.clear();
  results.value = [];
}

function clearResults(): void {
  camera.value?.stop();
  isCameraActive.value = false;
  resetSession();
  setStatus("status.session_cleared", {}, "success");
}

function handleCameraStatus(
  state: "starting" | "active" | "stopped" | "error",
  errorCode?: string,
): void {
  if (state === "starting") {
    setStatus("status.camera_starting");
    return;
  }
  if (state === "active") {
    isCameraActive.value = true;
    setStatus("status.camera_active", {}, "success");
    return;
  }
  isCameraActive.value = false;
  if (state === "stopped") {
    setStatus("status.camera_stopped");
    return;
  }
  setStatus(`errors.${errorCodes.has(errorCode ?? "") ? errorCode : "UNKNOWN"}`, {}, "error");
}

async function startCamera(): Promise<void> {
  if (!canStartCamera.value) return;
  if (!validateAppsScriptUrl() || !validateLocation()) return;
  resetSession();
  camera.value?.start();
}

function stopCamera(): void {
  camera.value?.stop();
}

function queueIds(ids: string[]): void {
  const normalizedIds = ids
    .map((id) => id.trim())
    .filter(Boolean);
  const uniqueIds = [...new Set(normalizedIds)];
  const newIds = uniqueIds.filter((id) => !sessionIds.has(id));
  const ignoredCount = normalizedIds.length - newIds.length;
  if (!newIds.length) {
    if (ignoredCount) {
      setStatus("status.ids_duplicate_ignored", { count: ignoredCount }, "warning");
    }
    return;
  }

  newIds.forEach((id) => {
    sessionIds.add(id);
    results.value.push({
      id,
      name: id,
      state: "queued",
    });
  });
  setStatus(
    ignoredCount
      ? "status.ids_found_with_duplicates"
      : "status.ids_found",
    { count: newIds.length, ignored: ignoredCount },
    "info",
  );

  const queuedResults = results.value.filter((result) =>
    newIds.includes(result.id),
  );
  submissionQueue = submissionQueue.then(async () => {
    for (const result of queuedResults) {
      await sendResult(result);
    }
    const success = results.value.filter(
      (result) => result.state === "success",
    ).length;
    const failed = results.value.filter(
      (result) => result.state === "error",
    ).length;
    setStatus("status.all_complete", { success, failed }, failed ? "warning" : "success");
  });
}

async function sendResult(result: ScanResult): Promise<void> {
  result.state = "sending";
  setStatus("status.sending", { id: result.id });
  const submittedLocation = location.value.trim();
  try {
    const item = await submitInventoryCheck(
      appsScriptUrl.value,
      result.id,
      submittedLocation,
    );
    result.name = item.name;
    result.state = "success";
    result.checked_time = item.checked_time;
    result.location = item.location;
    locationHistory.value = saveLocationToHistory(submittedLocation);
    pendingItems.value = pendingItems.value.filter(
      (pendingItem) => pendingItem.id !== result.id,
    );
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
  } catch (error) {
    result.state = "error";
    result.errorCode = setError(error);
    if (navigator.vibrate) navigator.vibrate(250);
  }
}

async function handlePhoto(file: File): Promise<void> {
  if (!validateAppsScriptUrl() || !validateLocation()) return;

  isPhotoLoading.value = true;
  setStatus("status.photo_recognizing");
  try {
    const { decodeQrImageFile } = await import("./services/qr_decoder");
    const ids = await decodeQrImageFile(file);
    if (!ids.length) {
      setStatus("status.no_qr_code", {}, "warning");
      return;
    }
    queueIds(ids);
  } catch (error) {
    setError(error);
  } finally {
    isPhotoLoading.value = false;
  }
}

async function loadPending(): Promise<void> {
  if (!validateAppsScriptUrl()) return;

  isPendingLoading.value = true;
  setStatus("status.pending_loading");
  try {
    pendingItems.value = await loadPendingInventory(appsScriptUrl.value);
    hasLoadedPending.value = true;
    if (!pendingItems.value.length) {
      setStatus("status.pending_empty", {}, "success");
      return;
    }
    setStatus(
      "status.pending_loaded",
      { count: pendingItems.value.length },
      "success",
    );
  } catch (error) {
    setError(error);
  } finally {
    isPendingLoading.value = false;
  }
}

function handleLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value === "zh-TW" || value === "en") {
    setLocale(value as SupportedLocale);
  }
}
</script>

<template>
  <v-app class="inventory-app">
    <a class="skip-link" href="#main-content">
      {{ t("common.skip_to_content") }}
    </a>

    <header class="app-bar">
      <div class="app-bar-inner">
        <div class="app-brand">
          <span class="app-brand-mark" aria-hidden="true">⌗</span>
          <div>
            <p class="app-brand-title">{{ t("common.app_title") }}</p>
            <p class="app-brand-subtitle">{{ t("scan.app_bar_subtitle") }}</p>
          </div>
        </div>

        <div class="locale-control">
          <label for="locale-select" class="locale-trigger">
            <span class="language-icon" aria-hidden="true">🌐</span>
            <span class="language-label-text">{{ t("common.language") }}</span>
          </label>
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
    </header>

    <v-main id="main-content" tag="main" class="app-main">
      <v-container class="app-container" fluid>
        <ScanSettings
          :apps-script-url="appsScriptUrl"
          :location="location"
          :location-history="locationHistory"
          :disabled="isCameraActive"
          @update:apps-script-url="updateAppsScriptUrl"
          @update:location="updateLocation"
        />

        <v-alert
          v-if="showStatusAlert"
          class="status-alert"
          :type="effectiveStatusTone"
          variant="tonal"
          role="status"
          aria-live="polite"
        >
          {{ effectiveStatusMessage }}
        </v-alert>

        <template v-if="isInventoryReady">
          <section
            class="section-card scanner-card"
            aria-labelledby="scanner-heading"
          >
            <div class="section-heading">
              <h2 id="scanner-heading">{{ t("scan.scanner_heading") }}</h2>
              <p>{{ t("scan.scanner_description") }}</p>
            </div>

            <CameraScanner
              ref="camera"
              :video-label="t('scan.camera_preview_label')"
              @detected="queueIds"
              @status="handleCameraStatus"
            />

            <div class="scanner-actions">
              <v-btn
                type="button"
                color="primary"
                size="large"
                prepend-icon="mdi-qrcode-scan"
                :disabled="!canStartCamera"
                @click="startCamera"
              >
                {{ t("scan.start_camera") }}
              </v-btn>
              <v-btn
                type="button"
                color="error"
                variant="outlined"
                size="large"
                stacked
                block
                prepend-icon="mdi-camera-off"
                :disabled="!isCameraActive"
                @click="stopCamera"
              >
                {{ t("scan.stop_camera") }}
              </v-btn>
              <ImageSourceButtons
                :disabled="isPhotoLoading"
                @file="handlePhoto"
              />
            </div>

            <v-btn
              v-if="results.length"
              class="clear-results-button"
              type="button"
              variant="text"
              color="secondary"
              @click="clearResults"
            >
              {{ t("scan.clear_results") }}
            </v-btn>
          </section>

          <section
            class="section-card pending-control-card"
            aria-labelledby="pending-control-heading"
          >
            <div class="section-heading">
              <h2 id="pending-control-heading">
                {{ t("scan.pending_heading") }}
              </h2>
              <p>{{ t("scan.pending_control_description") }}</p>
            </div>
            <v-btn
              type="button"
              color="secondary"
              size="large"
              :loading="isPendingLoading"
              @click="loadPending"
            >
              {{ t("scan.pending_button") }}
            </v-btn>
          </section>

          <PendingInventoryList
            v-if="hasLoadedPending || isPendingLoading"
            :groups="pendingGroups"
            :loading="isPendingLoading"
          />
          <ScanResultList :results="results" />

          <p class="privacy-note">{{ t("scan.privacy_note") }}</p>
        </template>
      </v-container>
    </v-main>
  </v-app>
</template>
