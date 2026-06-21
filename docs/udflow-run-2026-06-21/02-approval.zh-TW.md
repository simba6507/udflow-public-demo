# 02 — Approval（核准）

[English](02-approval.md) · **繁體中文**

- 核准時間：**2026-06-21**（在 session 進行中、第一次驗證執行（本機約 09:07）之前；確切的分鐘數未另外擷取 —— 此處不杜撰）。
- 核准機制：使用者透過 `ExitPlanMode` **核准計畫**（Claude Code 的 plan-gate 接受動作），在此之前已先以 `AskUserQuestion` 回答選擇了**嚴格雙欄** CSV 解析（見 [`01-plan-gate.zh-TW.md`](01-plan-gate.zh-TW.md)）。
- 核准訊號（逐字，由 harness 回傳）：

```
User has approved your plan. You can now start coding.
```

在此之後 —— 且唯有在此之後 —— `implementer` subagent 才獲准寫入檔案。直到這一刻，`git status --short` 都確認為空。
