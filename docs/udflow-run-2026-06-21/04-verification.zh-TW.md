# 04 — Verification（驗證）

[English](04-verification.md) · **繁體中文**

於實作後執行一次、修復後再執行一次。orchestrator 會**獨立重跑**全部三個指令（不只信任 subagent 的回報）。

## 指令
```
npm run typecheck
npm run lint
npm test
```

## 輸出摘要
**最終狀態 —— 全綠：**
- `npm run typecheck` → `tsc --noEmit`，exit 0，無輸出。（tsconfig `strict` + `noUncheckedIndexedAccess`。）
- `npm run lint` → `eslint .`，exit 0，0 problems（僅在那段刻意的控制字元 regex 上，加了一處範圍極窄的 `eslint-disable-next-line no-control-regex`）。
- `npm test` → `vitest run`：**Test Files 2 passed (2)、Tests 26 passed (26)**（`importRecipients.test.ts` 25 個行為測試 + 1 個 scaffold smoke test）。

第 1 輪（最初實作）在 17 個測試時即為綠；修復階段新增了分支與測試，使測試數來到 26。

## 實際被測試套件演練到的高風險邊界輸入
- **空／純空白輸入** → 單一第 1 行錯誤，無收件人。
- **缺表頭／順序顛倒（`name,email`）／欄數錯誤的表頭** → 第 1 行錯誤，不解析資料。
- **格式錯誤的列** —— 1 欄與 3 欄 → 在正確的 1-based 行號報錯；**中間空行** → 格式錯誤；**結尾空行**（`\n\n`、`\n\n\n`）→ 不誤報。
- **格式錯誤的 email** —— 缺 `@`、缺網域的點、中間有空格。
- **空的必填欄位** —— 空 email（`,Bob`）與空姓名（`a@b.com,`）→ 拒絕。
- **控制字元／同形字** —— email 內含 NUL、姓名內含 BEL、`U+212A` Kelvin 記號的 email → 全部拒絕；合法的多位元組（`山田太郎`、`Renée`、`Joy 😀`）仍逐字接受。
- **重複 email、不分大小寫**（先 `A@B.com` 後 `a@b.com`）→ 保留第一筆（原始大小寫），第二筆在正確行號報錯。
- **換行** —— CRLF（`\r` 不會滲入最後一欄）與單獨的 CR。
- **不靜默丟棄** —— `recipients.length + errors.length === 資料列數`，在「有」與「沒有」結尾換行兩種情況下都斷言。
