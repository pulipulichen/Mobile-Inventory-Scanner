# Mobile-Inventory-Scanner

Mobile-first inventory scanning and QR-code label printing system with Google Sheets integration.

## 目前功能

- `print/`：從有權限的 Google Sheet 讀取 `id`，批次產生 QR Code 向量 PDF。
- `scan/`：手機 PWA；以即時相機、拍照或讀取相片辨識 QR Code，成功後回寫
  `checked_time` 與 `location`。
- `scan/` 可透過 Apps Script `/exec?action=pending` 列出尚未盤點的 ID，
  顯示人類可識別名稱，並依既有位置分組。
- Google Sheet 欄位：`id`, `name`, `checked_time`, `location`。
- QR Code 內容只使用 `id`。

## 目錄

```text
print/
├── index.html
├── package.json
└── src/

scan/
├── index.html
├── package.json
├── public/
└── src/

google_sheet/
├── GET_APPS_SCRIPT_URL.md
├── GET_GOOGLE_SHEET_URL.md
├── README.md
└── main.gs
```

## 快速開始

1. 建立 Google Sheet，第一列設為：`id | name | checked_time | location`。
2. 在 Google Sheet 建立 Bound Apps Script，貼上 `google_sheet/main.gs`。
3. 依 `google_sheet/GET_APPS_SCRIPT_URL.md` 部署 Web App 並取得 `/exec` URL。
4. 以 `./frontend.sh build scan` 與 `./frontend.sh build print` 建置靜態檔案。
5. 將 `scan/dist/` 與 `print/dist/` 部署到 HTTPS 靜態網站。

> 手機相機與 PWA 需要 HTTPS；`localhost` 可作為開發例外。
