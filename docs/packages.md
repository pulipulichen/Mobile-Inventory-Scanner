 # Mobile Inventory Scanner 前端套件清單

本文件記錄 `scan` 與 `print` 的前端套件選擇。兩個 App 都是由 Vite
編譯的純靜態網站；正式執行時不需要 Node.js runtime、後端 API 或執行期
CDN。

套件版本應以各 App 的 `package.json` 與 `package-lock.json` 為準。新增或
更新依賴時，必須同步更新 lockfile，並使用根目錄的 `frontend.sh` 執行
npm 命令。

## 核心 npm 套件

| 套件 | App | 用途 |
| --- | --- | --- |
| `vue` | `scan`、`print` | Vue 3 UI 與 Composition API |
| `typescript` | `scan`、`print` | 業務資料、API 回應與元件型別 |
| `vite` | `scan`、`print` | 開發伺服器與正式 bundle |
| `sass` | `scan`、`print` | SCSS / Sass 樣式編譯 |
| `qrcode` | `print` | 產生 QR Code；預覽可輸出 SVG，PDF 產生器使用 QR matrix |
| `pdf-lib` | `print` | 在瀏覽器本機產生並下載 PDF；以向量方塊繪製 QR Code |
| `@undecaf/zbar-wasm` | `scan` | 在瀏覽器本機辨識 `ImageData`，支援同一張圖片多個 barcode / QR Code |
| `vite-plugin-pwa` | `scan` | 產生 PWA manifest 與 Service Worker，快取 App shell 與靜態資源 |

`pdf-lib` 取代瀏覽器 `window.print()` 作為 PDF 產生方式。`print` 不引入
`jsPDF` 或其他第二套 PDF renderer；QR Code 的編碼仍統一由 `qrcode` 負責。

## 瀏覽器原生 API

下列功能不另引入 npm 套件：

- `<input type="file" accept="image/*" capture="environment">`：取得手機相片或拍照。
- `fetch`：由 service 呼叫 Apps Script Web App。
- `localStorage`：保存 `mis.scan.*` 與 `mis.print.*` 設定。
- `Blob`、`URL.createObjectURL`：下載 PDF 與處理本機圖片。
- Vue Composition API：管理元件狀態與互動，不引入 Pinia。

## Google 外部 API

`print` 直接使用下列瀏覽器 API，不把 Google Client Secret 或 service account
private key 放入前端：

- Google Identity Services：取得 OAuth access token。
- Google Sheets API：讀取使用者有權限的 Google Sheet。

這些服務的網址與 OAuth Client ID 是公開前端設定；access token 只保留在
必要的 session / memory 範圍，不長期保存到 localStorage。

## 不引入的套件

第一版不引入：

- Vue Router：兩個 App 都是單頁工具。
- Pinia：狀態量小，以 composable 管理即可。
- Bootstrap、Vuetify、Quasar、Element Plus：避免引入大型 UI framework。
- `googleapis`：前端直接使用 Google Sheets API，不建立 Node.js 中介層。
- `jsPDF` 或瀏覽器列印：PDF 統一由 `pdf-lib` 產生。
- QR decode CDN：`@undecaf/zbar-wasm` 的 WASM 必須隨 Vite build 部署。

## 安裝與驗證

依賴應在對應 App 目錄管理，範例：

```bash
./frontend.sh npm print install qrcode pdf-lib
./frontend.sh npm scan install @undecaf/zbar-wasm vite-plugin-pwa
```

實際加入新套件前，先確認既有依賴與瀏覽器原生 API 無法滿足需求，再記錄
用途、所屬 App 與替代方案。修改完成後至少執行：

```bash
./frontend.sh build print
./frontend.sh build scan
```
