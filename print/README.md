# QR Code 列印功能規格

本目錄負責從 Google Sheet 讀取盤點項目，產生 QR Code 列印報表，並讓使用者透過瀏覽器列印或輸出 PDF。

整體流程以 [`docs/architecture.md`](../docs/architecture.md) 為準。

## 使用流程

```text
開啟 print 網頁
    ↓
輸入 Google Sheet 網址
    ↓
讀取 Sheet 中的 id
    ↓
設定列印參數
    ↓
產生 QR Code 報表預覽
    ↓
瀏覽器列印 / 另存 PDF
```

所有使用者在網頁輸入或調整的內容，都要保存到 `localStorage`，下次開啟時自動帶回。

---

## 資料來源

使用者輸入完整的 Google Sheet 網址，例如：

```text
https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit
```

程式需從網址解析 Spreadsheet ID。

Google Sheet 第一版使用以下欄位：

```text
id | checked_time | location
```

列印功能只需要讀取 `id` 欄位。

### Google Sheet 權限

Google Sheet 不要求公開分享。

第一版建議使用 Google Identity Services + Google Sheets API：

- 使用者在列印頁登入 Google 帳號。
- 只要登入帳號具有該試算表讀取權限即可。
- 不需要把試算表設成「知道連結的任何人都可以查看」。
- 不應在前端保存 Client Secret。

若之後改用其他方式讀取 Sheet，仍必須維持「輸入 Google Sheet 網址」這個操作方式。

---

## QR Code 內容

每一筆有效 `id` 產生一張 QR Code。

QR Code 的 payload 就是 ID 本身，例如：

```text
A01
```

不可加入：

- Google Sheet URL
- Apps Script URL
- JSON
- `checked_time`
- `location`
- 額外前綴或後綴

QR Code 下方需顯示同一筆 ID 的可讀文字。

---

## 頁面輸入項目

### 1. Google Sheet 網址

必要欄位。

需求：

- 驗證是否為合法 Google Sheet URL。
- 自動解析 Spreadsheet ID。
- 保存至 `localStorage`。
- 下次開啟自動帶入。
- 提供「重新讀取」功能。

### 2. 列印參數

第一版至少提供：

- QR Code 尺寸。
- ID 文字大小。
- QR Code 與 ID 文字間距。
- 標籤間距。
- 頁面邊界。
- 紙張方向：直向 / 橫向。

預設紙張使用 A4。

所有參數修改後：

- 立即更新預覽，或提供明確的「更新預覽」按鈕。
- 保存到 `localStorage`。
- 下次開啟自動套用。

### QR Code 尺寸

建議使用毫米（mm）作為介面單位。

例如預設：

```text
30 mm × 30 mm
```

可同時提供 slider 與數值輸入。

---

## ID 資料處理

從 Google Sheet 讀取後：

- 第一列視為 header。
- 依欄位名稱尋找 `id`，不要硬綁固定欄號。
- 忽略空白 ID。
- ID 保持字串型態。
- 保留 Sheet 原始排列順序。
- 若出現重複 ID，應提示使用者，不直接產生可能混淆的列印結果。

載入成功後顯示：

- Google Sheet 名稱或 Spreadsheet ID。
- 有效 ID 總數。
- 資料錯誤數量，例如空白或重複 ID。

---

## 報表預覽

頁面要顯示接近實際列印結果的 A4 預覽。

每個標籤概念：

```text
┌───────────────┐
│               │
│    QR CODE    │
│               │
│      A01      │
└───────────────┘
```

需求：

- QR Code 與 ID 必須保持在同一個標籤中。
- 標籤不可被分頁切開。
- 自動依目前尺寸計算每列可放幾張。
- 自動換列、換頁。
- 多頁時清楚顯示頁面分隔。
- 預覽版面應盡量接近實際列印尺寸。

---

## 列印與 PDF

第一版使用瀏覽器原生列印：

```javascript
window.print();
```

使用者可：

- 直接列印到實體印表機。
- 在 Chrome / Edge / Safari 的列印介面另存 PDF。

列印模式必須：

- 隱藏設定面板。
- 隱藏按鈕與非報表 UI。
- 只輸出 QR Code 報表內容。
- 保持 QR Code 的實際尺寸與清晰度。

第一版不需要自行實作 PDF renderer。

---

## QR Code 品質

QR Code 應優先使用 SVG 或其他不易因縮放失真的輸出方式。

需求：

- 保留足夠 quiet zone。
- 黑白對比清楚。
- 不使用會造成模糊的 CSS bitmap 放大。
- 列印後可被 `scan` 頁可靠辨識。

---

## localStorage

至少保存：

```text
Google Sheet URL
QR Code 尺寸
ID 字體大小
QR Code / ID 間距
標籤間距
頁面邊界
紙張方向
```

原則：使用者在此頁輸入或調整的設定，不應因重新整理或關閉瀏覽器而消失。

可以提供「重設為預設值」功能清除本頁設定。

---

## 建議畫面

```text
┌────────────────────────────────────────┐
│ QR Code 列印                            │
├────────────────────────────────────────┤
│ Google Sheet 網址                       │
│ [ https://docs.google.com/...        ] │
│ [讀取資料]                              │
│                                        │
│ 已讀取：120 筆                          │
│                                        │
│ QR Code 尺寸   [ 30 ] mm               │
│ ID 字體大小    [ 12 ] pt               │
│ 標籤間距       [  4 ] mm               │
│ 頁面邊界       [ 10 ] mm               │
│ 紙張方向       [直向 ▼]                 │
│                                        │
│ [列印 / 產生 PDF]                       │
├────────────────────────────────────────┤
│                                        │
│              A4 預覽區                  │
│                                        │
└────────────────────────────────────────┘
```

---

## 錯誤處理

至少處理：

- Google Sheet URL 格式錯誤。
- 使用者尚未登入 Google。
- 登入帳號沒有 Sheet 權限。
- Google API 無法連線。
- 找不到 `id` 欄位。
- Sheet 沒有有效 ID。
- 出現重複 ID。
- QR Code 產生失敗。

讀取失敗時，不應保留舊資料並誤導使用者以為是新讀取結果。

---

## 第一版完成條件

- [ ] 可輸入 Google Sheet URL。
- [ ] Google Sheet URL 保存到 `localStorage`。
- [ ] 可從 URL 解析 Spreadsheet ID。
- [ ] 可登入 Google 並讀取有權限的 Sheet。
- [ ] 可從 `id` 欄取得所有有效 ID。
- [ ] 每個 ID 產生 QR Code。
- [ ] QR Code 下方顯示 ID。
- [ ] 可設定 QR Code 尺寸。
- [ ] 可設定基本列印參數。
- [ ] 所有列印參數保存到 `localStorage`。
- [ ] A4 自動排列與分頁。
- [ ] 可預覽。
- [ ] 可使用瀏覽器列印。
- [ ] 可使用瀏覽器另存 PDF。

## 第一版不做

- 透過 Apps Script 產生 QR Code。
- 寫入 `checked_time` 或 `location`。
- 手機掃描功能。
- 自訂任意紙張規格。
- 複雜標籤模板設計器。
