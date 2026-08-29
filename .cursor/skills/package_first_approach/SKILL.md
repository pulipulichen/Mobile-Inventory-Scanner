---
name: package-first-approach
description: >-
  Prefer existing npm packages and browser APIs used by the scan/print Vue
  applications before writing custom functionality. Use when adding a
  component, QR feature, PWA behavior, API integration, or when the user
  mentions 套件、元件、輪子、自己寫、third-party、library、plugin.
---

# 套件優先（Package-first）

本 Skill 僅適用於 `scan/` 與 `print/`。新增功能前，**先確認既有依賴與瀏覽器原生 API**，最後才考慮引入新套件或自行實作。順序固定：

1. **目前 App 已安裝的 npm 依賴**
2. **Vue 3、Composition API 與瀏覽器原生 API**
3. **專注且成熟的 npm 套件**（授權相容、可由 Vite 打包）
4. **自行實作**（前三項都不可行時，並說明取捨與原因）

`scan/` 與 `print/` 是純靜態 Vite App。套件必須透過各 App 的
`package.json`／`package-lock.json` 管理，並在 build 時由 Vite 打包；
正式執行時不可依賴 Node.js runtime、自建 API server 或執行期 CDN
下載。主機上的 Node.js／npm 不是必要條件，請透過根目錄的
`frontend_dev.sh`／`frontend_build.sh` 執行開發與正式編譯；單一 App
npm 維護命令仍使用 `frontend.sh`。

## 先查這張表：規格已指定的功能不要重寫

| 需求 | 優先使用 | 所屬 App／備註 |
| --- | --- | --- |
| QR Code 解碼 | `@undecaf/zbar-wasm` | `scan/`；在瀏覽器本機處理 `ImageData`，一次支援多個 barcode |
| PWA manifest／Service Worker | `vite-plugin-pwa` | `scan/`；只快取 App shell 與靜態資源 |
| QR Code 產生 | `qrcode` | `print/`；預覽輸出 SVG，PDF 使用 QR matrix 產生向量模組 |
| UI 元件與互動 | `vuetify` + `vite-plugin-vuetify` | `scan/`、`print/`；共用 Vuetify 4.x，Vite 編譯時按需載入 |
| 版面與元件樣式 | SCSS 與 component scoped styles | `src/styles/` 或元件內 `<style scoped lang="scss">` |
| 圖片取得 | `<input type="file" accept="image/*">` | `scan/`；拍照入口使用 `capture="environment"` |
| Google Sheet 讀取 | Google Sheet CSV export + `fetch` | `print/`；集中在 `src/services/` |
| HTTP 請求 | 瀏覽器 `fetch` | `src/services/`；不建立 CORS proxy |
| 設定保存 | 集中的 localStorage wrapper／composable | 使用 `mis.scan.*` 或 `mis.print.*` prefix |
| QR Code PDF 產生 | `qrcode` + `pdf-lib` | `print/`；在瀏覽器本機產生向量 PDF |

## 該做

- 動手前先檢查對應 App 的 `package.json`、`src/services/`、`src/composables/`
  與 `src/utils/`，確認功能是否已存在。
- 使用套件的**原生 API**，自己只補「專案特有的行為」薄薄一層封裝；
  API 回傳資料仍要在 service 邊界做基本驗證與錯誤轉換。
- 新增 npm 套件前，先確認是否真的能減少複雜度、授權相容，且能被 Vite
  打包進正式靜態資源。使用 `./frontend.sh npm <scan|print> install <package>`
  安裝，讓 lockfile 與 package manifest 同步更新。
- QR 解碼的 WASM 必須跟著 Vite build 部署，不依賴第三方 CDN。
- 需要自行寫 UI 時，使用 Vue component、TypeScript 與 SCSS；避免直接在
  component 內散落 `fetch()`、localStorage 或 QR 解碼邏輯。
- UI framework 已定案為 Vuetify 4.x；不要再引入第二套 UI framework。
  小型專案特有介面仍使用 Vue component 或 composable 補足。
- 修改 `scan/` 或 `print/` 後，至少執行 `./frontend_build.sh` 確認兩個 App
  都可以成功打包。

## 不該做

```text
❌ 把 server-side template 或其他後端框架的做法帶進純 Vue 靜態 App
❌ 為了一個小效果引入第二套 UI framework 或 router／state framework
❌ 用 `<script src="https://cdn.jsdelivr.net/...">` 讓正式功能依賴執行期 CDN
❌ 在 component 內直接散落 `fetch()`、localStorage 或 QR 解碼程式碼
❌ 直接假設 Google API 或 Apps Script 回傳資料永遠符合型別
❌ 將 Google Client Secret、service account key 或其他私人憑證放入前端
❌ 為了避免安裝套件而複製第三方原始碼進 `src/` 修改
```

## 判斷流程

```text
要新增一項前端功能
  → 對應 App 已有依賴或 service 嗎？ 有 → 直接使用，只寫薄封裝
  → Vue 3／瀏覽器原生 API 足夠嗎？ 有 → 使用原生能力
  → 有專注且成熟的 npm 套件嗎？ 有 → 確認授權 + 可由 Vite 打包 → 引入
  → 都沒有                     → 才自行實作，並說明原因
```
