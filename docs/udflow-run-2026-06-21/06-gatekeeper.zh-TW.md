# 06 — Gatekeeper（守門）

[English](06-gatekeeper.md) · **繁體中文**

gatekeeper 執行了**兩次**：最初陣容後一次（判決 `FIX REQUIRED`），修復 + 再審後一次（判決 `READY`）。

## 第 1 次 —— 判決 `FIX REQUIRED`

### Blockers
無。

### Major（必須修）
1. **SEC-M1** —— 控制字元（C0/C1）繞過 email 驗證；`name` 從未驗證。
2. **SEC-M2** —— `U+212A` Kelvin 記號經 `toLowerCase()` 造成去重 key 碰撞。
3. **SPEC-M1** —— 結尾空行（`…\n\n`）被誤報為格式錯誤列。
4. **SPEC-M2** —— 空的必填欄位被靜默接受（`a@b.com,` → `{email, name:''}`）。由建議層級**重新分類為必須修**；gatekeeper 接受「拒絕空的必填欄位」為**安全的 orchestrator 判斷**，而非需回頭詢問使用者的產品決策。

### Minor
提升為「隨修復一起併入」：空 email／空姓名分支的測試；一個無結尾換行的計數測試。維持原樣／非阻擋：`?? ''` 防護、寬鬆 regex 註記、只有表頭的角落情況、輸入大小上限。

### 衝突解決
無審查員彼此衝突。`code-reviewer` 的「不需改」較為狹隘（在變更路徑上追蹤了功能正確性，但未對攻擊者輸入或結尾空白的拓樸建模）；`security-reviewer` 與 `spec-reviewer` 提供了具體重現，因此以其 major 為準。四個 major 皆經獨立重現再確認。

### 修復（一次迭代）
1. 與位置無關的結尾空行去除（中間空行仍報錯）。
2. 拒絕去空白後為空的 email **或** name。
3. 對 email 套 `ASCII_EMAIL_RE = /^[\x21-\x7E]+$/` —— 一道防護同時關閉 SEC-M1（email 側）**與** SEC-M2；`CONTROL_RE = /[\x00-\x1F\x7F-\x9F]/` 拒絕 `name` 中的控制字元，同時保留 CJK／重音／emoji。
4. 為所有新分支補測試 + `\n\n`／`\n\n\n` 與「無結尾換行」案例。
輸入大小上限刻意保留不做，列為已接受的非阻擋項。

---

## 第 2 次 —— 判決 `READY`

### Blockers
無。

### Major
無。先前四個 major 皆經獨立確認已解決（以執行期探測，而非僅重讀）：同形字／控制字元閘門在 `toLowerCase()` 之前執行；C1/DEL/NUL 在 local 與網域端皆被拒；C1-vs-Latin-1 邊界正確；結尾／中間空行處理正確。

### Minor（皆為可選後續；無一阻擋發布）
- 空 email 訊息精確度（為對稱加 `Missing email.`）。
- 天真逗號切分／無 RFC-4180 引號 —— 既有、範圍外、且為大聲失敗。
- Bidi／zero-width 字元進入 `name` —— security-reviewer 明確建議**不改碼**（無 sink 的 parser + 逐字保留多位元組的合約）；僅加文件註記。
- 純空白的結尾行被報為格式錯誤 —— 刻意的判斷取捨。
- 兩個與安全相關的測試 minor（C1/DEL email 案例；`CONTROL_RE` 邊界接受案例）—— gatekeeper 以直接探測確認程式碼**已**正確，因此這些屬**回歸防護強化、而非缺陷**；可作為後續，建議下次動到此檔時補上。

### 衝突解決
無實質衝突。唯一一處審查員原可推動改碼之處（security-reviewer 對 Bidi／zero-width 字元）已附明確理由**自行裁定為不改**（無輸出 sink + 逐字保留合約）；gatekeeper 採納此立場。無任何 minor 被向上重評 —— 沒有一條描述了具體的錯誤結果。

### 修復迴圈
共一次迭代（第 1 輪 → 修復 → 第 2 輪）。無需第二次修復。

## 最終判決
**`READY`**

## 理由
先前四個 major 皆解決並以執行期探測獨立再驗證；typecheck、lint 與完整 26 個測試在 gatekeeper 自己的執行中全數通過。本次變更的高風險／邊界輸入（控制字元、同形字、結尾／中間空行、去重大小寫摺疊、CRLF/CR、缺欄位）各自由非恆真、且經 mutation testing 確認的測試演練到。每個未結項目都是真正的 `minor` 或對「已正確行為」的防護 —— 無一阻擋發布。

**Failure-memory 決定：** 不需要 —— 第 1 次的 major 已在 session 內解決、無跨迭代重複的 blocker 類別，且教訓已編碼為釘死的回歸測試（更持久的預防）。未寫入 `ai/FAILURE_MEMORY.md`。

**模型：** gatekeeper 在 Opus 4.8（1M context）上執行；完整判決信心，無 fallback。
