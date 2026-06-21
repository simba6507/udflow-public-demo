# 03 — Implementation summary（實作摘要）

[English](03-implementation-summary.md) · **繁體中文**

分兩階段：最初的實作，以及 gatekeeper 回傳 `FIX REQUIRED` 後的一次修復（見 [`06-gatekeeper.zh-TW.md`](06-gatekeeper.zh-TW.md)）。本檔案反映**最終狀態**。

## 變更的檔案
- `src/importRecipients.ts` —— 替換掉 `throw new Error('not implemented')` 的 stub 主體（`+95 / -6`）。已釘死的型別（`Recipient`、`RowError`、`ImportResult`）與 `importRecipients` 簽名逐字保留。無新增 export、無新增相依套件。
- `src/importRecipients.test.ts` —— **新增**的行為測試檔（vitest），25 個案例。
- `src/importRecipients.smoke.test.ts` —— 未更動（仍為綠）。設定檔皆未更動。

## 作法
- 以 `/\r\n|\r|\n/` 切分輸入（涵蓋 CRLF／CR／LF）。
- 驗證表頭（`hasValidHeader`）：須剛好兩欄，（去空白、不分大小寫後）依序為 `email` 再 `name`；失敗則回傳一個 `RowError{line:1}` 且不解析任何資料列。空白／純空白輸入會短路到同一個第 1 行錯誤。
- 去除結尾「連續的空行」（終端換行造成的殘留）但不移除表頭；資料**中間**的空行仍視為「格式錯誤列」錯誤。
- 每筆資料列（1-based `lineNumber = i + 1`）：須剛好 2 個以逗號分隔的欄位，否則為格式錯誤列。兩欄皆去空白。接著依序：拒絕未通過 `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` **或** `ASCII_EMAIL_RE = /^[\x21-\x7E]+$/`（可列印 ASCII）的 email；拒絕空姓名；拒絕含 C0/C1 控制字元（`CONTROL_RE = /[\x00-\x1F\x7F-\x9F]/`）的姓名；拒絕不分大小寫的重複（key＝`email.toLowerCase()`，保留第一筆、用去空白後的原始大小寫）。否則 push 進 `Recipient`。
- 每個被拒絕的列都剛好 push 一個 `RowError` 並 `continue` —— 不靜默丟棄、不重複計數。

## 假設
- 「缺表頭」包含「第一行看起來像資料」的情況 —— 一律回報為同一個第 1 行表頭錯誤；不另外偵測「表頭看起來像資料」。
- **`email` 與 `name` 皆為必填** —— 去空白後為空的欄位會被拒絕。（這是合約留白的模糊處；gatekeeper 確認「拒絕空的必填欄位」是安全的判斷，無需回頭詢問使用者。）
- email 限制為**可列印 ASCII** —— 國際化（IDN／非 ASCII local part）的 email 會被拒絕。合約要求保留多位元組的是**姓名**，而非 email。
- 錯誤訊息的措辭不屬於合約（測試只斷言 `line` 與數量）。

## 引入／降低的風險
- **降低：** 對 email 與 name 的控制字元注入（NUL/ESC/DEL/C1）；Unicode 同形字去重碰撞（`U+212A` Kelvin → `k`）；位置相依的結尾空行誤報；靜默接受空的必填欄位。
- **引入：** ASCII email 限制會拒絕「合法但非 ASCII」（IDN）的位址 —— 一個刻意的安全取捨，已揭露。
- **接受（非阻擋）：** 不設輸入大小／列數上限（純函式、線性；ReDoS 已積極排除 —— 屬呼叫端的邊界責任）。Bidi／zero-width 字元可能進入 `name` —— 這是下游 render／send sink 的議題，不屬於這個「無輸出 sink」parser 的責任，且移除它們會違反「逐字保留多位元組」的合約。
