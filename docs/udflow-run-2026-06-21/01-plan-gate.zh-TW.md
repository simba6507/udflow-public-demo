# 01 — Plan gate（計畫關卡）

[English](01-plan-gate.md) · **繁體中文**

於 plan gate、**核准之前**擷取。udflow 先進入 Claude Code 的原生 plan mode（唯讀），完成需求理解與 grounding，提出一個界定範圍的問題，再透過 `ExitPlanMode` 提出計畫。

## 任務（逐字）
```
/udflow:run Fix issue #1: implement CSV recipient import validation
```

## udflow 的需求重述
在 `src/importRecipients.ts` 實作 `importRecipients(csv: string): ImportResult`，取代 scaffold stub，符合 Issue #1 合約：

- 必填表頭 `email,name`（缺少／錯誤則拒絕）。
- 去除欄位前後空白。
- 拒絕格式錯誤的 email。
- 拒絕重複 email（不分大小寫）。
- 完整保留非 ASCII／多位元組姓名。
- 逐列錯誤附 **1-based** 行號（表頭為第 1 行）。
- 絕不靜默丟棄格式錯誤的列 —— 每筆壞資料都產生一個錯誤項。

判定為**高風險／正確性關鍵**（不可信輸入、parsing、編碼、去重），因此本次執行預先承諾採用**兩個獨立的審查視角**，而非單一視角。

## 在關卡浮現的決策（AskUserQuestion）
合約未定義 CSV 的欄位分隔／引號處理。提供的選項：**嚴格雙欄**（以逗號切分、每筆資料列剛好 2 欄、不處理引號）對上 **RFC 4180 引號規則**。使用者選擇 **嚴格雙欄** —— 姓名不可含逗號；1 欄或 3 欄以上的列視為「格式錯誤列」錯誤。

## 計畫（透過 ExitPlanMode 提出）
**收斂後的合約：** 表頭須剛好兩欄，（去空白、不分大小寫後）依序解析為 `email` 再 `name`，否則回傳一個 `RowError{line:1}` 且不解析任何資料；去除欄位空白、內部多位元組完整保留；嚴格雙欄；務實的 email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`；不分大小寫去重（保留第一筆、保留去空白後的原始大小寫，之後重複者→錯誤）；1-based 行號；不靜默丟棄。

**導向驗證的邊界檢查清單：** 空白／純空白輸入→第 1 行錯誤；只有表頭沒資料→空結果；結尾 EOF 換行→不誤報；中間空行→格式錯誤；混用 `\r\n`／`\n`；不分大小寫重複；多位元組姓名；格式錯誤的 email；表頭順序／大小寫。

**作法：** 單一檔案 `src/importRecipients.ts`（替換 stub 主體，逐字保留已釘死的型別／簽名）＋ 新增 `src/importRecipients.test.ts`；以 `/\r\n|\r|\n/` 切行；先驗證表頭→失敗即提早返回；以 1-based 索引逐列處理；少量區域性 helper；不新增相依套件。

**驗證：** `npm run typecheck`／`npm run lint`／`npm test`。

**審查與就緒判定：** 審查陣容 `spec` + `test`（核心）+ `code` + `security`（輸入處理風險），再由 `gatekeeper` 收尾。

## 核准前工作區是乾淨的
```
$ git rev-parse --abbrev-ref HEAD
feat/csv-recipient-import

$ git status --short
（空白 —— plan mode 期間 plan-gate hook 會擋下所有編輯）
```
