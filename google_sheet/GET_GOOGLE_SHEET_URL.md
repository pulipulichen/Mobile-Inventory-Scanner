# 取得 Google Sheet URL

`print` 需要使用者提供 Google Sheet 的完整網址。若不知道要使用哪一份
試算表，可以先開啟 [Google Drive 最近使用的 Google Sheet](https://drive.google.com/drive/u/0/recent?q=type:spreadsheet)
，選取檔案後複製網址；此流程不需要替專案設定 Google Cloud Project。

## 操作步驟

1. 登入具有該試算表讀取權限的 Google 帳號。
2. 開啟盤點用 Google Sheet；也可以先從[最近使用的 Google Sheet](https://drive.google.com/drive/u/0/recent?q=type:spreadsheet)中選取。
3. 確認第一列欄位名稱正好是 `id`、`name`、`checked_time`、`location`。
   `name` 用來填寫人類可識別名稱，例如「印表機」或「桌上型電腦」。
4. 複製瀏覽器網址列的完整網址，例如：

   ```text
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

5. 將完整網址貼到 `print` 的 Google Sheet URL 欄位。

不要只複製 `<SPREADSHEET_ID>`；`print` 可接受完整 Google Sheet URL，並會
自行解析 Spreadsheet ID。

完成後可回到 [Google Sheet / Apps Script 規格](./README.md) 查看欄位與資料
格式。
