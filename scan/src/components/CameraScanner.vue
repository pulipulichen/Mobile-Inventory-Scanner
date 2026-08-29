<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  videoLabel: string;
}>();

const emit = defineEmits<{
  detected: [ids: string[]];
  status: ["starting" | "active" | "stopped" | "error", string?];
}>();

const video = ref<HTMLVideoElement | null>(null);
const canvas = document.createElement("canvas");
let stream: MediaStream | null = null;
let frameRequest = 0;
let lastFrameAt = 0;
let isDecoding = false;
let isScanning = false;
let lastDecodeErrorAt = 0;
let decoderPromise: Promise<typeof import("../services/qr_decoder")> | null =
  null;

function loadDecoder(): Promise<typeof import("../services/qr_decoder")> {
  decoderPromise ??= import("../services/qr_decoder");
  return decoderPromise;
}

function stopTracks(): void {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video.value) {
    video.value.pause();
    video.value.srcObject = null;
  }
}

function scheduleFrame(): void {
  frameRequest = window.requestAnimationFrame(processFrame);
}

async function processFrame(timestamp: number): Promise<void> {
  if (!isScanning) return;

  if (
    timestamp - lastFrameAt >= 350 &&
    !isDecoding &&
    video.value &&
    video.value.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    lastFrameAt = timestamp;
    isDecoding = true;
    try {
      const currentVideo = video.value;
      canvas.width = currentVideo.videoWidth;
      canvas.height = currentVideo.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context || !canvas.width || !canvas.height) {
        throw new Error("CAMERA_FRAME_UNAVAILABLE");
      }
      context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
      const { decodeQrImageData } = await loadDecoder();
      const ids = await decodeQrImageData(
        context.getImageData(0, 0, canvas.width, canvas.height),
      );
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

  if (isScanning) scheduleFrame();
}

async function start(): Promise<void> {
  if (isScanning) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    emit("status", "error", "CAMERA_UNAVAILABLE");
    return;
  }

  emit("status", "starting");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });
    if (!video.value) {
      stopTracks();
      emit("status", "error", "CAMERA_UNAVAILABLE");
      return;
    }
    video.value.srcObject = stream;
    await video.value.play();
    isScanning = true;
    lastFrameAt = 0;
    emit("status", "active");
    scheduleFrame();
  } catch {
    stopTracks();
    emit("status", "error", "CAMERA_PERMISSION_DENIED");
  }
}

function stop(): void {
  isScanning = false;
  window.cancelAnimationFrame(frameRequest);
  stopTracks();
  emit("status", "stopped");
}

defineExpose({ start, stop });

onBeforeUnmount(stop);
</script>

<template>
  <div class="camera-preview" :aria-label="props.videoLabel">
    <video
      ref="video"
      class="camera-video"
      autoplay
      muted
      playsinline
      :aria-label="props.videoLabel"
    />
    <p class="camera-frame-hint">{{ props.videoLabel }}</p>
  </div>
</template>
