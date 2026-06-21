# 00 — 任務

[English](00-task.md) · **繁體中文**

> 真實依據來源：**Issue #1**。本檔案是它的鏡像，讓這份證據包自成一體、可獨立閱讀。

## 目標
在 `src/importRecipients.ts` 實作 `importRecipients(csv: string): ImportResult`。

## 合約
- 必填表頭：`email,name`（缺少則拒絕）
- 去除欄位前後空白
- 拒絕格式錯誤的 email
- 拒絕重複 email（不分大小寫）
- 完整保留非 ASCII／多位元組姓名
- 逐列錯誤需附 **1-based** 行號（表頭為第 1 行）
- **不可**靜默丟棄格式錯誤的資料列 —— 每一筆壞資料都要產生一個錯誤項

## 回傳型別
`ImportResult { recipients: Recipient[]; errors: RowError[] }`（型別已在 stub 中釘死）。

## 測試（驗收）
至少涵蓋：缺表頭 · 格式錯誤的列／email · 重複 email（不分大小寫）· 多位元組姓名保留。

## 完成定義
`npm run typecheck && npm run lint && npm test` 全綠；並記錄 udflow gatekeeper 的判決。
