---
name: sync-github
description: >-
  Updates the changelog, then git commit and git push to GitHub as one
  sequential workflow. Use when the user says 請做同步 github, 同步github,
  同步 GitHub, 同步 github, 請同步 github, sync github, or similar phrases
  asking to sync current work to GitHub.
---

# 同步 GitHub

使用者寫「請做同步 github」「同步github」之類的詞語時，表示要做這段**連續動作**：寫入 changelog → `git commit` → `git push`。不要只做其中一步，也不要中途停下來再問一次「要不要 commit / push」。

## 觸發詞

以下（含空白、大小寫、`GitHub` / `github`）都視為同一指令：

- 請做同步 github
- 同步github
- 同步 GitHub
- 同步 github
- 請同步 github
- sync github

## 連續流程

嚴格依序執行，前一步失敗就停止並回報原因，不要假裝已完成。

### 1. 寫入 changelog

- 先看工作區與對話中這次實際改動，把值得記錄的項目寫進**目前最新**版本檔（例如 `changelog/CHANGELOG-0.0.3.md`）。
- 根目錄 `CHANGELOG.md` 只是索引，不要把條目直接寫進該檔。
- Changelog 用英文；沿用現有 `### Added` / `### Changed` / `### Fixed` 等小節。
- **不要升版**，除非使用者同時明確要求升版（例如「升到 0.0.4」「推前版本號」）。
- 寫 changelog 時遵循專案 changelog skill 與 `.cursor/rules/changelog_no_version_bump.mdc`。

### 2. Commit

依使用者 git commit 規則執行：

1. 平行跑 `git status`、`git diff`、`git log`（看近期 commit 風格）。
2. 只納入這次要同步的相關檔案；不要提交 `node_modules/`、`dist/`、`.vite/`、`.env`、憑證或其他敏感檔。
3. 沒有可提交變更時，不要空 commit；直接說明工作區已乾淨，並檢查是否已與遠端同步。
4. Commit message 用 conventional commits（`feat` / `fix` / `chore` / `docs` / `refactor` / `test`），1–2 句，寫 why 不是列檔名。
5. 用 HEREDOC 傳 message；不要改 git config、不要 `--amend`（除非符合既有 amend 條件）、不要跳過 hooks。

### 3. Push

- 這組觸發詞**本身就是明確要求 push**。
- 推送到已追蹤的 GitHub remote（本專案 `origin` 為 `https://github.com/pulipulichen/Mobile-Inventory-Scanner.git`）。
- 使用一般 `git push`（必要時 `git push -u origin HEAD`）；**不要** `--force` / `--force-with-lease`。
- Push 前確認分支與遠端狀態；若落後遠端、有衝突、或 hook 拒絕，回報具體錯誤並停下。
- Push 後跑 `git status`，回報 commit hash、遠端與是否已同步。

## 不該做

```text
❌ 只更新 changelog 卻不 commit / push
❌ 只 commit 卻不 push
❌ 沒有改動卻空 commit
❌ 自行升 semver
❌ 把 dist、lock 以外的產生檔、secret 一併推進 GitHub
❌ force push 到 main / master
```
