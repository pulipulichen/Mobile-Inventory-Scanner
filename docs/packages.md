# Mobile Inventory Scanner 前端套件清單

本文件記錄 `scan` 與 `print` 的前端套件選擇。兩個 App 都是由 Vite
編譯的純靜態網站；正式執行時不需要 Node.js runtime、後端 API 或執行期
CDN。

套件版本應以各 App 的 `package.json` 與 `package-lock.json` 為準。新增或
更新依賴時，必須同步更新 lockfile，並使用根目錄的 `frontend.sh` 執行
npm 命令。

## UI framework 決策

`scan` 與 `print` 統一使用 **Vuetify 4.x** 作為 UI framework，並以
`vite-plugin-vuetify` 在 Vite 編譯時按需載入元件。

選擇 Vuetify 的原因：

- 原生支援 Vue 3、TypeScript、Vite 與 SCSS。
- 提供表單、按鈕、訊息、對話框、進度與 responsive layout 等兩個 App
  共用的 UI 基礎。
- 元件具備鍵盤操作與 ARIA 支援，可作為本專案 WCAG 2.2 AA 實作的基礎；
  仍必須遵守 `.cursor/rules/accessibility.mdc` 並完成鍵盤、螢幕閱讀器、
  200% 縮放與對比度檢查。
- Vuetify 採 MIT License，與本專案授權一致。
- 透過 Vite 打包後是純靜態資源，不增加正式環境的 Node.js 或後端需求。

Vuetify 只負責 App 操作介面。`scan` 的即時掃描使用瀏覽器
`MediaDevices.getUserMedia()`，拍照／讀取相片仍使用規格指定的原生
`<input type="file">`；`print` 的 QR label、紙張預覽實體尺寸與
`pdf-lib` PDF 繪製仍由專案自己的元件、SCSS 與 service 負責，不以 UI
framework 取代實體輸出邏輯。語系選擇器等規格指定原生元素的控制項也必須
保留原生 HTML 語意。

## 核心 npm 套件

以下連結以官方文件或套件維護者的 repository 為主。`Demo 網頁` 欄的
`—` 表示目前沒有套件維護者提供的獨立線上 Demo；建置工具的 examples
若需要本機啟動，會在連結名稱中註明。

| 套件 | App | 用途 | 參考網址 | Demo 網頁 |
| --- | --- | --- | --- | --- |
| `vue` | `scan`、`print` | Vue 3 UI 與 Composition API | [官方文件](https://vuejs.org/guide/introduction.html) | [官方 Examples](https://vuejs.org/examples/) |
| `vuetify` | `scan`、`print` | 共用 Vue 3 UI framework 與 responsive 元件 | [官方文件](https://vuetifyjs.com/en/getting-started/installation/) | [全部元件展示](https://vuetifyjs.com/en/components/all/) |
| `vite-plugin-vuetify` | `scan`、`print` | Vite 編譯時按需載入 Vuetify 元件與 tree-shaking | [GitHub README](https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin) | —（建置工具，無獨立 UI Demo） |
| `@mdi/font` | `scan`、`print` | Material Design Icons；`scan` 掃描操作與「最近使用的 Google Sheet」圖示，以及 `print`「最近使用」等 Vuetify 圖示 | [GitHub README](https://github.com/Templarian/MaterialDesign-Webfont) | [Material Design Icons](https://pictogrammers.com/library/mdi/) |
| `vue-i18n` | `scan`、`print` | Vue 3 Composition API 的多語系、插值、複數與 locale 格式化 | [Composition API 文件](https://vue-i18n.intlify.dev/guide/advanced/composition) | [官方 CodeSandbox 範例](https://codesandbox.io/s/vue-i18n-9-template-h28c0) |
| `vue-router` | `scan` | 底部功能分頁的 hash 路由，可用 `#/settings`、`#/scan`、`#/checked`、`#/pending` 切換 | [官方文件](https://router.vuejs.org/) | [官方 Examples](https://router.vuejs.org/guide/) |
| `typescript` | `scan`、`print` | 業務資料、API 回應與元件型別 | [官方 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | [TypeScript Playground](https://www.typescriptlang.org/play/) |
| `vite` | `scan`、`print` | 開發伺服器與正式 bundle | [官方文件](https://vite.dev/guide/) | [Vite 線上 Playground](https://vite.new/vue-ts) |
| `sass` | `scan`、`print` | SCSS / Sass 樣式編譯 | [官方文件](https://sass-lang.com/documentation/) | [Sass Playground](https://sass-lang.com/playground/) |
| `qrcode` | `print` | 產生 QR Code；預覽可輸出 SVG，PDF 產生器使用 QR matrix | [GitHub README](https://github.com/soldair/node-qrcode) | — |
| `pdf-lib` | `print` | 在瀏覽器本機產生並下載 PDF；以向量方塊繪製 QR Code | [官方文件](https://pdf-lib.js.org/) | [建立 PDF 的 JSFiddle](https://jsfiddle.net/Hopding/rxwsc8f5/13/) |
| `pdflib-fontkit` | `print` | 讓 `pdf-lib` 內嵌 Noto Sans TC，以便 PDF 標籤顯示繁體中文 `name` | [GitHub README](https://github.com/znacloud/pdf-fontkit) | — |
| `@undecaf/zbar-wasm` | `scan` | 在瀏覽器本機辨識 `ImageData`，支援同一張圖片多個 barcode / QR Code | [GitHub README](https://github.com/undecaf/zbar-wasm) | [官方掃描 Demo](https://undecaf.github.io/zbar-wasm/example/) |
`pdf-lib` 取代瀏覽器 `window.print()` 作為 PDF 產生方式。`print` 不引入
`jsPDF` 或其他第二套 PDF renderer；QR Code 的編碼仍統一由 `qrcode` 負責。

## 瀏覽器原生 API

下列功能不另引入 npm 套件：

- `MediaDevices.getUserMedia()`：取得後置鏡頭串流，供瀏覽器內即時掃描。
- `MediaStreamTrack.applyConstraints()`：在支援的瀏覽器啟用連續對焦，並讓預覽畫面點擊對焦。
- `BarcodeDetector`：在支援的瀏覽器補強 QR Code 辨識，結果與 `@undecaf/zbar-wasm` 合併。
- `<input type="file" accept="image/*" capture="environment">`：取得手機相片或拍照。
- `fetch`：由 service 下載 Google Sheet CSV，或呼叫 Apps Script Web App。
- `localStorage`：保存 `mis.scan.*` 與 `mis.print.*` 設定。
- `Blob`、`URL.createObjectURL`：下載 PDF 與處理本機圖片。
- Vue Composition API：管理元件狀態與互動，不引入 Pinia。

## Google 外部服務

`print` 不使用 Google OAuth、Google Identity Services 或 Google Sheets API。
前端只使用瀏覽器 `fetch` 下載 Google Sheet 的 CSV 匯出網址：

```text
https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv
```

因此 Sheet 必須能由瀏覽器直接下載 CSV；`scan` 仍透過 Google Apps Script
Web App 讀取與寫入盤點資料。

## 不引入的套件

第一版不引入：

- Vue Router（`print`）：列印工具仍是單頁，不需要路由。`scan` 已使用
  `vue-router` hash 路由切換功能分頁。
- Pinia：狀態量小，以 composable 管理即可。
- Bootstrap、PrimeVue、Quasar、Element Plus 或其他第二套 UI framework：
  UI 元件統一使用 Vuetify。
- `googleapis`：不引入 Google API client 或 Node.js 中介層；`print` 使用
  Google Sheet CSV export。
- `jsPDF` 或瀏覽器列印：PDF 統一由 `pdf-lib` 產生。
- QR decode CDN：`@undecaf/zbar-wasm` 的 WASM 必須隨 Vite build 部署。

## 安裝與驗證

依賴應在對應 App 目錄管理，範例：

```bash
./frontend.sh npm scan install vuetify
./frontend.sh npm scan install --save-dev vite-plugin-vuetify
./frontend.sh npm print install vuetify
./frontend.sh npm print install --save-dev vite-plugin-vuetify
./frontend.sh npm print install qrcode pdf-lib
./frontend.sh npm scan install @undecaf/zbar-wasm
```

實際加入新套件前，先確認既有依賴與瀏覽器原生 API 無法滿足需求，再記錄
用途、所屬 App 與替代方案。修改完成後至少執行：

```bash
./frontend_build.sh
```
