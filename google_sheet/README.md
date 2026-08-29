# Google Sheet / Apps Script 規格

本目錄負責盤點用 Google Sheet 範本，以及綁定於該試算表的 Google Apps Script。

整體流程以 [`docs/architecture.md`](../docs/architecture.md) 為準。

## 使用流程

1. 使用者從專案提供的 Google Sheet 範本建立自己的盤點表。
2. 使用者取得自己的 Google Sheet 網址。
3. 試算表內已包含或依本文件部署 Apps Script。
4. Apps Script 部署成 Web App，供手機端 `scan` 頁面呼叫。
5. 掃描頁將 `location` 與 QR Code 中的 `id` 傳給 Apps Script。
6. Apps Script 找到對應 ID 後，寫入盤點時間與位置。

Google Sheet 不需要公開；擁有該試算表權限的使用者即可管理資料與 Apps Script。

---

## Google Sheet 欄位

第一版固定使用以下三個欄位：

| 欄位 | 必填 | 說明 | 範例 |
| --- | --- | --- | --- |
| `id` | 是 | 盤點項目的唯一識別碼，也是 QR Code 的內容 | `A01` |
| `checked_time` | 否 | 最近一次成功盤點的日期時間，由 Apps Script 寫入 | `2026-08-29 17:10:00` |
| `location` | 否 | 最近一次成功盤點的位置，由掃描端傳入 | `主機房 A 區` |

範例：

```text
id  | checked_time        | location
A01 | 2026-08-29 17:10:00 | 主機房 A 區
B03 |                     |
C04 |                     |
```

### `id` 規則

- `id` 必須唯一。
- `id` 一律視為字串。
- QR Code 內容就是 `id` 本身，不包 URL、JSON 或其他前後綴。
- 空白 ID 不視為有效盤點資料。
- 若 Sheet 中出現重複 ID，Apps Script 不應任意更新其中一筆，必須回傳錯誤。

### `checked_time`

- 由 Apps Script 伺服器端產生，不採用手機時間。
- 使用試算表 / Apps Script 時區，預設 `Asia/Taipei`。
- 第一版建議顯示格式：`yyyy-MM-dd HH:mm:ss`。

### `location`

- 由手機掃描頁手動輸入。
- Apps Script 收到空白位置時應拒絕寫入。
- 成功盤點後直接覆寫該 ID 目前的 `location`。

---

## Apps Script 功能

Apps Script 第一版只負責「依 ID 寫入盤點結果」。

它不負責 QR Code 產生，也不負責手機端圖片辨識。

### Web App 輸入

掃描頁每辨識到一個 QR Code，就送出一筆盤點請求。

輸入至少包含：

```json
{
  "id": "A01",
  "location": "主機房 A 區"
}
```

可接受 `POST`，內容可使用 JSON 或表單格式；實作時選定一種固定介面即可。

### 寫入流程

Apps Script 收到請求後：

1. 驗證 `id` 不為空。
2. 驗證 `location` 不為空。
3. 在 `id` 欄尋找完全相符的資料。
4. 找不到 ID 時回傳盤點失敗。
5. 找到多筆相同 ID 時回傳重複 ID 錯誤。
6. 找到唯一資料列時，以伺服器目前時間更新 `checked_time`。
7. 將輸入的位置更新到 `location`。
8. 回傳本次盤點結果。

### 成功回傳

```json
{
  "success": true,
  "id": "A01",
  "checked_time": "2026-08-29 17:10:00",
  "location": "主機房 A 區",
  "message": "盤點成功"
}
```

### 失敗回傳

```json
{
  "success": false,
  "id": "A99",
  "error": "ID_NOT_FOUND",
  "message": "找不到 ID: A99"
}
```

至少區分以下錯誤：

- `INVALID_ID`：ID 為空或格式不合法。
- `INVALID_LOCATION`：位置為空。
- `ID_NOT_FOUND`：Sheet 找不到該 ID。
- `DUPLICATE_ID`：Sheet 中同一 ID 出現多筆。
- `SHEET_NOT_FOUND`：目標工作表不存在。
- `COLUMN_NOT_FOUND`：必要欄位不存在。
- `WRITE_FAILED`：寫入失敗。

Apps Script 即使發生錯誤，也應盡量回傳 JSON，讓掃描頁可以直接顯示結果。

---

## Apps Script 與試算表關係

建議使用 **Bound Script（綁定試算表的 Apps Script）**。

如此從範本建立副本時，Apps Script 可與試算表一起管理，不需要在程式碼內硬編碼另一份 Spreadsheet ID。

程式可透過目前綁定的 Spreadsheet 取得資料，例如概念上使用：

```javascript
SpreadsheetApp.getActiveSpreadsheet();
```

工作表名稱、欄位名稱與時區可集中在設定區。

---

## 建議目錄

```text
google_sheet/
├── README.md
├── template/
│   └── ... Google Sheet 範本相關說明或資源
└── appscript/
    ├── Code.gs
    └── appsscript.json
```

---

## 第一版完成條件

- [ ] 有可複製的 Google Sheet 範本。
- [ ] 範本包含 `id`、`checked_time`、`location` 三欄。
- [ ] Apps Script 可部署成 Web App。
- [ ] Web App 可接收 `id` 與 `location`。
- [ ] 找到 ID 時更新 `checked_time` 與 `location`。
- [ ] 找不到 ID 時不修改 Sheet 並回傳錯誤。
- [ ] 重複 ID 時不修改 Sheet 並回傳錯誤。
- [ ] 回傳格式可直接供 `scan` 頁顯示。

## 第一版不做

- 盤點歷程表。
- 新增 / 刪除 / 修改 ID 的 API。
- GPS 定位。
- Apps Script 產生 QR Code。
- Apps Script 處理圖片或辨識 QR Code。
