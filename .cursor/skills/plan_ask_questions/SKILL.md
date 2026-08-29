---
name: plan-ask-questions
description: Require at least 10 multiple-choice questions before or while creating a plan. Use when creating or updating a plan, planning mode, 規劃, 實作計畫, or asking the user to confirm undecided design decisions.
---

# Plan 必須先問選擇題

如果有 plan 的話，請至少問我 10 個以上問題，然後問題都至少要有選項。

## Rules

- 只要要產出或更新 plan（plan mode、實作計畫、規格規劃），先用**結構化多選題**問使用者（每題至少 2 個選項）。
- 你應該用 Cursor 既有的 內建問答 UI 格式提問。它不應該是純文字。
- 至少 10 題；每題都必須有選項。不要只用開放式文字問。
- **選項順序固定：**
  1. 第一個選項＝你推薦的做法
  2. 中間＝其他做法
  3. 倒數第三個＝「解釋這題意思，下一輪再問」
  4. 倒數第二個＝「還沒決定」
  5. 最後一個＝讓使用者加入自己的回答（例如「其他（我會再打字補充）」）
- 題目要涵蓋會改變架構、資料模型、權限、安全性問題、預設值或 UX 的未決事項。
- 規劃範圍以程式碼與產品設計為主：可詢問程式架構、資料模型、API、權限、安全性、預設值、錯誤處理與 UX；不要把 MCP 工具操作、遠端主機操作、部署指令、同步流程或環境維運設計成選擇題。這些內容只有在使用者另外要求操作或驗證時才處理。
- 等使用者回答後，再把答案寫進 plan 的「已決定」；未答或選「還沒決定」的留在「尚待確認」。
- 不要用「還有問題再問我」帶過；沒問滿 10 題就不要當規劃完成。

## 提問格式（強制）

**禁止**把選項寫成一般聊天 Markdown／編號清單（例如 `a) …` `b) …`、`- [ ]`、純文字 1/2/3）。使用者必須用產品內建的問答 UI 點選。

依目前執行環境，**必須**呼叫對應工具：

| 環境 | 必用工具 | 說明 |
| --- | --- | --- |
| Cursor | `AskQuestion` | 結構化 `title` + `questions[]`（`id` / `prompt` / `options[{id,label}]`，可選 `allow_multiple`） |
| Antigravity（或同等 Claude／AGY 工具鏈） | `AskUserQuestion` | 產品內建使用者問答 UI；參數依該環境 schema |

### Cursor `AskQuestion` 要點

- 用工具呼叫，不要改寫成聊天文字選項。
- 建議一次一批問完（或依產品限制分批），但**每一題**都要有完整 options（含推薦／解釋／還沒決定／其他）。
- 若目前模式沒有 `AskQuestion`：先 `SwitchMode` 到 **Plan**（或請使用者切到有該工具的模式），**取得工具後再問**；在拿到工具前不要用 Markdown 清單冒充選擇題，也不要假裝規劃已完成。

### Antigravity `AskUserQuestion` 要點

- 同樣禁止 Markdown 清單替代。
- 選項順序與內容規則與上方「選項順序固定」相同。
- 若工具不可用：說明缺口並改走可呼叫該工具的模式／父 agent；不要降級成純文字 a/b/c。

### 共同禁止

```text
❌ 在回覆正文列 a/b/c 或 1/2/3 當正式選擇題
❌ 工具失敗／不存在時默默改用 Markdown 清單繼續問
❌ 未滿 10 題就寫完整 plan 並宣稱規劃完成
```
