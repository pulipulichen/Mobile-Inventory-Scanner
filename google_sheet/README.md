# Google Sheet / Apps Script 規格

本目錄負責 Google Sheet 與 Google Apps Script 的整合。

Google Sheet 是盤點資料的主要資料來源；QR Code 列印頁與手機掃描盤點頁不直接操作 Sheet，而是透過 Apps Script Web App 提供的 API 讀取或更新資料。

## Google Sheet 欄位

預設工作表欄位如下：

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `id` | 資產或盤點項目的唯一識別碼，也是 QR Code 的內容 | `A01` |
| `checked_time` | 最近一次成功盤點時間 | `20260829-1710` |
| `location` | 最近一次盤點時輸入的位置 | `機房 A` |

第一列固定作為欄位名稱，例如：

```text
id | checked_time | location
A01|              |
B03|              |
C04|              |
```

## ID 規則

- `id` 必須唯一。
- QR Code 內容直接使用 `id`，不額外包 JSON 或網址。
- `id` 一律視為字串處理，避免 `001` 被轉成 `1`。
- 空白 ID 不列入盤點資料。
- 若 Google Sheet 出現重複 ID，Apps Script 應回傳錯誤，不自動選其中一列更新。

## Apps Script 功能

Apps Script 預計部署為 Web App，提供 `print` 與 `scan` 網頁使用的 API。

### 1. 讀取全部盤點項目

用途：QR Code 列印頁取得所有可以產生 QR Code 的 ID。

應具備：

- 讀取指定 Spreadsheet / Sheet。
- 根據欄位名稱找到 `id` 欄。
- 忽略空白 ID。
- 保留 ID 原始字串格式。
- 檢查重複 ID。
- 回傳盤點項目清單。

建議回傳：

```json
{
  "success": true,
  "items": [
    { "id": "A01" },
    { "id": "B03" },
    { "id": "C04" }
  ]
}
```

### 2. 查詢單一 ID

用途：掃描 QR Code 後確認這個 ID 是否存在於 Google Sheet。

輸入概念：

```json
{
  "action": "getItem",
  "id": "A01"
}
```

成功時可回傳：

```json
{
  "success": true,
  "item": {
    "id": "A01",
    "checked_time": "20260829-1710",
    "location": "機房 A"
  }
}
```

### 3. 寫入盤點結果

用途：手機成功掃描 QR Code 後，更新該 ID 的盤點時間與位置。

輸入概念：

```json
{
  "action": "check",
  "id": "A01",
  "location": "機房 A"
}
```

Apps Script 應執行：

1. 根據 `id` 找到對應資料列。
2. 找不到 ID 時回傳錯誤。
3. 找到多筆相同 ID 時回傳重複 ID 錯誤。
4. 將 Apps Script 伺服器端目前時間寫入 `checked_time`。
5. 將使用者輸入的位置寫入 `location`。
6. 回傳更新後結果。

成功回傳概念：

```json
{
  "success": true,
  "item": {
    "id": "A01",
    "checked_time": "20260829-1710",
    "location": "機房 A"
  }
}
```

## checked_time 格式

暫定格式：

```text
YYYYMMDD-HHmm
```

例如：

```text
20260829-1710
```

時間由 Apps Script 端產生，不採用手機送來的時間，避免手機時間或時區設定錯誤。

預設時區：

```text
Asia/Taipei
```

## Apps Script 設定

Apps Script 應集中設定：

- Spreadsheet ID
- Sheet 名稱
- Header row
- 欄位名稱
- 時區
- API 存取方式

概念範例：

```javascript
const CONFIG = {
  spreadsheetId: '...',
  sheetName: '盤點',
  headerRow: 1,
  timezone: 'Asia/Taipei',
  columns: {
    id: 'id',
    checkedTime: 'checked_time',
    location: 'location'
  }
};
```

## 預計目錄

```text
google_sheet/
├── README.md
└── appscript/
    ├── Code.gs
    └── appsscript.json
```

## 錯誤處理

Apps Script 至少需要區分：

- Sheet 不存在。
- 必要欄位不存在。
- ID 不存在。
- ID 重複。
- location 為空。
- 寫入 Google Sheet 失敗。
- 不合法的 action。

建議所有 API 都使用一致格式：

```json
{
  "success": false,
  "error": "ITEM_NOT_FOUND",
  "message": "找不到 ID: A01"
}
```

## 尚待確認

- Apps Script Web App 是否允許匿名存取，或需要驗證。
- 是否限制可呼叫 API 的來源網域。
- 是否需要額外的盤點歷程 Sheet，而不是只保留最後一次 `checked_time` / `location`。
- 是否需要支援多個工作表。
- 是否需要提供新增、刪除或修改盤點項目的 API。
