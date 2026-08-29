# Mobile Inventory Scanner 專案角色

本文件定義目前專案中各角色的名稱與責任。為避免把開發用主機與正式執行
環境混在一起，本文統一將主機稱為「開發環境」。

## 角色總覽

### 開發環境

開發環境是開發者使用的主機與 Podman 環境，負責：

- 保存專案原始碼。
- 透過 `Containerfile.frontend` 建立前端編譯環境。
- 使用 `frontend_dev.sh` 啟動開發伺服器，使用 `frontend_build.sh` 產生正式
  靜態檔案；`frontend.sh` 保留給進階的單一 App npm 操作。
- 產生 `print/dist/` 與 `scan/dist/`，交給靜態網站服務使用。

開發環境不是正式盤點資料庫，也不是使用者執行盤點的必要後端。主機不需要
直接安裝 Node.js / npm；Node.js 與 npm 只在 Podman 編譯容器內使用。

### 開發者

開發者在開發環境中修改程式碼、執行檢查並產生正式靜態檔案。開發者不應將
Google 帳號密碼、OAuth Client Secret 或 service account private key 放入
Repository。

### GitHub Actions 編譯環境

GitHub Actions 是可重複執行的 CI/CD 編譯與部署環境，不是正式執行
App 的後端。工作流程應預留以下觸發方式：

- Repository push 或 Pull Request 用於自動檢查與編譯。
- `workflow_dispatch` 用於手動啟動編譯與部署。

GitHub Actions 負責依照專案的前端編譯流程產生 `print/dist/` 與
`scan/dist/`，並將指定的靜態產物部署至 GitHub Pages。工作流程不得把
Google 帳號密碼、OAuth Client Secret 或 service account private key
編入前端產物。

### 靜態網站服務環境（GitHub Pages）

靜態網站服務環境（目前規劃使用 GitHub Pages）只提供已編譯的
`print/dist/` 或 `scan/dist/` 檔案。正式執行不需要 Node.js runtime、
Django、PHP、Express 或其他自建後端。

這個角色與開發環境及 GitHub Actions 不同：開發環境與 GitHub Actions
負責編譯，GitHub Pages 負責提供檔案，瀏覽器則負責執行 App。

### 盤點與列印使用者

使用者透過瀏覽器操作兩個獨立的前端 App：

- 使用 `print` 產生 QR Code 預覽與 PDF。
- 使用 `scan` 在手機上辨識 QR Code 並送出盤點結果。

使用者輸入的網址、位置與列印偏好由各 App 依 `mis.print.*` 或
`mis.scan.*` 規則保存於瀏覽器 `localStorage`；這些設定不是正式盤點資料。

### `print` App

`print` 是桌面優先、支援手機與平板 RWD 的純前端工具，負責：

- 取得使用者提供的 Google Sheet URL。
- 讀取盤點項目的 `id`，檢查空白與重複資料。
- 在瀏覽器產生 QR Code 預覽與 PDF。

`print` 不更新 `checked_time` 或 `location`，也不直接寫入 Google Sheet。
最近使用的 Google Sheet 只透過固定網址開啟：

<https://drive.google.com/drive/u/0/recent?q=type:spreadsheet>

使用者在 Google Drive 選取檔案後，複製 Google Sheet URL，再貼回 `print`。
這個連結只負責導覽，不會自動列出檔案或把網址傳回 `print`，也不代表
`print` 已取得該 Sheet 的資料存取權限。

### `scan` App

`scan` 是手機優先的純前端 PWA，負責：

- 取得使用者拍攝或選取的圖片。
- 在瀏覽器本機辨識圖片中的一個或多個 QR Code。
- 對同一張圖片的 ID 去重；同一個 ID 在 10 秒內不重複送出。
- 3 秒內沒有新掃描後，一次將 `ids` 與 `location` 傳送給 Apps Script Web App。
- 顯示每筆盤點成功或失敗結果；變更位置時重置本次結果。

`scan` 不自行決定正式 `checked_time`，也不直接修改 Google Sheet。

### Google Sheet

Google Sheet 是盤點主資料來源與目前狀態的保存位置，至少包含：

- `id`：盤點項目的唯一識別碼，也是 QR Code payload。
- `checked_time`：最近一次成功盤點時間。
- `location`：最近一次成功盤點位置。

`id` 在同一張 Sheet 中必須唯一。Google Sheet 的讀取權限與實際資料
存取方式由使用者的 Google 帳號及部署設定決定；固定的最近使用連結不會
繞過權限。

### Bound Apps Script Web App

Bound Apps Script 綁定於 Google Sheet，提供 `scan` 使用的盤點寫入 API，
負責：

- 驗證 `id` 與 `location`。
- 查找唯一的 `id`。
- 以伺服器時間產生 `checked_time`。
- 更新 Google Sheet 的 `checked_time` 與 `location`。
- 回傳成功或錯誤 JSON。

Apps Script 是盤點寫入的唯一權威來源。`scan` 不可在 API 失敗時自行判定
成功；`print` 也不可呼叫它來寫入盤點結果。

## 責任界線

| 角色 | 負責 | 不負責 |
| --- | --- | --- |
| 開發環境 | 編譯、開發與驗證靜態 App | 正式盤點資料與線上 API |
| GitHub Actions | 自動或手動編譯、驗證並部署靜態 App | 作為正式 API 或保存 Sheet 資料 |
| 靜態網站服務環境（GitHub Pages） | 提供 `dist/` 靜態檔案 | 執行 Node.js 或保存 Sheet 資料 |
| `print` | 讀取 ID、產生 QR Code PDF | 寫入盤點結果 |
| `scan` | 圖片辨識、去重、批次送出結果、顯示狀態 | 產生正式時間、直接改 Sheet |
| Google Sheet | 保存盤點主資料與目前狀態 | 主動處理前端掃描流程 |
| Bound Apps Script | 驗證並寫入盤點結果 | 產生 QR Code 或辨識圖片 |
