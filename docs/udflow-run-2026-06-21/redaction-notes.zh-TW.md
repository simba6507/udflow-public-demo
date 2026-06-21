# Redaction notes（遮蔽說明）

[English](redaction-notes.md) · **繁體中文**

公開的 [`transcript.redacted.zh-TW.md`](transcript.redacted.zh-TW.md) 衍生自本機的原始 session transcript；後者**未**提交（位於使用者的 `~/.claude/projects/…` 目錄、在 repo 之外；repo 的 `.gitignore` 另外排除 `*.raw.jsonl`／`*.raw.md`／`docs/**/transcript.raw.*`）。

## 已遮除
- [x] 本機絕對路徑（`C:\Users\…`、`D:\github\…`）→ `~`／`<repo>`
- [x] 家目錄／使用者名稱路徑（`~/.claude/...` 的 transcript 位置、暫存 task-output 路徑）
- [x] Token／API key／cookie／環境變數 —— 原本就沒有；session 期間**未**執行 `gh auth status`（它會印出 token）
- [x] 私有 repo 名稱 —— 僅以 `<repo>`／（即將公開的）demo repo 指稱
- [x] 無關的 shell 輸出（npm banner、內部 subagent task-ID 與暫存輸出檔路徑）
- [x] 不該公開的內部系統／工具內容（原始 tool-call 管線、harness reminder 區塊、subagent transcript 檔路徑）

## 已保留（已確認存在於遮蔽後的 transcript）
- [x] 使用者任務
- [x] 需求理解／重述
- [x] 計畫
- [x] 核准
- [x] 變更檔案摘要
- [x] 驗證指令 + 輸出摘要
- [x] 每位審查員的發現（兩輪）
- [x] 修復迴圈（一次迭代）
- [x] Gatekeeper 最終判決

## 確認
未移除任何工作流程階段；僅遮除上述類別。transcript 完整保留以下序列：任務 → 重述 → plan gate → 核准 → 實作 → 驗證 → 審查第 1 輪 → gatekeeper `FIX REQUIRED` → 修復 → 驗證 → 審查第 2 輪 → gatekeeper `READY`。
