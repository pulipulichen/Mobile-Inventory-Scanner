export interface FocusPoint {
  x: number;
  y: number;
}

interface LiveCameraCapabilities {
  focusMode?: string[];
  exposureMode?: string[];
  pointsOfInterest?: unknown;
  zoom?: { min: number; max: number; step?: number };
}

interface AdvancedTrackConstraint {
  focusMode?: string;
  exposureMode?: string;
  pointsOfInterest?: FocusPoint[];
  zoom?: number;
}

const LIVE_SCAN_MAX_DIMENSION = 960;
const LIVE_SCAN_CROP_RATIO = 0.55;
const LIVE_SCAN_CROP_MAX_DIMENSION = 720;
const LIVE_SCAN_BAND_HEIGHT_RATIO = 0.4;
const LIVE_SCAN_BAND_MAX_WIDTH = 1280;

function readCapabilities(track: MediaStreamTrack): LiveCameraCapabilities {
  try {
    return (track.getCapabilities?.() ?? {}) as LiveCameraCapabilities;
  } catch {
    return {};
  }
}

async function applyAdvancedConstraints(
  track: MediaStreamTrack,
  constraints: AdvancedTrackConstraint[],
): Promise<boolean> {
  if (!constraints.length) return false;
  try {
    await track.applyConstraints({
      advanced: constraints as unknown as MediaTrackConstraintSet[],
    });
    return true;
  } catch {
    return false;
  }
}

async function preferRearCamera(stream: MediaStream): Promise<MediaStream> {
  const current = stream.getVideoTracks()[0];
  if (current?.getSettings().facingMode === "environment") return stream;

  let devices: MediaDeviceInfo[] = [];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch {
    return stream;
  }

  const rearCamera = devices.find((device) => {
    if (device.kind !== "videoinput") return false;
    const label = device.label.toLowerCase();
    if (!label) return false;
    if (/front|user|facetime|selfie/.test(label)) return false;
    return /back|rear|environment|facing back/.test(label);
  });

  if (!rearCamera || rearCamera.deviceId === current?.getSettings().deviceId) {
    return stream;
  }

  try {
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: { exact: rearCamera.deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    return nextStream;
  } catch {
    return stream;
  }
}

export async function applyLiveCameraTuning(
  track: MediaStreamTrack,
): Promise<void> {
  const capabilities = readCapabilities(track);
  const constraints: AdvancedTrackConstraint[] = [];

  if (capabilities.focusMode?.includes("continuous")) {
    constraints.push({ focusMode: "continuous" });
  }
  if (capabilities.exposureMode?.includes("continuous")) {
    constraints.push({ exposureMode: "continuous" });
  }
  if (
    capabilities.zoom &&
    capabilities.zoom.min < 1 &&
    capabilities.zoom.max >= 1
  ) {
    constraints.push({ zoom: 1 });
  }

  await applyAdvancedConstraints(track, constraints);
}

export async function openRearCamera(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    {
      audio: false,
      video: { facingMode: "environment" },
    },
    {
      audio: false,
      video: true,
    },
  ];

  let stream: MediaStream | null = null;
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!stream) throw lastError instanceof Error ? lastError : new Error("CAMERA_UNAVAILABLE");

  stream = await preferRearCamera(stream);
  const track = stream.getVideoTracks()[0];
  if (track) await applyLiveCameraTuning(track);
  return stream;
}

export async function waitForVideoFrame(
  video: HTMLVideoElement,
): Promise<void> {
  video.playsInline = true;
  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error("CAMERA_FRAME_UNAVAILABLE"));
      }, 8000);

      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("CAMERA_FRAME_UNAVAILABLE"));
      };
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("error", onError);
      };

      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth) {
        onReady();
      }
    });
  }

  await video.play();
}

export function mapCoverPointToVideo(
  clientX: number,
  clientY: number,
  preview: HTMLElement,
  video: HTMLVideoElement,
): FocusPoint {
  const rect = preview.getBoundingClientRect();
  const displayWidth = Math.max(1, rect.width);
  const displayHeight = Math.max(1, rect.height);
  const videoWidth = Math.max(1, video.videoWidth);
  const videoHeight = Math.max(1, video.videoHeight);
  const displayRatio = displayWidth / displayHeight;
  const videoRatio = videoWidth / videoHeight;

  let visibleWidth = videoWidth;
  let visibleHeight = videoHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoRatio > displayRatio) {
    visibleWidth = videoHeight * displayRatio;
    offsetX = (videoWidth - visibleWidth) / 2;
  } else {
    visibleHeight = videoWidth / displayRatio;
    offsetY = (videoHeight - visibleHeight) / 2;
  }

  const displayX = Math.min(Math.max(clientX - rect.left, 0), displayWidth);
  const displayY = Math.min(Math.max(clientY - rect.top, 0), displayHeight);

  return {
    x: Math.min(
      1,
      Math.max(0, (offsetX + (displayX / displayWidth) * visibleWidth) / videoWidth),
    ),
    y: Math.min(
      1,
      Math.max(
        0,
        (offsetY + (displayY / displayHeight) * visibleHeight) / videoHeight,
      ),
    ),
  };
}

export async function focusVideoTrack(
  track: MediaStreamTrack,
  point: FocusPoint,
): Promise<boolean> {
  const capabilities = readCapabilities(track);
  const constraints: AdvancedTrackConstraint[] = [];

  if (capabilities.pointsOfInterest) {
    constraints.push({
      pointsOfInterest: [{ x: point.x, y: point.y }],
    });
  }
  if (capabilities.focusMode?.includes("single-shot")) {
    constraints.push({ focusMode: "single-shot" });
  } else if (capabilities.focusMode?.includes("continuous")) {
    constraints.push({ focusMode: "continuous" });
  }

  const applied = await applyAdvancedConstraints(track, constraints);
  if (applied && capabilities.focusMode?.includes("continuous")) {
    window.setTimeout(() => {
      void applyAdvancedConstraints(track, [{ focusMode: "continuous" }]);
    }, 900);
  }
  return applied;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("CAMERA_FRAME_UNAVAILABLE");
  return context;
}

export function captureVideoImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxDimension = LIVE_SCAN_MAX_DIMENSION,
): ImageData {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("CAMERA_FRAME_UNAVAILABLE");
  }

  const scale = Math.min(
    1,
    maxDimension / Math.max(video.videoWidth, video.videoHeight),
  );
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = getContext(canvas);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function captureVideoCenterCropImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  cropRatio = LIVE_SCAN_CROP_RATIO,
  maxDimension = LIVE_SCAN_CROP_MAX_DIMENSION,
): ImageData {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("CAMERA_FRAME_UNAVAILABLE");
  }

  const cropWidth = video.videoWidth * cropRatio;
  const cropHeight = video.videoHeight * cropRatio;
  const sourceX = (video.videoWidth - cropWidth) / 2;
  const sourceY = (video.videoHeight - cropHeight) / 2;
  const scale = Math.min(1, maxDimension / Math.max(cropWidth, cropHeight));
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const context = getContext(canvas);
  context.drawImage(
    video,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function captureVideoHorizontalBandImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heightRatio = LIVE_SCAN_BAND_HEIGHT_RATIO,
  maxWidth = LIVE_SCAN_BAND_MAX_WIDTH,
): ImageData {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("CAMERA_FRAME_UNAVAILABLE");
  }

  const bandHeight = Math.max(1, video.videoHeight * heightRatio);
  const sourceY = (video.videoHeight - bandHeight) / 2;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(bandHeight * scale));
  const context = getContext(canvas);
  context.drawImage(
    video,
    0,
    sourceY,
    video.videoWidth,
    bandHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
