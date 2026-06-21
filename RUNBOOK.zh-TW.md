# RUNBOOK —— 擷取 udflow demo 執行紀錄（Phase 2）

[English](RUNBOOK.md) · **繁體中文**

這是**第二個 session**。Phase 1（scaffold、私有 repo、Issue #1、乾淨 branch）已完成。本 session 的目標是：對 Issue #1 跑真實的 udflow 工作流程、把證據擷取進 `docs/udflow-run-2026-06-21/`、遮蔽 transcript，並開 PR。

> 為何用全新 session：讓這次執行的 transcript **零 scaffold 雜訊** —— 讀起來就和第一次使用者看到的一模一樣。

## 0. 前置條件
- 你位於 `D:\github\udflow-public-demo`。
- 已安裝 udflow plugin（`/plugin` 列出 `udflow@kktmarketplace`），且 `node --version` 可運作（hooks 是 Node 腳本；沒有 Node 會靜默 no-op）。
- 你在 `feat/csv-recipient-import` branch 上，且 `git status --short` 為**空**。

## 1. Kickoff prompt（貼這段給 Claude）

> Read RUNBOOK.md and execute it. Run the udflow workflow on Issue #1 and, as it progresses, capture the real evidence into docs/udflow-run-2026-06-21/ (files 01–06) exactly as it happens — verbatim findings, "no findings" where true, nothing staged. Stop at the plan gate so I can approve, and stop again before opening the PR so I can eyeball the redacted transcript.

## 2. 啟動工作流程

```
/udflow:run Fix issue #1: implement CSV recipient import validation
```

## 3. 在 plan gate —— 核准**之前** —— 填 `01-plan-gate.md`
當 udflow 透過 ExitPlanMode 提出計畫時，擷取：
- 任務那一行（`/udflow:run …` 指令），
- udflow 對需求的重述，
- 提出的計畫，
- `git status --short` —— 必須為**空**（plan mode 期間 plan-gate hook 會擋下編輯）。

## 4. 核准 —— 填 `02-approval.md`
核准計畫，然後記下你確切的核准訊息 + 時間戳。唯有在此之後，implementer 才獲准寫檔。

## 5. 讓它跑；擷取 `03`–`06`
- `03-implementation-summary.md` —— 變更檔案、作法、假設、風險。
- `04-verification.md` —— `npm run typecheck`／`npm run lint`／`npm test` 指令與輸出摘要（記下演練到哪些邊界輸入：空、格式錯誤、重複、多位元組）。
- `05-reviewers.md` —— 每位入選審查員的發現，**逐字**（或「no findings」）。不要編輯或杜撰。記下入選了哪些審查員、並簡述原因。
- `06-gatekeeper.md` —— 彙整的 blocker／major／minor、（若有）衝突解決、最終判決，以及（若發生）修復迴圈。

## 6. Transcript → `transcript.redacted.md`
- 原始 session transcript JSONL 位於你本機的 Claude Code projects 目錄 —— 例如 `~/.claude/projects/<project>/`（macOS/Linux）或 `C:\Users\<you>\.claude\projects\<project>\`（Windows）。
- 把原始檔保留在**本機／repo 之外**（或命名為 `*.raw.*`，`.gitignore` 已排除）。**絕不要提交原始 transcript。**
- 依 `redaction-notes.md` 產生 `transcript.redacted.md`：
  - **遮除：** 本機絕對路徑、家目錄／使用者名稱路徑、token／key／cookie／環境變數、私有 repo 名稱、無關 shell 輸出、內部系統／工具內容。**執行期間不要跑 `gh auth status`** —— 它會印出 token。
  - **保留：** 任務、重述、計畫、核准、變更檔案摘要、驗證摘要、每位審查員的發現、修復迴圈、gatekeeper 判決。
- 填 `redaction-notes.md`，並確認沒有刪掉任何工作流程階段。

## 7. Commit + 開 PR
- **Commit 1（程式碼）：** 該次執行產生的實作 + 測試 —— `feat: implement importRecipients CSV validation (refs #1)`。
- **Commit 2（證據）：** 填好的文件 —— `docs: add udflow run evidence (2026-06-21)`。
- 推送：`git push -u origin feat/csv-recipient-import`。
- 開 PR（base `main`），用以下描述、填入**真實**結果：

```
## What This Demonstrates
- /udflow:run started the workflow
- Plan gate happened before any file modification
- User approved the plan before implementation
- Selected reviewers ran: spec / test / code / security
- Gatekeeper final verdict: <READY | FIX REQUIRED | NOT READY>

## Plan Gate Evidence
- Before plan: git status --short = clean
- Before approval: git status --short = clean
- After approval: implementation commits/files changed

## Verification
- npm run typecheck    - npm run lint    - npm test    (+ CI on the PR)

## Review Evidence
- spec-reviewer / test-reviewer / code-reviewer / security-reviewer: <actual findings or "no findings">
- gatekeeper: <verdict>

## Transcript
See docs/udflow-run-2026-06-21/transcript.redacted.md
```

## 8. 交回（Phase 3）
PR 開好後即停。在你檢視過遮蔽後的證據之前，repo 維持**私有**。之後再翻公開：

```
gh repo edit simba6507/udflow-public-demo --visibility public --accept-visibility-change-consequences
```
