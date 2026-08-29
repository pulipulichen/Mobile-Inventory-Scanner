<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import CameraScanner from "./components/CameraScanner.vue";
import ImageSourceButtons from "./components/ImageSourceButtons.vue";
import PendingInventoryList from "./components/PendingInventoryList.vue";
import ScanResultList from "./components/ScanResultList.vue";
import ScanSettings from "./components/ScanSettings.vue";
import {
  AppsScriptError,
  findConfirmedInventoryItem,
  formatSheetTimestamp,
  isAppsScriptUrl,
  loadInventoryItems,
  loadPendingInventory,
  postInventoryChecks,
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
const scannerSection = ref<HTMLElement | null>(null);
const isInventoryConfirmed = ref(isAppsScriptUrl(appsScriptUrl.value));
const statusKey = ref(
  isInventoryConfirmed.value ? "status.settings_confirmed" : "status.ready",
);
const statusParams = ref<Record<string, unknown>>({});
const statusTone = ref<"info" | "success" | "warning" | "error">(
  isInventoryConfirmed.value ? "success" : "info",
);
const SCAN_COOLDOWN_MS = 10_000;
const BATCH_IDLE_MS = 3_000;
const VERIFY_TIMEOUT_MS = 25_000;
const VERIFY_POLL_MS = 1_000;
const CLOCK_SKEW_MS = 3_000;

type FailureToast = {
  id: string;
  errorCode: string;
};
type PendingConfirmation = {
  result: ScanResult;
  previousCheckedTime: string;
  expectedLocation: string;
  submittedAt: number;
  minCheckedTime: string;
};
const failureToastQueue = ref<FailureToast[]>([]);
const activeFailureToast = ref<FailureToast | null>(null);
const isFailureToastVisible = ref(false);
let resolveActiveFailureToast: (() => void) | null = null;
let isFailureToastProcessing = false;
const recentScanAt = new Map<string, number>();
const inFlight = new Map<string, PendingConfirmation>();
let submitGeneration = 0;
let batchIdleTimer = 0;
let pollLoop: Promise<void> | null = null;
let lastInventoryItems: InventoryItem[] = [];
let lastInventoryReadFailed = false;

const statusMessage = computed(() =>
  t(statusKey.value, statusParams.value),
);
const isAppsScriptUrlInvalid = computed(() => {
  const value = appsScriptUrl.value.trim();
  return value.length > 0 && !isAppsScriptUrl(value);
});
const isInventoryReady = computed(
  () =>
    isInventoryConfirmed.value &&
    isAppsScriptUrl(appsScriptUrl.value),
);
const showStatusAlert = computed(
  () => isAppsScriptUrlInvalid.value || statusKey.value !== "status.ready",
);
const effectiveStatusMessage = computed(() =>
  isAppsScriptUrlInvalid.value
    ? t("errors.INVALID_REQUEST")
    : statusMessage.value,
);
const effectiveStatusTone = computed<"info" | "success" | "warning" | "error">(
  () => (isAppsScriptUrlInvalid.value ? "error" : statusTone.value),
);
const failureToastMessage = computed(() => {
  if (!activeFailureToast.value) return "";
  return t("status.inventory_failed_item", {
    id: activeFailureToast.value.id,
    error: t(`errors.${activeFailureToast.value.errorCode}`),
  });
});
const canStartCamera = computed(() => !isCameraActive.value);
const pendingGroups = computed<PendingLocationGroup[]>(() => {
  const currentLocation = location.value.trim();
  const groups = new Map<string, InventoryItem[]>();
  pendingItems.value.forEach((item) => {
    const key = item.location.trim();
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });
  return [...groups.entries()]
    .map(([locationKey, items]) => ({
      locationKey,
      location: locationKey || t("scan.unassigned_location"),
      isCurrent: locationKey === currentLocation,
      items: [...items].sort((left, right) =>
        left.id.localeCompare(right.id, locale.value),
      ),
    }))
    .sort((left, right) => {
      if (left.isCurrent !== right.isCurrent) {
        return left.isCurrent ? -1 : 1;
      }
      const leftUnassigned = left.locationKey === "";
      const rightUnassigned = right.locationKey === "";
      if (leftUnassigned !== rightUnassigned) {
        return leftUnassigned ? 1 : -1;
      }
      return left.location.localeCompare(right.location, locale.value);
    });
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

function updateFailureToastVisibility(visible: boolean): void {
  isFailureToastVisible.value = visible;
  if (!visible) {
    const resolve = resolveActiveFailureToast;
    resolveActiveFailureToast = null;
    resolve?.();
  }
}

async function processFailureToasts(): Promise<void> {
  if (isFailureToastProcessing) return;

  isFailureToastProcessing = true;
  while (failureToastQueue.value.length) {
    activeFailureToast.value = failureToastQueue.value.shift() ?? null;
    isFailureToastVisible.value = true;
    await new Promise<void>((resolve) => {
      resolveActiveFailureToast = resolve;
    });
  }
  activeFailureToast.value = null;
  isFailureToastProcessing = false;
}

function enqueueFailureToast(result: ScanResult): void {
  failureToastQueue.value.push({
    id: result.id,
    errorCode: result.errorCode ?? "UNKNOWN",
  });
  void processFailureToasts();
}

function clearFailureToasts(): void {
  failureToastQueue.value = [];
  if (isFailureToastVisible.value) {
    updateFailureToastVisibility(false);
  } else {
    activeFailureToast.value = null;
  }
}

function updateAppsScriptUrl(value: string): void {
  appsScriptUrl.value = value;
  isInventoryConfirmed.value = false;
  setStatus("status.ready");
  saveAppsScriptUrl(value);
}

function updateLocation(value: string): void {
  const previous = location.value.trim();
  location.value = value;
  saveLocation(value);
  if (previous !== value.trim() && hasCurrentCheckWork()) {
    resetCurrentCheck();
    setStatus("status.location_changed_results_cleared", {}, "info");
  }
}

function validateAppsScriptUrl(): boolean {
  if (isAppsScriptUrl(appsScriptUrl.value)) return true;
  setStatus("errors.INVALID_REQUEST", {}, "error");
  return false;
}

async function scrollToScanner(): Promise<void> {
  await nextTick();
  window.requestAnimationFrame(() => {
    scannerSection.value?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  });
}

async function confirmSettings(): Promise<void> {
  isInventoryConfirmed.value = false;
  if (!validateAppsScriptUrl()) return;

  isInventoryConfirmed.value = true;
  setStatus("status.settings_confirmed", {}, "success");
  await scrollToScanner();
}

onMounted(() => {
  if (isInventoryConfirmed.value) void scrollToScanner();
});

onBeforeUnmount(() => {
  window.clearTimeout(batchIdleTimer);
  flushQueuedResults();
});

function hasCurrentCheckWork(): boolean {
  return results.value.length > 0 || inFlight.size > 0;
}

function resetCurrentCheck(): void {
  submitGeneration += 1;
  window.clearTimeout(batchIdleTimer);
  inFlight.clear();
  recentScanAt.clear();
  results.value = [];
  clearFailureToasts();
}

function resetSession(): void {
  resetCurrentCheck();
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
  if (state === "stopped") {
    isCameraActive.value = false;
    setStatus("status.camera_stopped");
    return;
  }
  if (errorCode === "QR_DECODE_FAILED") {
    setStatus("errors.QR_DECODE_FAILED", {}, "error");
    return;
  }
  isCameraActive.value = false;
  setStatus(`errors.${errorCodes.has(errorCode ?? "") ? errorCode : "UNKNOWN"}`, {}, "error");
}

async function startCamera(): Promise<void> {
  if (!canStartCamera.value) return;
  if (!validateAppsScriptUrl()) return;
  camera.value?.start();
}

function stopCamera(): void {
  camera.value?.stop();
  flushQueuedResults();
}

function queueIds(ids: string[], source: "camera" | "photo" = "camera"): void {
  const now = Date.now();
  const normalizedIds = ids
    .map((id) => id.trim())
    .filter(Boolean);
  const uniqueIds = [...new Set(normalizedIds)];
  const acceptedIds: string[] = [];
  let ignoredCount = 0;

  uniqueIds.forEach((id) => {
    const existing = results.value.find((result) => result.id === id);
    if (existing?.state === "queued" || existing?.state === "sending") {
      ignoredCount += 1;
      return;
    }
    const lastScanAt = recentScanAt.get(id) ?? 0;
    if (now - lastScanAt < SCAN_COOLDOWN_MS) {
      ignoredCount += 1;
      return;
    }
    acceptedIds.push(id);
  });

  if (!acceptedIds.length) {
    if (source === "photo" && ignoredCount) {
      setStatus("status.ids_duplicate_ignored", { count: ignoredCount }, "warning");
    }
    return;
  }

  acceptedIds.forEach((id) => {
    recentScanAt.set(id, now);
    const existingIndex = results.value.findIndex((result) => result.id === id);
    if (existingIndex >= 0) {
      const existing = results.value[existingIndex];
      existing.state = "queued";
      existing.errorCode = undefined;
      results.value.splice(existingIndex, 1);
      results.value.unshift(existing);
      return;
    }
    results.value.unshift({
      id,
      name: id,
      state: "queued",
    });
  });

  const queuedCount = results.value.filter(
    (result) => result.state === "queued",
  ).length;
  setStatus(
    ignoredCount
      ? "status.ids_found_with_duplicates"
      : "status.ids_batch_waiting",
    { count: acceptedIds.length, queued: queuedCount, ignored: ignoredCount },
    "info",
  );
  scheduleBatchSubmit();
}

function scheduleBatchSubmit(): void {
  window.clearTimeout(batchIdleTimer);
  batchIdleTimer = window.setTimeout(() => {
    flushQueuedResults();
  }, BATCH_IDLE_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function vibrateSuccess(): void {
  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
}

function applySuccess(
  result: ScanResult,
  item: InventoryItem,
  submittedLocation: string,
): void {
  if (result.state === "success") return;
  result.name = item.name || result.id;
  result.state = "success";
  result.checked_time = item.checked_time;
  result.location = item.location;
  result.locationProvided = Boolean(submittedLocation);
  result.errorCode = undefined;
  locationHistory.value = saveLocationToHistory(submittedLocation);
  pendingItems.value = pendingItems.value.filter(
    (pendingItem) => pendingItem.id !== result.id,
  );
}

function applyFailureCode(result: ScanResult, code: string): void {
  if (result.state === "success") return;
  result.state = "error";
  result.errorCode = errorCodes.has(code) ? code : "UNKNOWN";
  enqueueFailureToast(result);
}

function announceBatchComplete(): void {
  const success = results.value.filter(
    (result) => result.state === "success",
  ).length;
  const failed = results.value.filter(
    (result) => result.state === "error",
  ).length;
  const pending = results.value.filter(
    (result) => result.state === "queued" || result.state === "sending",
  ).length;
  if (pending) {
    const sending = results.value.filter(
      (result) => result.state === "sending",
    ).length;
    if (sending) {
      setStatus("status.confirming", { count: sending });
    }
    return;
  }
  setStatus(
    "status.all_complete",
    { success, failed },
    failed ? "warning" : "success",
  );
}

function failTimedOutItem(pending: PendingConfirmation): void {
  const item = lastInventoryItems.find(
    (candidate) => candidate.id === pending.result.id,
  );
  if (lastInventoryReadFailed && lastInventoryItems.length === 0) {
    applyFailureCode(pending.result, "READ_FAILED");
    return;
  }
  if (!item) {
    applyFailureCode(pending.result, "ID_NOT_FOUND");
    return;
  }
  applyFailureCode(pending.result, "WRITE_FAILED");
}

function flushQueuedResults(): void {
  window.clearTimeout(batchIdleTimer);
  const queuedResults = results.value.filter(
    (result) => result.state === "queued",
  );
  if (!queuedResults.length) return;

  const submittedLocation = location.value.trim();
  const generation = submitGeneration;
  const submittedAt = Date.now();
  const minCheckedTime = formatSheetTimestamp(
    new Date(submittedAt - CLOCK_SKEW_MS),
  );
  const batchIds = queuedResults.map((result) => result.id);

  queuedResults.forEach((result) => {
    result.state = "sending";
    inFlight.set(result.id, {
      result,
      previousCheckedTime: result.checked_time ?? "",
      expectedLocation: submittedLocation,
      submittedAt,
      minCheckedTime,
    });
  });

  setStatus("status.batch_sending", { count: batchIds.length });
  startConfirmPoller();

  void postInventoryChecks(
    appsScriptUrl.value,
    batchIds,
    submittedLocation,
  )
    .then((outcome) => {
      if (generation !== submitGeneration) return;
      if (!outcome) return;

      let confirmed = 0;
      outcome.items.forEach((item) => {
        const pending = inFlight.get(item.id);
        if (!pending) return;
        applySuccess(pending.result, item, pending.expectedLocation);
        inFlight.delete(item.id);
        confirmed += 1;
      });
      outcome.failures.forEach((failure) => {
        const pending = inFlight.get(failure.id);
        if (!pending) return;
        applyFailureCode(pending.result, failure.errorCode);
        inFlight.delete(failure.id);
      });
      if (confirmed) vibrateSuccess();
      announceBatchComplete();
    })
    .catch((error) => {
      if (generation !== submitGeneration) return;
      if (
        error instanceof AppsScriptError &&
        error.code === "READ_FAILED"
      ) {
        return;
      }
      const code = getErrorCode(error);
      batchIds.forEach((id) => {
        const pending = inFlight.get(id);
        if (!pending) return;
        applyFailureCode(pending.result, code);
        inFlight.delete(id);
      });
      announceBatchComplete();
    });
}

function startConfirmPoller(): void {
  if (pollLoop) return;
  pollLoop = runConfirmPoller().finally(() => {
    pollLoop = null;
  });
}

async function runConfirmPoller(): Promise<void> {
  const generation = submitGeneration;

  while (generation === submitGeneration && inFlight.size > 0) {
    const now = Date.now();
    [...inFlight.entries()].forEach(([id, pending]) => {
      if (now - pending.submittedAt < VERIFY_TIMEOUT_MS) return;
      failTimedOutItem(pending);
      inFlight.delete(id);
    });
    if (!inFlight.size) break;

    try {
      lastInventoryItems = await loadInventoryItems(appsScriptUrl.value);
      lastInventoryReadFailed = false;
      if (generation !== submitGeneration) return;

      let confirmed = 0;
      [...inFlight.entries()].forEach(([id, pending]) => {
        const item = findConfirmedInventoryItem(lastInventoryItems, id, pending);
        if (!item) return;
        applySuccess(pending.result, item, pending.expectedLocation);
        inFlight.delete(id);
        confirmed += 1;
      });
      if (confirmed) vibrateSuccess();
    } catch {
      lastInventoryReadFailed = true;
    }

    if (generation !== submitGeneration) return;
    announceBatchComplete();
    if (inFlight.size) await delay(VERIFY_POLL_MS);
  }

  if (generation === submitGeneration) announceBatchComplete();
}

async function handlePhoto(file: File): Promise<void> {
  if (!validateAppsScriptUrl()) return;

  isPhotoLoading.value = true;
  setStatus("status.photo_recognizing");
  try {
    const { decodeQrImageFile } = await import("./services/qr_decoder");
    const ids = await decodeQrImageFile(file);
    if (!ids.length) {
      setStatus("status.no_qr_code", {}, "warning");
      return;
    }
    queueIds(ids, "photo");
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
          :settings-locked="isCameraActive"
          @update:apps-script-url="updateAppsScriptUrl"
          @update:location="updateLocation"
          @confirm="confirmSettings"
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
            ref="scannerSection"
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

          <ScanResultList :results="results" />
          <PendingInventoryList
            :groups="pendingGroups"
            :loading="isPendingLoading"
            :has-loaded="hasLoadedPending"
            @load="loadPending"
          />

          <p class="privacy-note">{{ t("scan.privacy_note") }}</p>
        </template>
      </v-container>
    </v-main>

    <v-snackbar
      :model-value="isFailureToastVisible"
      class="failure-toast"
      color="error"
      location="bottom"
      :timeout="8000"
      role="alert"
      @update:model-value="updateFailureToastVisibility"
    >
      {{ failureToastMessage }}
      <template #actions>
        <v-btn
          variant="text"
          :aria-label="t('common.dismiss')"
          @click="updateFailureToastVisibility(false)"
        >
          {{ t("common.dismiss") }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
