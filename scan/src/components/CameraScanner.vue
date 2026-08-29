<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  applyLiveCameraTuning,
  captureVideoCenterCropImageData,
  captureVideoImageData,
  focusVideoTrack,
  mapCoverPointToVideo,
  openRearCamera,
  waitForVideoFrame,
} from "../services/camera";
import { decodeQrImageData } from "../services/qr_decoder";

const props = defineProps<{
  videoLabel: string;
}>();

const emit = defineEmits<{
  detected: [ids: string[]];
  status: ["starting" | "active" | "stopped" | "error", string?];
}>();

const { t } = useI18n({ useScope: "global" });
const preview = ref<HTMLElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const isScanning = ref(false);
const focusReticle = ref<{ x: number; y: number } | null>(null);
const focusStatus = ref("");
const scannerInput = ref("");
const canvas = document.createElement("canvas");
let stream: MediaStream | null = null;
let frameRequest = 0;
let lastFrameAt = 0;
let isDecoding = false;
let lastDecodeErrorAt = 0;
let focusReticleTimeout = 0;

function stopTracks(): void {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video.value) {
    video.value.pause();
    video.value.srcObject = null;
  }
}

function clearFocusReticle(): void {
  window.clearTimeout(focusReticleTimeout);
  focusReticle.value = null;
}

function showFocusReticle(x: number, y: number): void {
  focusReticle.value = { x, y };
  window.clearTimeout(focusReticleTimeout);
  focusReticleTimeout = window.setTimeout(() => {
    focusReticle.value = null;
  }, 900);
}

function submitScannerInput(): void {
  const value = scannerInput.value.trim();
  if (!value) return;
  emit("detected", [value]);
  scannerInput.value = "";
}

function scheduleFrame(): void {
  frameRequest = window.requestAnimationFrame(processFrame);
}

async function processFrame(timestamp: number): Promise<void> {
  if (!isScanning.value) return;

  if (
    timestamp - lastFrameAt >= 220 &&
    !isDecoding &&
    video.value &&
    video.value.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.value.videoWidth > 0
  ) {
    lastFrameAt = timestamp;
    isDecoding = true;
    try {
      const currentVideo = video.value;
      let ids = await decodeQrImageData(
        captureVideoImageData(currentVideo, canvas),
      );
      if (!ids.length) {
        ids = await decodeQrImageData(
          captureVideoCenterCropImageData(currentVideo, canvas),
        );
      }
      if (ids.length) emit("detected", ids);
    } catch {
      if (Date.now() - lastDecodeErrorAt > 5000) {
        lastDecodeErrorAt = Date.now();
        emit("status", "error", "QR_DECODE_FAILED");
      }
    } finally {
      isDecoding = false;
    }
  }

  if (isScanning.value) scheduleFrame();
}

async function start(): Promise<void> {
  if (isScanning.value) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    emit("status", "error", "CAMERA_UNAVAILABLE");
    return;
  }

  emit("status", "starting");
  try {
    stream = await openRearCamera();
    if (!video.value) {
      stopTracks();
      emit("status", "error", "CAMERA_UNAVAILABLE");
      return;
    }
    video.value.srcObject = stream;
    await waitForVideoFrame(video.value);
    isScanning.value = true;
    lastFrameAt = 0;
    emit("status", "active");
    scheduleFrame();
  } catch (error) {
    stopTracks();
    const name = error instanceof DOMException ? error.name : "";
    const message = error instanceof Error ? error.message : "";
    if (message === "CAMERA_FRAME_UNAVAILABLE") {
      emit("status", "error", "CAMERA_FRAME_UNAVAILABLE");
      return;
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      emit("status", "error", "CAMERA_UNAVAILABLE");
      return;
    }
    emit("status", "error", "CAMERA_PERMISSION_DENIED");
  }
}

function stop(): void {
  isScanning.value = false;
  window.cancelAnimationFrame(frameRequest);
  clearFocusReticle();
  focusStatus.value = "";
  stopTracks();
  emit("status", "stopped");
}

async function handleFocusClick(event: MouseEvent): Promise<void> {
  if (!isScanning.value || !preview.value || !video.value) return;

  const track = stream?.getVideoTracks()[0];
  const isKeyboard = event.detail === 0;
  const rect = preview.value.getBoundingClientRect();
  const clientX = isKeyboard ? rect.left + rect.width / 2 : event.clientX;
  const clientY = isKeyboard ? rect.top + rect.height / 2 : event.clientY;
  const point = isKeyboard
    ? { x: 0.5, y: 0.5 }
    : mapCoverPointToVideo(clientX, clientY, preview.value, video.value);

  showFocusReticle(clientX - rect.left, clientY - rect.top);
  focusStatus.value = "";
  await nextTick();
  focusStatus.value = t("scan.camera_focused");
  if (track) {
    const focused = await focusVideoTrack(track, point);
    if (!focused) await applyLiveCameraTuning(track);
  }
}

defineExpose({ start, stop });

onBeforeUnmount(stop);
</script>

<template>
  <div>
    <div
      ref="preview"
      class="camera-preview"
      role="region"
      :aria-label="props.videoLabel"
    >
      <video
        ref="video"
        class="camera-video"
        autoplay
        muted
        playsinline
        aria-hidden="true"
      />
      <button
        v-if="isScanning"
        type="button"
        class="camera-focus-target"
        :aria-label="t('scan.camera_tap_to_focus')"
        @click="handleFocusClick"
      />
      <span
        v-if="focusReticle"
        class="camera-focus-reticle"
        :style="{ left: `${focusReticle.x}px`, top: `${focusReticle.y}px` }"
        aria-hidden="true"
      />
      <p class="camera-frame-hint" aria-hidden="true">
        {{ isScanning ? t("scan.camera_tap_to_focus_hint") : props.videoLabel }}
      </p>
      <p class="visually-hidden" role="status" aria-live="polite">
        {{ focusStatus }}
      </p>
    </div>

    <form class="scanner-gun-input" @submit.prevent="submitScannerInput">
      <v-text-field
        v-model="scannerInput"
        label="刷槍／條碼輸入"
        placeholder="掃描 Code 128、QR Code，或手動輸入 ID 後按 Enter"
        prepend-inner-icon="mdi-barcode-scan"
        append-inner-icon="mdi-keyboard-return"
        variant="outlined"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        hide-details="auto"
        clearable
        @click:append-inner="submitScannerInput"
      />
    </form>
  </div>
</template>
