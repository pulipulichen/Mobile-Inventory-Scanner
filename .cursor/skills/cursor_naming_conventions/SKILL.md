---
name: cursor-naming-conventions
description: 統一本專案 Cursor Rules 與 Skills 的路徑、檔名、目錄及 metadata 命名。Use when creating, renaming, or referencing files under .cursor/rules or .cursor/skills, or when deciding between snake_case and kebab-case for Cursor configuration.
---

# Cursor 命名規範

本 Skill 只處理 Cursor 專案設定（`.cursor/rules/` 與 `.cursor/skills/`）的命名。Python、HTML、CSS、JavaScript、Django URL、Ansible 及其他正式程式碼，依專案全域命名規範與該語言／框架規則處理，不要套用本 Skill 覆寫。

## 命名決策順序

1. Cursor 或第三方／上游要求的固定名稱優先。
2. 語言／框架專屬規則優先於全域預設。
3. 本專案的 Cursor 路徑規則如下。
4. 仍無明確規則時，使用小寫 `snake_case`。

## Cursor Rules

- Rule 檔案放在 `.cursor/rules/`。
- 新增或重新命名 Rule 使用小寫 `snake_case.mdc`，例如 `remote_server_testing.mdc`。
- Rule 不需要新增 `name` frontmatter；以檔名作為識別。
- `alwaysApply`、`globs` 等 Cursor frontmatter 欄位維持平台定義，不自行改名。

## Cursor Skills

- Skill 放在 `.cursor/skills/<skill_directory>/`。
- Skill 目錄使用小寫 `snake_case`，例如 `.cursor/skills/django_tabulator/`。
- Cursor 固定入口檔名必須是 `SKILL.md`，不可改成 `skill.md`、`skill_description.md` 或其他名稱。
- `SKILL.md` frontmatter 的 `name` 使用小寫 `kebab-case`，因為這是 Cursor Skill metadata 的格式限制，例如目錄 `django_tabulator/` 對應 `name: django-tabulator`。
- 文件中以反引號寫 Skill 名稱或觸發 Skill 時，使用 metadata 的 `kebab-case`；文件中的實際路徑使用 `snake_case` 目錄。
- Skill 的其他支援文件使用 `snake_case` 檔名，除非 Cursor、第三方或上游固定檔名。

## 其他命名範圍

- Python 模組、函式、變數及 Django model 欄位依 `snake_case`。
- HTML／CSS／文件檔名依專案規範使用 `snake_case`；HTML 的 DOM `id`、CSS class 與 `data-*` 仍依前端規則使用 `kebab-case`。
- JavaScript 內部識別字依前端規範使用 `camelCase`；全域物件依既有規範處理。
- vendor、第三方套件、上游範例及其固定檔名保留原命名，不為了本專案格式任意改名。
- 外部 URL、容器映像 tag、發行檔及其他上游介面名稱保留其必要格式。

## 建立或重新命名檢查清單

- [ ] 先確認這是 Cursor 設定、正式程式碼，還是 vendor／上游內容。
- [ ] Cursor Rule 路徑使用 `.cursor/rules/<snake_case>.mdc`。
- [ ] Cursor Skill 路徑使用 `.cursor/skills/<snake_case>/SKILL.md`。
- [ ] Skill metadata `name` 使用 `kebab-case`，且與文件中的 Skill 識別名稱一致。
- [ ] 所有相對路徑引用使用實際的 `snake_case` 目錄／檔名。
- [ ] 沒有因全域命名預設而改動語言、框架或 vendor 的專屬格式。
