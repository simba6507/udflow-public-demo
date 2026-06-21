# udflow-public-demo

[English](README.md) · **繁體中文**

> 📄 **本 repo 是一次真實 `/udflow:run` 的完整端到端紀錄** —— 從 plan gate、各審查員的發現、repair loop，到最後 gatekeeper 的判決，原汁原味照實記錄。

一次 [udflow](https://github.com/simba6507/universal-dev-flow-plugin) 的**真實執行紀錄**。udflow 是 Claude Code 上一套「plan-gated、依風險挑選審查員」的 code-review 與 release-readiness 工作流程；這次示範的是一個小而不瑣碎的 TypeScript 任務。

這個 repo 的目的，是讓你看見工作流程**真正的行為**，而不是行銷用的動圖：

- **plan gate**（你核准前不會動到任何檔案），
- **依風險挑選的審查員**（spec / test / code / security —— 按任務風險挑選，不是每次全員出動），
- **repair loop**（修復迴圈），以及
- **gatekeeper 判決**（`READY` / `FIX REQUIRED` / `NOT READY`）。

> **誠實聲明。** [`docs/udflow-run-2026-06-21/`](docs/udflow-run-2026-06-21/) 底下的所有內容，都是照實際發生記錄的。發現逐字呈現；若某位審查員什麼都沒找到，文件就照實寫。**沒有任何造假的發現。** 這裡的價值在於這次執行是**可觀察、可重現、可審核**的 —— 而不是宣稱它每次都能抓到 bug。（這套 plugin 自己的 README 對自身限制同樣直言不諱。）

## 這個任務

實作 `importRecipients(csv)` —— 一個把 CSV 轉成收件人清單的 parser，合約嚴格：必填表頭、去除前後空白、拒絕格式錯誤的 email、不分大小寫去重、完整保留多位元組（非 ASCII）姓名、**1-based** 的逐列錯誤行號，以及**絕不靜默丟棄資料列**。完整合約見 [Issue #1](../../issues/1) 與 [`docs/udflow-run-2026-06-21/00-task.md`](docs/udflow-run-2026-06-21/00-task.md)。

這個任務刻意設計成**正確性關鍵**（parsing / 編碼 / 去重 / 不可信輸入）—— 正是 udflow 偏好用**兩個獨立審查視角**、而非單一視角的領域。

## 證據在哪裡

| 檔案 | 呈現什麼 |
|---|---|
| [`00-task.md`](docs/udflow-run-2026-06-21/00-task.md) | 任務 / 驗收標準 |
| [`01-plan-gate.md`](docs/udflow-run-2026-06-21/01-plan-gate.md) | 需求重述、plan，以及核准前 `git status --short` 為**乾淨** |
| [`02-approval.md`](docs/udflow-run-2026-06-21/02-approval.md) | 釋出實作的核准訊息 |
| [`03-implementation-summary.md`](docs/udflow-run-2026-06-21/03-implementation-summary.md) | 改了什麼 |
| [`04-verification.md`](docs/udflow-run-2026-06-21/04-verification.md) | typecheck / lint / test 輸出 |
| [`05-reviewers.md`](docs/udflow-run-2026-06-21/05-reviewers.md) | 每位入選審查員的發現（逐字） |
| [`06-gatekeeper.md`](docs/udflow-run-2026-06-21/06-gatekeeper.md) | 彙整後的發現 + 最終判決 |
| [`transcript.redacted.md`](docs/udflow-run-2026-06-21/transcript.redacted.md) | 執行 transcript（已遮蔽、流程完整） |

## 自己重現一次

前置需求：裝好 udflow plugin 的 **Claude Code**：

```
/plugin marketplace add simba6507/universal-dev-flow-plugin
/plugin install udflow@kktmarketplace
/reload-plugins
```

接著照 [`RUNBOOK.md`](RUNBOOK.md) 做。簡而言之：從一個乾淨的 branch，執行
`/udflow:run Fix issue #1: implement CSV recipient import validation`，在 plan gate 核准，然後讓它一路跑到 gatekeeper 判決。

## 本機驗證

```
npm ci
npm run typecheck
npm run lint
npm test
```

CI（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）會在每次 push 與 PR 跑同樣的檢查。

## 授權

[MIT](LICENSE)。
