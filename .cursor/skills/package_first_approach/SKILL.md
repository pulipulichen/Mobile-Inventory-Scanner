---
name: package-first-approach
description: >-
  Prefer existing bundled packages (Bootstrap 5, AdminLTE 4, Tabulator, Tom
  Select, Quill, Flatpickr, HTMX, SortableJS, ApexCharts) over hand-rolled
  DOM/CSS. Use when adding any UI widget, panel, modal, table, dropdown,
  editor, chart, drag-and-drop, date picker, or when the user mentions 套件、
  元件、輪子、自己寫、third-party、library、plugin.
---

# 套件優先（Package-first），不要自己造輪子

新增任何 UI 行為或元件前，**先找現成套件**，最後才考慮自己寫。順序固定：

1. **專案已內建的 vendor 套件**（零額外體積、零離線打包成本）
2. **AdminLTE 4 / Bootstrap 5 官方元件與 utility**
3. **成熟開源套件**（必須可離線 vendored、授權相容）
4. **自己寫**（前三項都不可行時，且要在 PR／changelog 說明原因）

本專案是**離線內網部署**：任何新套件都必須能 vendored 進 `django/static/vendor/`，
**禁止 CDN**、禁止執行期下載。

## 先查這張表：已經有的東西不要重寫

| 需求 | 用這個（已內建） | 資產位置 |
| --- | --- | --- |
| 展開／收合、slide down 面板 | Bootstrap `Collapse` | `vendor/bootstrap/js/bootstrap.bundle.min.js` |
| 彈出視窗 | Bootstrap `Modal` | 同上 |
| 側邊滑出 | Bootstrap `Offcanvas` | 同上 |
| 下拉選單 | Bootstrap `Dropdown` | 同上 |
| 分頁籤 | Bootstrap `Tab` | 同上 |
| 版面／卡片／badge／callout | AdminLTE 4 | `vendor/adminlte/css/adminlte.min.css` |
| 資料表格（排序／分頁／篩選） | Tabulator | `plugins/tabulator/`（見 skill `django-tabulator`） |
| 可搜尋長清單下拉 | Tom Select | `vendor/tom_select/`（見 skill `django_searchable_select`） |
| 富文本編輯器 | Quill 2 | `vendor/quill/`（見 skill `quill_wysiwyg`） |
| 日期／時間選擇 | Flatpickr | `plugins/flatpickr/` |
| 拖曳排序 | SortableJS | `vendor/sortable_js/` |
| 圖表 | ApexCharts | `vendor/apexcharts/` |
| 局部更新／AJAX 片段 | HTMX | `plugins/htmx/` |
| 欄位說明面板 | Qristana Help Panel（Bootstrap Collapse 封裝） | `static/js/help_panel.js`（見 skill `form_field_help_panel`） |
| 圖示 | Font Awesome 6 | `vendor/fontawesome-free/` |

## 該做

- 動手前先在上表與 `django/static/vendor/`、`django/static/plugins/` 找一輪。
- 用現成套件的**原生 API**（例如 `bootstrap.Collapse.getOrCreateInstance(el, {toggle:false})`），
  自己只補「專案特有的行為」薄薄一層封裝。
- 顏色、間距、圓角一律用 **Bootstrap 語意 CSS 變數**（`--bs-body-bg`、`--bs-border-color`、
  `--bs-tertiary-bg`、`--bs-primary` …），暗色模式才會自動跟著走。
- 真的要引入新套件時：
  - 確認授權（MIT／BSD／Apache 之類）與離線可打包性。
  - 放進 `django/static/vendor/<package_name>/`，走 `npm run vendor-ui` 之類既有流程。
  - 在對應 skill 或 `doc/` 記一筆「為什麼需要它、取代了什麼」。
- 圖示 class 用之前先確認 vendored CSS 真的有：
  ```bash
  grep -o "\.fa-circle-question[:,{]" django/static/vendor/fontawesome-free/css/all.min.css
  ```

## 不該做

```text
❌ 自己手寫 slide/fade 動畫、focus trap、外點關閉，Bootstrap 已經有 Collapse／Modal／Offcanvas
❌ 自己寫排序／分頁表格邏輯，專案已經有 Tabulator
❌ 自己寫下拉搜尋，專案已經有 Tom Select
❌ <script src="https://cdn.jsdelivr.net/..."> —— 離線環境根本載不到
❌ 為了一個小效果引入整套新框架（jQuery plugin、React、Alpine…）
❌ 寫死 #fff／#212529 之類顏色，暗色模式就爛掉
❌ 複製套件原始碼進 plugin 目錄「改一改」，之後升級無從追起
```

## 判斷流程

```text
要做一個 UI 行為
  → 上表有嗎？        有 → 直接用，只寫薄封裝
  → AdminLTE 4 有嗎？ 有 → 用它的 class／pattern
  → Bootstrap 5 有嗎？有 → 用它的 component／utility
  → 有成熟開源套件？  有 → 確認授權 + 可 vendored → 引入並記錄
  → 都沒有            → 才自己寫，並說明原因
```
