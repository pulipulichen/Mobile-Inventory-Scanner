# QR Code 列印功能規格

本目錄負責從 Google Sheet 讀取盤點項目，產生 QR Code 列印報表，並讓使用者透過瀏覽器列印或輸出 PDF。

整體流程以 [`docs/architecture.md`](../docs/architecture.md) 為準。

## 前端技術決策

`print` 是 **純前端靜態網頁**，正式環境不需要任何自建後端服務。

固定技術棧：

- Vue 3。
- Composition API + `<script setup lang="ts">`。
- TypeScript。
- Vite。
- SCSS / Sass。
- npm `qrcode`：在瀏覽器產生 QR Code，列印時使用 SVG。
- Google Identity Services：Google OAuth 登入。
- Google Sheets API：直接從瀏覽器讀取使用者有權限的 Sheet。

第一版不使用 Vue Router、Pinia、Nuxt、大型 UI framework 或自建 PDF renderer。

### 編譯方式

主機只需要安裝 Podman，不要求安裝 Node.js / npm。

專案根目錄提供：

```text
Containerfile.frontend
frontend.sh
```

第一次建立編譯 image：

```bash
./frontend.sh image
```

安裝依賴：

```bash
./frontend.sh install print
```

開發模式：

```bash
./frontend.sh dev print
```

預設從主機開啟：

```text
http://localhost:5174
```

正式編譯：

```bash
./frontend.sh build print
```

輸出目錄：

```text
print/dist/
```

`dist/` 可直接部署成靜態網站，不需要 Node.js runtime。

---

## 使用流程

```text
開啟 print 網頁
    ↓
輸入 Google Sheet 網址
    ↓
Google OAuth 登入
    ↓
Google Sheets API 讀取 id 欄
    ↓
設定列印參數
    ↓
前端產生 SVG QR Code 報表預覽
    ↓
window.print()
    ↓
瀏覽器列印 / 另存 PDF
```

所有使用者輸入或調整內容，都要保存到 `localStorage`。

---

## Google OAuth 設定

列印頁使用 Google Identity Services 取得 OAuth access token，再由瀏覽器呼叫 Google Sheets API。

前端 build-time 設定使用：

```text
VITE_GOOGLE_CLIENT_ID
```

開發機可放在：

```text
print/.env.local
```

例如：

```dotenv
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

注意：

- OAuth Client ID 是前端公開識別值，可以進入 bundle。
- **不可使用 Client Secret。**
- 不可放 service account private key。
- `.env.local` 不 commit。
- 正式網域與 localhost 必須依 Google OAuth 設定加入允許的 JavaScript origin。

---

## 資料來源

使用者輸入完整 Google Sheet 網址，例如：

```text
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit
```

前端解析 Spreadsheet ID。

第一版欄位：

```text
id | checked_time | location
```

列印功能只需要讀取 `id`。

### Google Sheet 權限

- Google Sheet 不要求公開分享。
- 使用者在列印頁登入 Google 帳號。
- 登入帳號只要有該 Sheet 讀取權限即可。
- 不建立自建後端代讀 Sheet。
- 前端不保存 access token 到長期 localStorage；token 只保留在必要的 session / memory 範圍。

---

## QR Code 內容與產生方式

每一筆有效 `id` 產生一張 QR Code。

payload 只放 ID 本身，例如：

```text
A01
```

不可加入：

- Google Sheet URL。
- Apps Script URL。
- JSON。
- `checked_time`。
- `location`。
- 額外前綴 / 後綴。

QR Code 下方顯示同一筆 ID 的可讀文字。

使用 npm `qrcode` 套件在瀏覽器產生 SVG；不要用低解析度 canvas / PNG 再以 CSS 放大列印。

---

## 頁面輸入項目

### Google Sheet 網址

必要欄位。

需求：

- 驗證 Google Sheet URL。
- 解析 Spreadsheet ID。
- 保存到 `localStorage`。
- 下次開啟自動帶入。
- 提供「重新讀取」。

### 列印參數

第一版至少提供：

- QR Code 尺寸。
- ID 文字大小。
- QR Code 與 ID 文字間距。
- 標籤間距。
- 頁面邊界。
- 紙張方向：直向 / 橫向。

預設紙張 A4。

所有參數：

- 修改後立即更新預覽，或提供明確「更新預覽」。
- 保存到 `localStorage`。
- 下次開啟自動套用。

QR Code 實體尺寸使用 `mm`，例如預設：

```text
30 mm × 30 mm
```

ID 字體可使用 `pt`。

---

## localStorage

key 統一使用 `mis.print.*` prefix。

至少保存：

```text
mis.print.google_sheet_url
mis.print.qr_size_mm
mis.print.id_font_size_pt
mis.print.qr_text_gap_mm
mis.print.label_gap_mm
mis.print.page_margin_mm
mis.print.orientation
```

OAuth access token 不視為一般偏好設定，不應長期寫入 localStorage。

可提供「重設為預設值」清除本頁設定。

---

## ID 資料處理

從 Google Sheets API 讀取後：

- 第一列視為 header。
- 依欄位名稱找 `id`，不要硬綁固定欄號。
- 忽略空白 ID。
- ID 保持字串型態。
- 保留 Sheet 原始順序。
- 若有重複 ID，提示使用者，不直接產生容易混淆的列印結果。

載入成功後顯示：

- Google Sheet 名稱或 Spreadsheet ID。
- 有效 ID 總數。
- 資料錯誤數量，例如空白或重複 ID。

讀取失敗時清除 / 標記舊資料，不能讓使用者誤以為舊資料是本次結果。

---

## 報表預覽

頁面顯示接近實際列印結果的 A4 預覽。

每個標籤：

```text
┌───────────────┐
│               │
│    QR CODE    │
│               │
│      A01      │
└───────────────┘
```

需求：

- QR Code 與 ID 保持同一標籤。
- 標籤不可被分頁切開。
- 自動依尺寸計算每列數量。
- 自動換列 / 換頁。
- 多頁顯示清楚頁面分隔。
- 預覽與 `@media print` 使用相同尺寸變數，避免畫面與列印規格各算一套。

---

## 列印與 PDF

第一版只使用瀏覽器原生列印：

```ts
window.print()
```

使用者可以：

- 直接列印實體印表機。
- 由 Chrome / Edge / Safari 列印介面另存 PDF。

`@media print` 必須：

- 隱藏設定面板。
- 隱藏按鈕與非報表 UI。
- 只輸出 QR Code 報表。
- 保持 QR Code 實際 mm 尺寸。
- 避免標籤被 page break 切開。

第一版不引入 jsPDF、PDFKit 等 PDF renderer。

---

## QR Code 品質

- 使用 SVG。
- 保留足夠 quiet zone。
- 黑白對比清楚。
- 不使用 bitmap CSS 放大。
- 產出的紙本必須能被 `scan` 可靠辨識。

---

## 建議元件 / 程式分層

```text
src/
├── components/
│   ├── GoogleSheetSource.vue
│   ├── PrintSettings.vue
│   ├── PrintPreview.vue
│   └── QrLabel.vue
├── composables/
│   ├── usePrintSettings.ts
│   └── useGoogleAuth.ts
├── services/
│   ├── google_auth.ts
│   ├── google_sheets.ts
│   └── qr_generator.ts
├── styles/
│   ├── main.scss
│   └── print.scss
├── types/
├── utils/
├── App.vue
└── main.ts
```

Component 不直接散落 OAuth、Sheets API 或 QR library 操作；統一透過 service / composable。

---

## 錯誤處理

至少處理：

- Google Sheet URL 格式錯誤。
- 尚未登入 Google。
- OAuth 設定錯誤。
- 登入帳號沒有 Sheet 權限。
- Google API 無法連線。
- 找不到 `id` 欄位。
- Sheet 沒有有效 ID。
- 出現重複 ID。
- QR Code 產生失敗。

---

## 第一版完成條件

- [ ] Vue 3 + TypeScript + Vite + SCSS 專案可用 Podman build。
- [ ] `./frontend.sh build print` 成功產生 `print/dist/`。
- [ ] 可輸入並保存 Google Sheet URL。
- [ ] 可從 URL 解析 Spreadsheet ID。
- [ ] 可透過 Google Identity Services 登入。
- [ ] 可由瀏覽器直接用 Google Sheets API 讀取有權限的 Sheet。
- [ ] 不需要 Sheet 公開分享。
- [ ] 可從 `id` 欄取得所有有效 ID。
- [ ] 每個 ID 產生 SVG QR Code。
- [ ] QR Code 下方顯示 ID。
- [ ] 可設定 QR Code 實體尺寸與基本列印參數。
- [ ] 所有列印偏好保存到 `localStorage`。
- [ ] A4 自動排列與分頁。
- [ ] 可預覽。
- [ ] `window.print()` 可列印。
- [ ] 可由瀏覽器另存 PDF。

## 第一版不做

- 透過 Apps Script 產生 QR Code。
- 寫入 `checked_time` 或 `location`。
- 手機掃描功能。
- 自訂任意紙張規格。
- 複雜標籤模板設計器。
- 自建後端。
- 自建 PDF renderer。
