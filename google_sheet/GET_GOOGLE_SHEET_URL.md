# 取得 Google Sheet URL

`print` 使用 Google OAuth 與 Google Sheets API 讀取試算表，因此只需要登入
帳號擁有該試算表的讀取權限，不需要將 Google Sheet 設為公開。

## 操作步驟

1. 登入要使用的 Google 帳號，開啟盤點用 Google Sheet。
2. 確認第一列欄位名稱正好是 `id`、`checked_time`、`location`。
3. 複製瀏覽器網址列的完整網址，例如：

   ```text
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

4. 將完整網址貼到 `print` 的 Google Sheet URL 欄位。

不要只複製 `<SPREADSHEET_ID>`；`print` 可接受完整 Google Sheet URL，並會
自行解析 Spreadsheet ID。

完成後可回到 [Google Sheet / Apps Script 規格](./README.md) 查看欄位與資料
格式。
