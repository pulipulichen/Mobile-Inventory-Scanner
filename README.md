# Mobile-Inventory-Scanner

Mobile-first inventory scanning and QR-code label printing system with Google Sheets integration.

## 目前功能

- `web/print.html`：從 Google Sheet 讀取 `id`，批次產生 QR Code，可調整標籤大小，下載 PDF 或直接列印。
- `web/scan.html`：手機 PWA 盤點頁；手動輸入目前位置，以相機即時掃描或拍照辨識 QR Code，成功後回寫 `checked_time` 與 `location`。
- Google Sheet 預設欄位：`id`, `checked_time`, `location`。
- QR Code 內容只使用 `id`。

## 目錄

```text
web/
├── index.html
├── print.html
├── scan.html
├── manifest.webmanifest
├── sw.js
├── config/
│   └── google-sheet.js
├── css/
│   └── app.css
├── icons/
│   └── icon.svg
└── js/
    ├── google-sheet.js
    ├── print.js
    └── scan.js

docs/
└── google-sheet-setup.md
```

## 快速開始

1. 建立 Google Sheet，第一列設為：`id | checked_time | location`。
2. 編輯 `web/config/google-sheet.js`，填入 Spreadsheet ID、工作表名稱、Google OAuth Client ID。
3. 依 `docs/google-sheet-setup.md` 設定 Google Cloud OAuth 與 GitHub Pages。
4. 用 GitHub Pages 或任何 HTTPS 靜態網站提供 `web/` 目錄。
5. 電腦開 `print.html` 列印 QR Code；手機開 `scan.html` 盤點。

> 手機相機與 PWA 需要 HTTPS；`localhost` 可作為開發例外。
