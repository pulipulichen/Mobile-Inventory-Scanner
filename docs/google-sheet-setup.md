# Google Sheet 與 OAuth 設定

## 1. Google Sheet 格式

第一列欄位固定如下：

| A | B | C |
|---|---|---|
| `id` | `checked_time` | `location` |

範例：

| id | checked_time | location |
|---|---|---|
| A01 | 20260829-1710 | 倉庫 A |
| B03 |  |  |
| C04 |  |  |

QR Code 只編碼 `id`，例如 `A01`。

## 2. 建立 Google Cloud OAuth Client

此專案直接在瀏覽器使用 Google Identity Services 取得 OAuth access token，再呼叫 Google Sheets API，因此不需要在 GitHub 儲存 Client Secret。

1. 到 Google Cloud Console 建立或選擇專案。
2. 啟用 **Google Sheets API**。
3. 設定 OAuth consent screen。
4. 建立 **OAuth Client ID → Web application**。
5. 在 **Authorized JavaScript origins** 加入實際網站來源，例如：
   - `https://pulipulichen.github.io`
   - 本機開發可加入 `http://localhost:8000`
6. 將 Client ID 填入 `web/config/google-sheet.js`。

## 3. 設定 Spreadsheet ID

Google Sheet 網址形式：

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

把 `SPREADSHEET_ID` 填入：

```js
spreadsheetId: "..."
```

工作表分頁名稱預設為 `盤點`，若不同請修改 `sheetName`。

## 4. 權限

登入網頁的 Google 帳號必須具有該試算表的讀寫權限。掃描頁會要求：

```text
https://www.googleapis.com/auth/spreadsheets
```

盤點成功後只更新該 ID 所在列的 `checked_time` 與 `location`。

## 5. GitHub Pages

建議將網站部署為 HTTPS。若直接使用 GitHub Pages，可將 Pages source 指向包含 `web/` 的 branch，或後續加入 GitHub Actions 將 `web/` 發佈為網站根目錄。

相機 API 在一般瀏覽器中要求 HTTPS；以手機開啟時也是如此。
