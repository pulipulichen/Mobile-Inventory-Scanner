# QR Code 手機盤點功能規格

本目錄負責手機端的 QR Code 圖片辨識與盤點寫入。

整體流程以 [`docs/architecture.md`](../docs/architecture.md) 為準。

第一版不做持續開啟鏡頭的即時掃描，而是以「拍照」或「讀取相片」取得圖片，再從圖片中辨識一個或多個 QR Code。

## 前端技術決策

`scan` 是 **純前端靜態 PWA**，正式環境不需要任何自建後端服務。

固定技術棧：

- Vue 3。
- Composition API + `<script setup lang="ts">`。
- TypeScript。
- Vite。
- SCSS / Sass。
- `vite-plugin-pwa`：產生 PWA manifest / Service Worker。
- `@undecaf/zbar-wasm`：在瀏覽器本機辨識 QR Code，並支援同張圖片多個 QR Code。

第一版不使用 Vue Router、Pinia、Nuxt 或大型 UI framework。

影像只在使用者裝置內處理，不把照片上傳到伺服器。

### 編譯方式

主機只需要安裝 Podman，不要求安裝 Node.js / npm。

專案根目錄提供：

```text
Containerfile.frontend
frontend.sh
```

第一次建立前端編譯 image：

```bash
./frontend.sh image
```

安裝依賴：

```bash
./frontend.sh install scan
```

開發模式：

```bash
./frontend.sh dev scan
```

預設從主機開啟：

```text
http://localhost:5173
```

正式編譯：

```bash
./frontend.sh build scan
```

輸出目錄：

```text
scan/dist/
```

`dist/` 是可直接部署到 HTTPS 靜態網站的成品，不需要 Node.js runtime。

---

## 使用流程

```text
手機開啟 scan 網頁 / PWA
    ↓
輸入 Apps Script Web App 網址
    ↓
輸入目前位置
    ↓
選擇：拍照 / 讀取相片
    ↓
瀏覽器本機辨識一個或多個 QR Code
    ↓
取得每個 QR Code 的 id 並去重
    ↓
逐筆將 id + location 傳給 Apps Script
    ↓
Apps Script 更新 Google Sheet
    ↓
畫面下方列出每筆 QR Code 與盤點結果
```

網頁中所有使用者輸入的內容都必須保存到 `localStorage`。

---

## 使用裝置

第一版主要針對：

- Android Chrome。
- iPhone Safari。
- 可安裝成 PWA 使用。

拍照透過瀏覽器檔案 / 相機輸入介面呼叫手機相機，不需要長時間保持 camera preview。

---

## PWA

至少包含：

- `manifest.webmanifest`。
- Service Worker。
- App icon。
- 可加入手機主畫面。
- Standalone 顯示模式。

PWA 快取的目的，是讓 App shell 與 QR decode 靜態資源可以再次啟動；第一版 **不代表支援離線盤點**。

Apps Script 寫入仍需要網路。

`@undecaf/zbar-wasm` 所需 WASM 資源要跟著 build 部署，不把第三方 CDN 當成必要 runtime dependency。

---

## 頁面輸入項目

### Apps Script Web App 網址

必要欄位，例如：

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec
```

需求：

- 可手動輸入或貼上。
- 保存到 `localStorage`。
- 下次開啟自動帶入。
- 呼叫失敗時顯示清楚錯誤。

### 目前位置

必要欄位，例如：

```text
主機房 A 區
倉庫 2F
辦公室 305
```

需求：

- location 不可為空。
- 保存最近使用位置到 `localStorage`。
- 提供「歷史位置下拉選單」。
- 使用者曾輸入過的位置可快速選取。
- 相同位置不要重複。
- 新位置在執行盤點後加入歷史紀錄。
- 仍可自由輸入新位置。
- 第一版可保留最近 20 筆位置。

---

## localStorage

key 統一使用 `mis.scan.*` prefix。

至少保存：

```text
mis.scan.apps_script_url
mis.scan.location
mis.scan.location_history
```

原則：

- 重新整理後保留。
- 關閉再開啟 PWA 後保留。
- 可清除歷史位置。
- 可清除所有設定。

掃描結果是否跨重新整理保存，第一版不是必要條件。

---

## 主要操作按鈕

第一版只有兩個主要影像來源按鈕：

- `拍照`
- `讀取相片`

### 拍照

可使用：

```html
<input type="file" accept="image/*" capture="environment">
```

需求：

- 優先使用後鏡頭。
- 拍照完成後立即辨識。
- 不做即時掃描 camera preview。

### 讀取相片

需求：

- 開啟手機照片 / 檔案選擇器。
- 第一版一次處理一張圖片。
- 選取後立即辨識。

---

## QR Code 圖片辨識

使用 `@undecaf/zbar-wasm` 對圖片轉成的 `ImageData` 進行本機辨識。

需求：

- 一次取得圖片中所有可辨識 QR Code，不可只取第一個。
- 只接受 QR Code 類型作為盤點 ID；若 library 同時辨識到其他 barcode，可忽略非 QR Code。
- QR Code payload 直接視為 `id`。
- 去除 ID 前後空白。
- 不修改大小寫。
- ID 保持字串型態。
- 同張圖片相同 ID 只送出一次。
- 圖片不離開瀏覽器。

例如辨識出：

```text
A01
B03
C04
```

就需要處理三筆盤點。

若沒有 QR Code：

```text
此圖片中沒有辨識到 QR Code
```

---

## Apps Script 呼叫

每個唯一 ID 各送出一次請求，語意資料為：

```json
{
  "id": "A01",
  "location": "主機房 A 區"
}
```

實際 HTTP transport 由 `src/services/` 封裝，必須能由瀏覽器直接呼叫 Apps Script，不建立自建 proxy server。

第一版建議逐筆或低併發處理，讓 UI 可明確對應每一筆狀態。

Apps Script 回傳格式依 [`google_sheet/README.md`](../google_sheet/README.md) 定義。

成功範例：

```json
{
  "success": true,
  "id": "A01",
  "checked_time": "2026-08-29 17:10:00",
  "location": "主機房 A 區",
  "message": "盤點成功"
}
```

失敗範例：

```json
{
  "success": false,
  "id": "A99",
  "error": "ID_NOT_FOUND",
  "message": "找不到 ID: A99"
}
```

---

## 掃描結果列表

每筆至少顯示：

- ID。
- 等待送出 / 寫入中 / 成功 / 失敗。
- Apps Script 回傳訊息。
- 成功時顯示 `checked_time`。
- 成功時顯示 `location`。

同一張圖片即使部分 ID 失敗，也必須繼續處理其他 ID。

全部完成後顯示本次統計，例如：

```text
成功 5 / 失敗 1
```

---

## 建議元件 / 程式分層

```text
src/
├── components/
│   ├── ScanSettings.vue
│   ├── ImageSourceButtons.vue
│   └── ScanResultList.vue
├── composables/
│   ├── useScanSettings.ts
│   └── useScanSession.ts
├── services/
│   ├── apps_script.ts
│   └── qr_decoder.ts
├── styles/
├── types/
├── utils/
├── App.vue
└── main.ts
```

Component 不直接散落 Apps Script `fetch()` 或 QR library 操作；統一透過 service / composable。

---

## 錯誤處理

至少處理：

- 未設定 Apps Script URL：`請先輸入 Apps Script 網址`。
- 未輸入位置：`請先輸入目前位置`。
- 圖片無 QR Code：`此圖片中沒有辨識到 QR Code`。
- 圖片讀取失敗：`無法讀取相片，請重新選擇`。
- Apps Script 無法連線：`無法連線到盤點服務`。
- ID 不存在：直接顯示 Apps Script 回傳訊息。
- 多筆中的單筆失敗：不得中止其他 ID。

---

## 隱私與權限

只使用必要功能：

- 相機：使用者按「拍照」時由瀏覽器呼叫。
- 圖片：使用者主動按「讀取相片」時選取。

不需要：

- GPS。
- 麥克風。
- 聯絡人。
- 背景持續使用相機。

---

## 第一版完成條件

- [ ] Vue 3 + TypeScript + Vite + SCSS 專案可用 Podman build。
- [ ] `./frontend.sh build scan` 成功產生 `scan/dist/`。
- [ ] 手機可開啟 HTTPS 網頁。
- [ ] 可安裝成 PWA。
- [ ] 可輸入並保存 Apps Script Web App URL。
- [ ] 可輸入並保存目前位置。
- [ ] 有歷史位置下拉選單。
- [ ] 可按「拍照」取得新照片。
- [ ] 可按「讀取相片」選擇既有圖片。
- [ ] 可從一張圖片辨識多個 QR Code。
- [ ] QR decode 全部在本機瀏覽器完成。
- [ ] 同張圖片的重複 ID 不重複送出。
- [ ] 每個 ID 都帶 location 呼叫 Apps Script。
- [ ] 可顯示每個 ID 的等待 / 寫入中 / 成功 / 失敗狀態。
- [ ] 單筆失敗不影響其他 QR Code。

## 第一版不做

- 持續開啟相機的即時 QR Code scanner。
- GPS 自動取得位置。
- 離線盤點 queue。
- 手動輸入 ID。
- 修改 Google Sheet 資料結構。
- 在手機端決定正式 `checked_time`。
- 自建後端 / CORS proxy。
