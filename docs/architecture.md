流程是

建立 google sheet （從範本檔建立）

看 google_sheet/README.md

取得google sheet網址 (自己擁有權限即可)

appscript 要有輸入位置跟id的功能，如果有對應的id，那就把盤點完成的日期跟位置填上去

---

然後用 print/README.md

輸入 google sheet 網址

設定要列印的參數

就產生報表，可以印出qrcode，pdf

網頁輸入的內容都要localStorage

---

然後用 scan/README.md

輸入 google sheet 的 appscript 網址

輸入 位置 資訊 (幫我做個下拉歷史記錄選單)

然後兩個按鈕

- 拍照
- 讀取相片

把相片內的 qrcode 擷取出來，可能多個 qrcode

把位置跟id丟給apps script

下面列有掃描到的qrcode, 盤點是否成功的資訊 （apps script回傳）


網頁輸入的內容都要localStorage