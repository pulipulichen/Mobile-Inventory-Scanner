---
name: help-modal
description: >-
  Collapse section instructional copy into a heading-side help-modal:
  a "?" icon button that opens a Vuetify dialog. Use when the user mentions
  help_modal, help modal, ? icon, 說明收成, 問號按鈕, or asks to hide long
  heading help text in scan/ or print/.
---

# help_modal

`scan/` 與 `print/` 區塊標題旁的長說明，一律收成標題列上的「?」按鈕；
點擊後以 Vuetify dialog 顯示原文。專案內這個模式叫做 **help_modal**。

## 何時使用

標題底下那段「怎麼用這個區塊」的說明要讓路給主要操作時：

- 「開始盤點」旁的掃描說明
- 「尚未盤點項目」旁的清單說明
- 「連線與位置」旁的設定說明
- 之後新增的區塊標題說明

不要把動態狀態收進 help_modal：空狀態、載入中、成功／失敗筆數、
欄位 hint、live region 都留在畫面上。

## 實作

使用既有元件，不要再複製一份 `v-dialog`：

- `scan`：[`scan/src/components/HelpModal.vue`](../../../scan/src/components/HelpModal.vue)
- `print` 若也需要，複製同一元件到 `print/src/components/HelpModal.vue`；
  不要為了這一個元件開共用 package。

標題列固定這樣排：

```vue
<div class="section-heading">
  <div class="section-heading-row">
    <h2 id="section-heading-id">{{ t("….heading") }}</h2>
    <HelpModal
      :title="t('….help')"
      :description="t('….description')"
    />
  </div>
</div>
```

`section-heading-row` 已在 `scan/src/styles/main.scss`。`print` 若還沒有，
複製同一組 flex 樣式，不要另造一套標題列。標題必須橫向排列，不可被
`v-dialog` 撐開後把中文逐字折成直書；`HelpModal` 外層用
`.help-modal-wrap`（`flex: 0 0 auto`），標題用 `white-space: nowrap`。

## i18n

- 按鈕 accessible name 與 dialog 標題用同一個 `….help` key，例如
  `scan.scanner_help`、`scan.pending_help`。
- 說明本文沿用原本的 `….description` key，不要把英文或 key 當 UI。
- 關閉按鈕用 `common.close`。兩個 locale 必須有相同 key。

## 無障礙

- icon-only 按鈕必須有 `aria-label`（與可見語意一致的說明名稱）。
- Dialog 必須有標題，並用 `aria-labelledby` 關聯。
- 觸控目標至少 44×44 CSS px（元件內 `.help-modal-button` 已設）。
- 用 Vuetify `v-dialog` 的 activator，讓開啟後焦點進 dialog、關閉後回到「?」。
- 關閉用有文字的按鈕，不可只靠點 overlay。
- 說明本文必須在 DOM 中以文字存在；不可只靠 tooltip。

## 不該做

```text
❌ 在標題下列出長說明段落
❌ 每個畫面複製一份 v-dialog
❌ 用 tooltip、title 或 toast 取代說明
❌ 用沒有 accessible name 的純「?」字元按鈕
❌ 把空狀態或即時進度放進 help_modal
```
