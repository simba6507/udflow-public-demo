# 05 — Reviewers（審查員）

[English](05-reviewers.md) · **繁體中文**

各入選審查員逐字回報的發現。本次執行有**兩輪審查**：最初的陣容（浮現四個 `major`）以及修復後的再審。嚴重度標籤（`blocker`／`major`／`minor`）是審查員自己給的。此處沒有任何造假。

## 入選陣容（與理由）
針對一個**由攻擊者控制輸入的 CSV parser**（parsing／編碼／去重／不可信輸入）所需的最小充分集合：
- **spec-reviewer** —— 核心；需求與合約的吻合度。非瑣碎工作一律入選。
- **test-reviewer** —— 核心；覆蓋率、邊界／失敗路徑、回歸風險。一律入選。
- **code-reviewer** —— 條件式；非瑣碎邏輯（regex、索引、分支順序）。
- **security-reviewer** —— 條件式；驗證邊界上的不可信輸入。

未入選（不適用）：`architecture-reviewer`、`operability-reviewer`（單一純函式，無整合／持久化／部署面）、`ui-ux-reviewer`（無 UI）。

---

## 第 1 輪 —— 最初陣容

### spec-reviewer —— 無 `blocker`；**2 個 major**、2 個 minor
- **MAJOR-1（結尾空行）：** `email,name\na@b.com,Alice\n\n` → 在第 3 行誤報「格式錯誤列」（且 `\n\n\n` → 第 3、4 行）。`i === lastIndex` 的防護只寬恕單一結尾空行；而結尾的**空白行**（兩個終端換行 —— 真實匯出工具常見）會被誤報。位置上不一致。修法：把結尾空行的處理改成「與位置無關」＋ 為 `\n\n`／`\n\n\n` 補測試。
- **MAJOR-2（空的必填欄位）：** `a@b.com,`（合法 email、空姓名）被**靜默接受**為 `{email:'a@b.com', name:''}` —— 一個隱藏的業務規則假設。合約對空的必填欄位未表態。修法：定下規則（建議拒絕）＋ 測試，或明確記錄為接受。
- Minor：只有表頭的輸入回傳 `{[],[]}`、沒有正向訊號（未記錄的角落情況，非缺陷）；「缺表頭 vs 第一行像資料」會丟失資料診斷（符合已記錄的假設）。

### test-reviewer —— 無 `blocker`／`major`；皆 minor
- 9 條驗收條款都以嚴謹斷言（精確的行號陣列／物件）演練到了。
- **Minor：** 空 email 欄位（`,Bob`）與空姓名接受（`a@b.com,` → `{email, name:''}`）是真實但未測的分支；建議補上。
- **Minor：** 「不靜默丟棄」的綜合測試把「5 筆資料列」與結尾換行跳過混在一起；建議補一個「無結尾換行」的計數案例。
- 已確認去重不重複新增、姓名大小寫不同已被隱含覆蓋。

### code-reviewer —— 無 `blocker`／`major`；2 個說明性 minor（無需處理）
- 追蹤 parsing／去重／行號在所有變更路徑上皆正確（含結尾換行、CRLF、去重大小寫）。
- **Minor（不需改）：** 因 `noUncheckedIndexedAccess` 而被迫加上的、看似多餘但必要的 `?? ''` 防護。
- **Minor（不需改）：** email regex 依釘死的規格刻意放寬。

### security-reviewer —— 無 `blocker`；**2 個 major**、1 個 minor
- **MAJOR-1（控制字元）：** `EMAIL_RE` 只排除 `@` 與 `\s`；NUL/BEL/BS/ESC/DEL 全都能通過 `.test()`。已實證確認。而 `name` 欄位**從未驗證**（只去空白）。逐字回傳含 NUL/ESC 的值是下游暴險（NUL 截斷、終端跳脫注入、表頭夾帶）。修法：拒絕 email 與 name 中的 C0/C1 控制字元。
- **MAJOR-2（同形字去重碰撞）：** `"Kelvin@b.com"`（KELVIN SIGN `U+212A`）通過 regex 後 `.toLowerCase()` → `"kelvin@b.com"`，與真正的 `"Kelvin@b.com"` 碰撞 —— 去重 key 被污染。修法：將 email 限制為 ASCII，及／或對去重 key 做 NFKC 正規化。
- **Minor：** 無輸入大小／列數上限（線性；可說是呼叫端的責任）。
- 明確排除：**ReDoS** —— 該 regex 為線性（100 萬字元最壞情況約 3 ms）。

---

## 第 2 輪 —— 修復後再審

### spec-reviewer —— 先前兩個 major **皆已解決**；無 `blocker`／`major`；2 個 minor
- 於執行期驗證：結尾 `\n`／`\n\n`／`\n\n\n` → 不誤報；中間空行仍在正確行號報錯；空 email 與空姓名都在第 2 行被拒。新增的 ASCII-email + 控制字元-name 拒絕**不違反**「完整保留多位元組姓名」（CJK／重音／emoji／NBSP 仍接受）。不靜默丟棄與 1-based 行號維持正確。
- **Minor：** 空 email 的訊息 `Invalid email address: ""` 不如 `Missing name.` 精確 —— 可加一個 `Missing email.` 分支以求對稱。
- **Minor：** 天真的逗號切分（無 RFC-4180 引號處理）—— **既有問題**，在釘死的範圍之外，且為「大聲失敗」（不會靜默誤解析）。

### security-reviewer —— 先前兩個 major **皆已關閉**（以直接探測驗證）；無 `blocker`／`major`；1 個 minor
- ASCII 閘門在 `toLowerCase()` **之前**就拒絕所有 C0/C1/DEL 與 `U+212A`；掃過每個 `0x21–0x7E` 碼位 —— 無殘留的大小寫摺疊碰撞。ReDoS 再次排除（錨定的單一字元類別 regex，對 10 萬字元的對抗性輸入約 0.1–0.25 ms）。
- **Minor：** Bidi／zero-width／格式字元（`U+202E` RLO、`U+200B` ZWSP）會進入 `name`。**刻意**評為 minor：這是一個無 sink 的純 parser，且合約要求逐字保留多位元組，因此移除會違反規格；相稱的處理是加一條文件註記 —— 防禦應放在 render／send sink 端。**此處建議不改碼。**

### code-reviewer —— 無 `blocker`／`major`；1 個 minor
- `noUncheckedIndexedAccess` 已滿足；`eslint-disable no-control-regex` 範圍正確且狹窄；regex 範圍已實證；`end` 索引迴圈無 off-by-one；分支順序確保每筆壞列剛好一個錯誤。
- **Minor：** 純空白的結尾行（`...\n   `）會被回報為格式錯誤而非被去除（嚴格的 `=== ''` 比對）—— 在「不靜默丟棄」下可辯護；若想去除，一行修法 `(lines[end-1] ?? '').trim() === ''`。屬判斷取捨，標記以示審慎。

### test-reviewer —— 無 `blocker`／`major`；皆 minor（以 mutation testing 驗證）
- 透過碼位檢視 + **mutation testing** 驗證每條新斷言都非恆真、且能抓回歸：Kelvin 測試確實帶有 `U+212A`；控制字元測試帶有真正的 NUL/BEL 位元組；空姓名 vs 空 email vs 控制字元分支各自獨立釘死；「全部去除 vs 只去除一個」可被區分；計數測試能抓靜默丟棄。既有的中間空行 + 多位元組測試未被弱化。
- **Minor：** email 控制字元測試只涵蓋 local part 的 C0 NUL，未涵蓋 C1/DEL 或網域端 —— 建議補如 `a@b\x7f.com`（回歸防護；程式碼已會拒絕）。
- **Minor：** `CONTROL_RE` 的上邊界（`\x9F` 之上一點，如 `U+00A0`）未釘死為「接受」—— 建議補一個邊界接受案例（回歸防護；程式碼已會接受 `U+00A0`）。
- **Minor：** 計數說明 —— 行為測試檔有 25 個 `it` 區塊；連同 smoke test 全套為 26。
