(() => {
  const els = {};
  let inventory = [];

  document.addEventListener("DOMContentLoaded", () => {
    els.signIn = document.querySelector("#sign-in");
    els.load = document.querySelector("#load-data");
    els.size = document.querySelector("#qr-size");
    els.sizeValue = document.querySelector("#qr-size-value");
    els.labels = document.querySelector("#labels");
    els.status = document.querySelector("#status");
    els.pdf = document.querySelector("#download-pdf");
    els.print = document.querySelector("#print-page");

    els.signIn.addEventListener("click", signIn);
    els.load.addEventListener("click", loadData);
    els.size.addEventListener("input", () => {
      els.sizeValue.textContent = `${els.size.value} mm`;
      renderLabels();
    });
    els.pdf.addEventListener("click", downloadPdf);
    els.print.addEventListener("click", () => window.print());
    registerServiceWorker();
  });

  async function signIn() {
    setStatus("正在登入 Google…");
    try {
      await GoogleSheetInventory.signIn();
      els.load.disabled = false;
      setStatus("Google 登入成功。可以讀取盤點資料。", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function loadData() {
    setStatus("正在讀取 Google Sheet…");
    els.load.disabled = true;
    try {
      inventory = await GoogleSheetInventory.readInventory();
      await renderLabels();
      els.pdf.disabled = inventory.length === 0;
      els.print.disabled = inventory.length === 0;
      setStatus(`已載入 ${inventory.length} 筆 ID。`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      els.load.disabled = false;
    }
  }

  async function renderLabels() {
    const sizeMm = Number(els.size.value || 35);
    document.documentElement.style.setProperty("--qr-size", `${sizeMm}mm`);
    els.labels.innerHTML = "";

    for (const item of inventory) {
      const label = document.createElement("div");
      label.className = "qr-label";

      const canvas = document.createElement("canvas");
      canvas.className = "qr-canvas";
      const id = document.createElement("div");
      id.className = "qr-id";
      id.textContent = item.id;

      label.append(canvas, id);
      els.labels.append(label);

      await QRCode.toCanvas(canvas, item.id, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: Math.max(180, Math.round(sizeMm * 10))
      });
    }
  }

  async function downloadPdf() {
    if (!inventory.length) return;
    setStatus("正在產生 PDF…");
    els.pdf.disabled = true;
    try {
      const options = {
        margin: [5, 5, 5, 5],
        filename: `inventory-qrcode-${GoogleSheetInventory.formatCheckedTime(new Date())}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };
      await html2pdf().set(options).from(els.labels).save();
      setStatus("PDF 已產生。", "success");
    } catch (error) {
      setStatus(`PDF 產生失敗：${error.message}`, "error");
    } finally {
      els.pdf.disabled = false;
    }
  }

  function setStatus(message, type = "") {
    els.status.textContent = message;
    els.status.dataset.type = type;
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
