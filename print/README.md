# QR Code PDF 產生功能規格

本目錄負責從 Google Sheet 讀取盤點項目，產生 QR Code 標籤 PDF 檔案。
`print` 以電腦為主要操作環境，但必須支援平板與手機 RWD；在手機上也
可以透過頁面入口前往 `scan` 進行盤點。

共通流程以 [`docs/architecture.md`](../docs/architecture.md) 為準，套件
清單見 [`docs/packages.md`](../docs/packages.md)。Google Sheet URL 與
Apps Script URL 的取得方式見 [`google_sheet/README.md`](../google_sheet/README.md)。

## 前端技術決策

`print` 是 **純前端靜態網頁**，正式環境不需要任何自建後端服務。

固定技術棧：

- Vue 3。
- Composition API + `<script setup lang="ts">`。
- TypeScript。
- Vite。
- SCSS / Sass。
- npm `qrcode`：在瀏覽器產生 QR Code，預覽使用 SVG。
- npm `pdf-lib`：在瀏覽器本機產生可下載的 PDF，QR Code 使用向量模組。
- Google Identity Services：Google OAuth 登入。
- Google Sheets API：直接從瀏覽器讀取使用者有權限的 Sheet。
- Google Drive API：列出使用者最近開啟的 Google Sheets，供快速選取。

第一版不使用 Vue Router、Pinia、Nuxt、大型 UI framework 或自建後端。

### 編譯方式

主機只需要安裝 Podman，不要求安裝 Node.js / npm。

專案根目錄提供：

```text
Containerfile.frontend
frontend.sh
```

```bash
./frontend.sh image
./frontend.sh install print
./frontend.sh dev print
./frontend.sh build print
```

開發預設網址：`http://localhost:5174`。

正式輸出目錄：`print/dist/`，可直接部署成靜態網站，不需要 Node.js runtime。

---

## 使用流程

```mermaid
flowchart TB
    A["開啟 print"] --> B{"選擇 Google Sheet 來源"}
    B -->|"手動輸入"| C["輸入 Google Sheet URL"]
    B -->|"快速選取"| D["Google OAuth 登入"]
    D --> E["Google Drive API 顯示最近開啟的 Google Sheets"]
    E --> F["選取 Sheet，自動帶入 Google Sheet URL"]
    C --> G["Google OAuth 登入"]
    F --> G
    G --> H["Google Sheets API 讀取 id 欄與儲存格位置"]
    H --> I["檢查空白與重複 ID"]
    I -->|"有重複"| J["指出重複 ID 與 A1 儲存格位置"]
    I -->|"無重複"| K["設定 QR Code / A4 參數"]
    K --> L["產生 responsive 預覽"]
    L --> M["qrcode 產生 QR Code"]
    M --> N["pdf-lib 產生向量 PDF"]
    N --> O["下載 .pdf 檔案"]
    A -.-> S["前往 scan"]
```

所有使用者輸入或調整內容，都要保存到 `localStorage`。`print` 不更新
Google Sheet，也不呼叫 Apps Script 寫入盤點結果。

### `print` 與 `scan` 入口

頁面必須提供「前往 scan」按鈕或連結，讓使用者在平板或手機上可直接
切換到盤點 App：

- 同網域部署時使用相對路徑。
- 不同網域部署時使用 `VITE_SCAN_APP_URL`。
- 連結只負責導覽，不把 `scan` URL 編入 QR Code。

---

## Google OAuth 設定

列印頁使用 Google Identity Services 取得 OAuth access token，再由瀏覽器呼叫 Google Sheets API 與 Google Drive API。

前端 build-time 設定使用：

```text
VITE_GOOGLE_CLIENT_ID
```

開發機可放在 `print/.env.local`：

```dotenv
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

注意：

- OAuth Client ID 是前端公開識別值，可以進入 bundle。
- **不可使用 Client Secret。**
- 不可放 service account private key。
- `.env.local` 不 commit。
- 正式網域與 localhost 必須依 Google OAuth 設定加入允許的 JavaScript origin。
- OAuth scope 採最小權限；讀取 Sheet 與最近使用檔案只要求必要的唯讀權限。
- OAuth access token 不長期保存到 `localStorage`。

---

## Google Drive 最近使用的 Sheet 快速選取

Google Sheet 網址輸入欄旁必須提供明顯按鈕：

```text
從最近使用的 Google Sheet 選取
```

目的：避免使用者先切換到 Google Drive、找到檔案、複製網址，再回到 `print` 貼上。

按下按鈕後：

1. 若尚未取得 Google OAuth 權限，先執行登入 / 授權。
2. 使用 Google Drive API `files.list` 取得目前帳號可存取的檔案。
3. 只顯示 MIME type 為 `application/vnd.google-apps.spreadsheet` 的 Google Sheets。
4. 依 `viewedByMeTime desc` 排序，最近開啟的 Sheet 放最前面。
5. 第一版預設顯示最近 20 筆，可視需要提供「載入更多」。
6. 每筆至少顯示檔名與最近開啟時間；不得要求使用者辨識 Spreadsheet ID。
7. 使用者點選後，自動組成並填入該檔案的 Google Sheet URL。
8. 選取完成後立即保存至 `mis.print.google_sheet_url`，並可直接開始讀取資料。
9. 提供取消 / 關閉，不得因取消而覆寫原本已設定的 Sheet URL。

Drive 查詢概念：

```text
q: mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false
orderBy: viewedByMeTime desc
fields: nextPageToken, files(id,name,viewedByMeTime,modifiedTime,webViewLink)
```

快速選取是主要操作入口之一，但仍保留手動貼上 Google Sheet URL，避免 OAuth / Drive API 異常時完全無法使用。

---

## 資料來源

使用者可以手動輸入完整 Google Sheet 網址，或由「從最近使用的 Google Sheet 選取」自動帶入。

```text
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit
```

前端解析 Spreadsheet ID。

第一版欄位：

```text
id | checked_time | location
```

列印功能主要使用 `id`，載入時也必須保留每筆資料的實際列號，
以便指出重複 ID 位於哪些儲存格。

### Google Sheet 權限

- Google Sheet 不要求公開分享。
- 使用者在列印頁登入 Google 帳號。
- 登入帳號只要有該 Sheet 讀取權限即可。
- 不建立自建後端代讀 Sheet。
- access token 只保留在必要的 session / memory 範圍。

---

## QR Code 內容與產生方式

每一筆有效 `id` 產生一張 QR Code。payload 只放 ID 本身，例如 `A01`。

不可加入 Google Sheet URL、Apps Script URL、JSON、`checked_time`、`location` 或額外前後綴。

QR Code 下方顯示同一筆 ID 的可讀文字。使用 npm `qrcode` 套件在瀏覽器產生 SVG；不要用低解析度 canvas / PNG 再以 CSS 放大列印。

---

## 頁面輸入項目

### Google Sheet 網址

必要欄位。

需求：

- 可手動輸入 / 貼上。
- 提供「從最近使用的 Google Sheet 選取」。
- 驗證 Google Sheet URL。
- 解析 Spreadsheet ID。
- 保存到 `localStorage`。
- 下次開啟自動帶入。
- 提供「重新讀取」。

### 列印參數

第一版至少提供：QR Code 尺寸、ID 文字大小、QR Code 與 ID 文字間距、標籤間距、頁面邊界、紙張方向（直向 / 橫向）。預設紙張 A4。

所有參數修改後立即更新預覽，或提供明確「更新預覽」，並保存到 `localStorage`。

QR Code 實體尺寸使用 `mm`，例如預設 `30 mm × 30 mm`；ID 字體可使用 `pt`。

---

## localStorage

key 統一使用 `mis.print.*` prefix。

```text
mis.print.google_sheet_url
mis.print.qr_size_mm
mis.print.id_font_size_pt
mis.print.qr_text_gap_mm
mis.print.label_gap_mm
mis.print.page_margin_mm
mis.print.orientation
```

OAuth access token 不應長期寫入 localStorage。可提供「重設為預設值」清除本頁設定。

---

## ID 資料處理

- 第一列視為 header。
- 依欄位名稱找 `id`，不要硬綁固定欄號。
- 忽略空白 ID。
- ID 保持字串型態。
- 保留 Sheet 原始順序。
- 保留每筆 ID 對應的試算表列號，並換算為 A1 儲存格位置，例如 `A2`。
- 重複判定以載入後的非空 ID 字串為準；同一 ID 出現於多個資料列時，
  必須在載入報表時立即提示。
- 重複提示必須逐組列出 ID 與所有出現位置，例如：
  `A01：A2、A8、A14`。
- 重複提示必須是可讀取的文字，不可只使用顏色、標記或圖示。
- 只要存在重複 ID，就不得產生 QR Code 預覽、PDF 或直接列印結果；
  使用者修正 Google Sheet 後，重新載入才可繼續。

載入成功後顯示 Google Sheet 名稱或 Spreadsheet ID、有效 ID 總數、資料錯誤數量。
若有重複 ID，另顯示重複 ID 組數、每組 ID 與所有 A1 儲存格位置。
讀取失敗時清除 / 標記舊資料，不能讓使用者誤以為舊資料是本次結果。

---

## 報表預覽

頁面顯示接近實際列印結果的 A4 預覽。QR Code 與 ID 必須保持同一標籤，標籤不可被分頁切開，自動依尺寸計算每列數量並換列 / 換頁，多頁要有清楚分隔。

預覽與 `@media print` 使用相同尺寸變數，避免畫面與列印規格各算一套。

---

## PDF 產生

第一版由瀏覽器本機使用 `pdf-lib` 產生 PDF，不使用 `window.print()`、瀏覽
器列印對話框或自建後端。

PDF 產生器必須：

- 使用 A4 實體尺寸與 `mm` / `pt` 轉換。
- 依預覽使用的同一組版面參數計算欄列、間距與換頁。
- 以 `qrcode` 的 QR matrix 繪製向量模組，保留足夠 quiet zone。
- 在 QR Code 下方繪製相同的 ID 文字。
- 確保每個標籤完整位於單一頁面內。
- 產生 `Blob` 後提供 `.pdf` 下載。

輸出的 PDF 是可儲存、分享或交給實體印表機的檔案；`print` 不直接呼叫
印表機，也不依賴瀏覽器的 PDF 另存功能。

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
│   ├── RecentGoogleSheetsPicker.vue
│   ├── PrintSettings.vue
│   ├── PrintPreview.vue
│   └── QrLabel.vue
├── composables/
│   ├── usePrintSettings.ts
│   └── useGoogleAuth.ts
├── services/
│   ├── google_auth.ts
│   ├── google_drive.ts
│   ├── google_sheets.ts
│   ├── qr_generator.ts
│   └── pdf_generator.ts
├── styles/
│   ├── main.scss
│   └── print.scss
├── types/
├── utils/
├── App.vue
└── main.ts
```

Component 不直接散落 OAuth、Drive API、Sheets API 或 QR library 操作；統一透過 service / composable。

---

## 錯誤處理

至少處理：

- Google Sheet URL 格式錯誤。
- 尚未登入 Google。
- OAuth 設定錯誤。
- Drive 最近檔案讀取失敗。
- 最近沒有可用的 Google Sheet。
- 登入帳號沒有 Sheet 權限。
- Google API 無法連線。
- 找不到 `id` 欄位。
- Sheet 沒有有效 ID。
- 出現重複 ID。
- QR Code 產生失敗。
- PDF 產生或下載失敗。

---

## 第一版完成條件

- [ ] Vue 3 + TypeScript + Vite + SCSS 專案可用 Podman build。
- [ ] `./frontend.sh build print` 成功產生 `print/dist/`。
- [ ] 可手動輸入並保存 Google Sheet URL。
- [ ] 有「從最近使用的 Google Sheet 選取」按鈕。
- [ ] 可透過 Google Drive API 顯示最近開啟的 Google Sheets。
- [ ] 最近使用清單依 `viewedByMeTime` 由新到舊排序。
- [ ] 選取 Sheet 後可自動帶入 URL 並保存。
- [ ] 可從 URL 解析 Spreadsheet ID。
- [ ] 可透過 Google Identity Services 登入。
- [ ] 可由瀏覽器直接用 Google Sheets API 讀取有權限的 Sheet。
- [ ] 不需要 Sheet 公開分享。
- [ ] 可從 `id` 欄取得所有有效 ID。
- [ ] 載入時可找出重複 ID，並指出每個重複 ID 所在的 A1 儲存格位置。
- [ ] 有重複 ID 時不產生 QR Code 預覽、PDF 或直接列印結果。
- [ ] 每個 ID 產生 SVG QR Code並顯示 ID。
- [ ] 可設定 QR Code 實體尺寸與基本列印參數。
- [ ] 所有列印偏好保存到 `localStorage`。
- [ ] A4 自動排列與分頁。
- [ ] 可預覽。
- [ ] 使用 `pdf-lib` 產生向量 QR Code PDF。
- [ ] 可下載產生的 PDF 檔案。
- [ ] 提供前往 `scan` 的入口。

## 第一版不做

- 透過 Apps Script 產生 QR Code。
- 寫入 `checked_time` 或 `location`。
- 手機掃描功能。
- 自訂任意紙張規格。
- 複雜標籤模板設計器。
- 自建後端。
- 直接控制實體印表機。
