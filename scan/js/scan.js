(() => {
  const els = {};
  let qrScanner = null;
  let scanning = false;
  let busy = false;
  let lastId = null;
  let lastScanAt = 0;

  document.addEventListener("DOMContentLoaded", () => {
    els.signIn = document.querySelector("#sign-in");
    els.location = document.querySelector("#location");
    els.start = document.querySelector("#start-camera");
    els.stop = document.querySelector("#stop-camera");
    els.photo = document.querySelector("#photo-input");
    els.photoButton = document.querySelector("#photo-button");
    els.reader = document.querySelector("#reader");
    els.status = document.querySelector("#status");
    els.lastResult = document.querySelector("#last-result");

    els.location.value = localStorage.getItem("inventory.location") || "";
    els.location.addEventListener("input", () => localStorage.setItem("inventory.location", els.location.value));
    els.signIn.addEventListener("click", signIn);
    els.start.addEventListener("click", startCamera);
    els.stop.addEventListener("click", stopCamera);
    els.photoButton.addEventListener("click", () => els.photo.click());
    els.photo.addEventListener("change", scanPhoto);

    registerServiceWorker();
  });

  async function signIn() {
    setStatus("正在登入 Google…");
    try {
      await GoogleSheetInventory.signIn();
      els.start.disabled = false;
      els.photoButton.disabled = false;
      setStatus("Google 登入成功。請輸入目前位置，再開始掃描。", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  function validateLocation() {
    const location = els.location.value.trim();
    if (!location) {
      setStatus("請先輸入目前位置。", "error");
      els.location.focus();
      return null;
    }
    return location;
  }

  async function startCamera() {
    if (!validateLocation()) return;
    if (!GoogleSheetInventory.isSignedIn()) {
      setStatus("請先登入 Google。", "error");
      return;
    }
    if (scanning) return;

    setStatus("正在啟動相機…");
    try {
      qrScanner = qrScanner || new Html5Qrcode("reader");
      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return { width: edge, height: edge };
          },
          aspectRatio: 1
        },
        onDecoded,
        () => {}
      );
      scanning = true;
      els.start.disabled = true;
      els.stop.disabled = false;
      setStatus("相機已啟動。將 QR Code 對準框線。", "success");
    } catch (error) {
      setStatus(`無法啟動相機：${error.message || error}`, "error");
    }
  }

  async function stopCamera() {
    if (!qrScanner || !scanning) return;
    try {
      await qrScanner.stop();
      scanning = false;
      els.start.disabled = false;
      els.stop.disabled = true;
      setStatus("相機已停止。 ");
    } catch (error) {
      setStatus(`停止相機失敗：${error.message || error}`, "error");
    }
  }

  async function scanPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!validateLocation()) return;
    if (!GoogleSheetInventory.isSignedIn()) {
      setStatus("請先登入 Google。", "error");
      return;
    }

    setStatus("正在辨識照片中的 QR Code…");
    try {
      const fileScanner = new Html5Qrcode("reader-file");
      const decodedText = await fileScanner.scanFile(file, false);
      await onDecoded(decodedText, null, true);
      try { await fileScanner.clear(); } catch (_) {}
    } catch (error) {
      setStatus(`照片中找不到可辨識的 QR Code：${error.message || error}`, "error");
    }
  }

  async function onDecoded(decodedText, _decodedResult, fromPhoto = false) {
    const id = String(decodedText || "").trim();
    if (!id || busy) return;

    const now = Date.now();
    if (!fromPhoto && id === lastId && now - lastScanAt < 3000) return;
    lastId = id;
    lastScanAt = now;

    const location = validateLocation();
    if (!location) return;

    busy = true;
    setStatus(`讀到 ${id}，正在回寫 Google Sheet…`);
    try {
      const result = await GoogleSheetInventory.updateInventoryCheck(id, location);
      setStatus(`盤點成功：${result.id}`, "success");
      els.lastResult.innerHTML = `
        <strong>${escapeHtml(result.id)}</strong>
        <span>${escapeHtml(result.checkedTime)}</span>
        <span>${escapeHtml(result.location)}</span>
      `;
      if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    } catch (error) {
      setStatus(error.message, "error");
      if (navigator.vibrate) navigator.vibrate(250);
    } finally {
      busy = false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[char]);
  }

  function setStatus(message, type = "") {
    els.status.textContent = message;
    els.status.dataset.type = type;
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
