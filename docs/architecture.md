# Mobile Inventory Scanner 系統架構

本文件定義整個專案的整體流程、元件責任與資料流。

詳細功能規格分別放在：

- `google_sheet/README.md`：Google Sheet 範本與 Apps Script。
- `print/README.md`：QR Code 列印 / PDF 產生網頁。
- `scan/README.md`：手機 QR Code 盤點 PWA。

若元件 README 與本文件有衝突，以本文件定義的整體流程為準，再同步修正各元件 README。

---

## 1. 整體目標

系統以 Google Sheet 作為盤點主資料表。

每一筆盤點資料至少包含：

| 欄位 | 用途 |
| --- | --- |
| `id` | 盤點項目的唯一識別碼，也是 QR Code 的內容 |
| `checked_time` | 最近一次成功盤點時間 |
| `location` | 最近一次成功盤點的位置 |

基本資料流：

```text
Google Sheet
   │
   ├── print 網頁讀取 id
   │      ↓
   │   產生 QR Code
   │      ↓
   │   列印 / PDF
   │
   └── Bound Apps Script Web App
          ↑
          │ id + location
          │
       scan PWA
          ↑
       手機照片
```

QR Code 只包含 `id`，不包含 URL、JSON、位置或時間。

---

## 2. 元件劃分

專案主要分成三個功能元件。

```text
Mobile-Inventory-Scanner/
├── docs/
│   └── architecture.md
├── google_sheet/
│   ├── README.md
│   └── appscript/
├── print/
│   └── README.md
└── scan/
    └── README.md
```

### 2.1 `google_sheet/`

負責：

- Google Sheet 範本格式。
- 欄位定義。
- Google Apps Script。
- Apps Script Web App API。
- 依 `id` 找出對應列。
- 成功盤點時寫入 `checked_time` 與 `location`。

Apps Script 採用綁定在該 Google Sheet 的 Bound Script 為主要設計，因此使用者建立 Sheet 範本後，即可在該 Sheet 內部署對應 Web App。

### 2.2 `print/`

負責：

- 在電腦瀏覽器操作。
- 使用者輸入 Google Sheet URL。
- 從該 Sheet 取得 `id` 清單。
- 將每個 `id` 產生 QR Code。
- 調整列印參數。
- 顯示列印預覽。
- 使用瀏覽器列印功能輸出到印表機或另存 PDF。

`print` 不負責更新盤點資料。

### 2.3 `scan/`

負責：

- 在手機瀏覽器 / PWA 操作。
- 使用者輸入 Apps Script Web App URL。
- 使用者輸入目前位置。
- 提供位置歷史記錄下拉選單。
- 使用手機拍照，或讀取既有相片。
- 從單張圖片辨識一個或多個 QR Code。
- 將每個 QR Code 的 `id` 與目前 `location` 傳送給 Apps Script。
- 顯示每一筆盤點成功或失敗的結果。

第一版不使用持續 Camera Preview 掃描；主要操作方式是「拍照」與「讀取相片」。

---

## 3. Google Sheet 建立流程

使用者先從專案提供的 Google Sheet 範本建立自己的盤點表。

基本流程：

```text
從範本建立 Google Sheet
        ↓
取得自己的 Google Sheet
        ↓
填入 / 匯入盤點 ID
        ↓
確認欄位名稱
id | checked_time | location
        ↓
建立 / 啟用 Bound Apps Script
        ↓
部署為 Web App
        ↓
取得 Apps Script Web App URL
```

使用者只需要擁有該 Google Sheet 的操作權限。

Google Sheet 範例：

```text
id  | checked_time | location
A01 |              |
B03 |              |
C04 |              |
```

`id` 必須視為字串，而且在同一張表中必須唯一。

---

## 4. Apps Script 資料寫入流程

Apps Script 的主要任務是接收：

```text
id
location
```

例如：

```json
{
  "id": "A01",
  "location": "主機房 A 區"
}
```

Apps Script 收到盤點請求後：

```text
收到 id + location
        ↓
驗證必要參數
        ↓
在 Google Sheet 搜尋 id
        ↓
 ┌──────┴──────┐
 │             │
找不到       找到多筆
 │             │
回傳失敗     回傳失敗

        找到唯一一筆
              ↓
      產生伺服器目前時間
              ↓
      更新 checked_time
              ↓
      更新 location
              ↓
          回傳成功
```

正式 `checked_time` 由 Apps Script 伺服器端產生，不使用手機時間。

預設時區：

```text
Asia/Taipei
```

預設時間格式：

```text
YYYYMMDD-HHmm
```

例如：

```text
20260829-1710
```

成功回傳至少應包含：

```json
{
  "success": true,
  "item": {
    "id": "A01",
    "checked_time": "20260829-1710",
    "location": "主機房 A 區"
  }
}
```

失敗回傳採一致格式，例如：

```json
{
  "success": false,
  "error": "ITEM_NOT_FOUND",
  "message": "找不到 ID: A01"
}
```

---

## 5. QR Code 列印流程

列印功能以桌面瀏覽器為主要操作環境。

完整流程：

```text
開啟 print 網頁
      ↓
輸入 Google Sheet URL
      ↓
讀取 Google Sheet 的 id
      ↓
顯示資料筆數
      ↓
設定 QR Code / 紙張參數
      ↓
產生列印預覽
      ↓
瀏覽器列印
      ↓
印表機 或 另存 PDF
```

QR Code payload：

```text
<id>
```

例如 ID 為 `A01`，QR Code 內容就是：

```text
A01
```

列印頁第一版主要考慮：

- A4。
- QR Code 實際尺寸。
- QR Code 間距。
- ID 文字。
- 字體大小。
- 頁面邊界。
- 紙張方向。
- 自動換行 / 換頁。
- QR Code 不可跨頁切斷。

實際 PDF 不另外在後端產生，而是使用瀏覽器 Print 對話框的「另存為 PDF」。

---

## 6. 手機盤點流程

盤點頁以手機使用為優先，並支援 PWA。

首次設定：

```text
開啟 scan PWA
      ↓
輸入 Apps Script Web App URL
      ↓
輸入目前位置
      ↓
儲存至 localStorage
```

日常盤點：

```text
開啟 scan PWA
      ↓
自動帶入上次 Apps Script URL
      ↓
自動帶入上次位置
或從位置歷史記錄選擇
      ↓
┌─────────────┬─────────────┐
│             │             │
拍照         讀取相片
│             │
└──────┬──────┘
       ↓
辨識圖片中的 QR Code
       ↓
可能取得 1 個或多個 id
       ↓
同一張圖片內重複 id 去重
       ↓
逐筆送出 id + location
       ↓
Apps Script 更新 Google Sheet
       ↓
逐筆顯示成功 / 失敗結果
```

一張照片可能同時存在多個 QR Code，因此 QR Code 解碼模組必須支援 multi-code detection；不能只處理第一個結果。

盤點結果區至少顯示：

- ID。
- 狀態。
- 成功時的 `checked_time`。
- 成功時的 `location`。
- 失敗時 Apps Script 回傳的錯誤訊息。

例如：

```text
✓ A01  20260829-1710  主機房 A 區
✓ B03  20260829-1710  主機房 A 區
✗ C99  找不到 ID
```

---

## 7. localStorage 原則

`print` 與 `scan` 都是純前端網頁。

使用者在網頁輸入的設定應盡量保存在瀏覽器 `localStorage`，避免每次重新輸入。

### print

至少保存：

- Google Sheet URL。
- QR Code 大小。
- 紙張方向。
- 邊界。
- 間距。
- 字體大小。
- 其他列印參數。

### scan

至少保存：

- Apps Script Web App URL。
- 最近一次 location。
- location 歷史記錄。

location 歷史記錄應可由下拉選單直接重新選擇。

`localStorage` 只保存設定，不將它當成正式盤點資料庫。

---

## 8. 前端與後端責任界線

### 前端負責

`print`：

- 使用者介面。
- Google Sheet URL 設定。
- 讀取 ID。
- QR Code 產生。
- 排版與列印。

`scan`：

- 使用者介面。
- 拍照 / 選取圖片。
- QR Code 圖片辨識。
- multi-code detection。
- localStorage。
- 呼叫 Apps Script。
- 呈現逐筆結果。

### Apps Script 負責

- 驗證輸入。
- 查找 ID。
- 確認 ID 唯一。
- 產生正式盤點時間。
- 更新 Google Sheet。
- 回傳成功或錯誤資訊。

Apps Script 是盤點寫入的唯一權威來源；scan 前端不可在 Apps Script 回傳失敗時自行判定為盤點成功。

---

## 9. 資料一致性原則

### ID

- QR Code 與 Sheet 中的 `id` 必須完全一致。
- ID 視為字串。
- 不自行轉大寫或小寫。
- 去除掃描結果前後空白後再送出。
- Sheet 中重複 ID 視為資料錯誤。

### checked_time

- 只由 Apps Script 寫入。
- scan 不自行產生正式盤點時間。

### location

- 由使用者在 scan 頁手動指定。
- 每次盤點送出當下選定的位置。
- Apps Script 將收到的 location 寫入 Sheet。

---

## 10. 網路需求

### print

讀取 Google Sheet 時需要網路。

### scan

PWA 靜態頁面可透過 Service Worker cache 提升再次開啟速度，但正式盤點寫入 Apps Script 時仍需要網路。

若 Apps Script 無法連線：

- 該筆不可標示為成功。
- 第一版不做離線 queue。
- 使用者可在網路恢復後重新送出。

---

## 11. 安全性原則

- Git repository 不存 Google 帳號密碼。
- Git repository 不存 OAuth Client Secret。
- Apps Script URL 與 Google Sheet URL 屬於使用者端設定，保存在各自瀏覽器的 localStorage。
- Apps Script 的部署權限應依實際使用環境設定。
- Sheet 本身不應因為 QR Code 列印功能而被迫設為完全公開；print 的實際存取方式依 `print/README.md` 定義。

---

## 12. 第一版完整操作流程

### A. 建立盤點表

```text
1. 從範本建立 Google Sheet
2. 填入 id
3. 建立 / 啟用 Bound Apps Script
4. 部署 Apps Script Web App
5. 取得：
   - Google Sheet URL
   - Apps Script Web App URL
```

### B. 產生 QR Code

```text
1. 電腦開啟 print
2. 輸入 Google Sheet URL
3. 系統讀取 id
4. 設定 QR Code 大小等列印參數
5. 預覽
6. 列印或另存 PDF
7. 將 QR Code 貼到對應盤點物件
```

### C. 現場盤點

```text
1. 手機開啟 scan PWA
2. 輸入 Apps Script URL（第一次）
3. 輸入或選擇 location
4. 按「拍照」或「讀取相片」
5. 系統找出圖片內全部 QR Code
6. 逐筆將 id + location 傳給 Apps Script
7. Apps Script 更新 checked_time / location
8. 手機逐筆顯示盤點結果
```

---

## 13. 第一版不做的功能

除非後續規格另外加入，第一版不要求：

- 即時持續 Camera Preview 掃描。
- GPS 自動定位。
- 手機端正式盤點時間。
- 離線盤點 queue。
- 自建後端伺服器或資料庫。
- 將 QR Code 內容做成 URL 或 JSON。
- 保存完整盤點歷史資料表。
- 在 scan 前端直接修改 Google Sheet。

整個第一版維持：

```text
Google Sheet = 主資料
Apps Script = 寫入 API
print = QR Code 列印工具
scan = 手機圖片掃描 / 盤點工具
```
