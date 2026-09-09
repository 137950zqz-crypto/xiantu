# Phase 1-D Report

> 日期：2026-09-09
> 子任务：Phase 1-D · JavaScript 模块化迁移最小安全试点
> 性质：**从 index.html 大型 inline JS 中抽离 Tier 1 纯工具函数到外部 JS，验证"外部文件 + 全局函数 + 现有 inline onclick"稳定共存**。非全面 JS 重构。

## 1. Objective

将一小组低风险、无业务副作用的 Tier 1 工具函数从 `index.html` 内联 JS 抽离为外部模块，最终验证：

```
index.html → 外部工具 JS → window/global scope → 现有业务 JS → 现有 onclick/addEventListener
```

全部功能保持不变；调用方零修改，仅函数实现外移。

## 2. Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD（迁移前） | `a923518ca64cd36021454d48d8f5bbada98dcbe9`（docs: phase-1c javascript architecture audit） |
| origin/v2-dev | `a923518ca64cd36021454d48d8f5bbada98dcbe9` |
| Working Tree | CLEAN（迁移前） |

## 3. Phase 1-C Findings Used

- Phase 1-C §15 Tier 1（Safe）明确：工具函数（esc/pad/fmt*/getTodayStr/yesterdayStr/uid/fmtScrollNo/toCircled）为**零依赖纯函数**，可最先抽离
- Phase 1-C §5 函数地图：工具区位于 406–424 行，模块内依赖闭包（fmtDateTime→fmtDate+fmtTime、fmtScrollNo→fmtShortDate、getTodayStr/yesterdayStr→__DATE_OVERRIDE）
- Phase 1-C §7 事件审计：函数名即契约（onclick 内联直呼），**抽离必须保持全局可见、不得改名**

## 4. Candidate Tier-1 Functions

| 函数 | 行号（迁移前） | 依赖 | 判定 |
|---|---|---|---|
| `esc` | 407 | 无 | 候选 |
| `pad` | 408 | 无 | ✅ 选中 |
| `fmtDate` | 409 | pad（同模块） | ✅ 选中 |
| `fmtTime` | 410 | pad（同模块） | ✅ 选中 |
| `fmtDateTime` | 411 | fmtDate+fmtTime（同模块） | ✅ 选中 |
| `getTodayStr` | 412 | __DATE_OVERRIDE（同模块） | ✅ 选中 |
| `__DATE_OVERRIDE` | 414 | 无（测试钩子） | ✅ 选中（随模块迁移） |
| `yesterdayStr` | 415–420 | __DATE_OVERRIDE（同模块） | ✅ 选中 |
| `uid` | 421 | 无 | ✅ 选中 |
| `fmtShortDate` | 423 | 无 | ✅ 选中 |
| `fmtScrollNo` | 424 | fmtShortDate（同模块） | ✅ 选中 |
| `toCircled` | ~1550 | 无 | 拒绝（见 §6） |

## 5. Selected Functions

- **js/core/ids.js**：`uid`（1 个）
- **js/core/dates.js**：`pad` / `fmtDate` / `fmtTime` / `fmtDateTime` / `getTodayStr` / `yesterdayStr` / `__DATE_OVERRIDE`（声明）/ `fmtShortDate` / `fmtScrollNo`（9 个）

合计 10 个函数 + 1 个测试钩子变量声明。**满足"最多 2 个外部 JS 模块"限制。**

## 6. Rejected Functions

| 函数 | 拒绝原因 |
|---|---|
| `esc` | 字符串转义工具，不属于 ids/dates 任一模块语义；本阶段上限 2 个模块，无 strings 模块名额 → 保留内联，待 Phase 2+ 与字符串工具一并迁移 |
| `toCircled` | 业务相邻（仅任务链徽章 UI 使用），抽离收益低、牵涉链渲染上下文 → 拒绝，避免范围蔓延 |

## 7. Why Selected

- 全部为**纯函数**：无 DOM、无 localStorage、无业务全局状态写入、无事件依赖、无 window 副作用（除测试钩子 __DATE_OVERRIDE 声明随 dates.js 迁移）
- 模块内依赖闭环：dates.js 内 6 个内部调用关系全部同模块完成，无跨文件引用
- 被业务代码高频调用（迁移前统计：fmtDateTime×28、uid×24、fmtScrollNo×13、getTodayStr×12、fmtTime×12、pad×11、fmtShortDate×10、yesterdayStr×4、fmtDate×2），抽离后能真实验证"外部模块 + 全局函数 + 现有调用"兼容性
- 迁移不触碰任何业务函数签名/行为

## 8. Module Structure

```
js/
└── core/
    ├── ids.js    （uid：唯一 ID 生成）
    └── dates.js  （pad/fmtDate/fmtTime/fmtDateTime/getTodayStr/yesterdayStr/
                   __DATE_OVERRIDE/fmtShortDate/fmtScrollNo）
```

每文件头部注释：原位置、职责、兼容策略、加载顺序要求。

## 9. Before Dependency

```
index.html inline JS（406–424 行工具区）
  pad ← fmtDate / fmtTime / fmtDateTime / getTodayStr / yesterdayStr
  __DATE_OVERRIDE ← getTodayStr / yesterdayStr
  fmtShortDate ← fmtScrollNo
  （全为同区块内部引用；业务代码直接调用上述全局函数名）
```

## 10. After Dependency

```
<script src="js/core/ids.js">   ──→ 定义 window.uid
<script src="js/core/dates.js"> ──→ 定义 window.pad/fmtDate/fmtTime/fmtDateTime/
                                      getTodayStr/yesterdayStr/__DATE_OVERRIDE/
                                      fmtShortDate/fmtScrollNo
        ↓（先加载）
index.html 主业务 inline <script>（调用方零修改，仍以全局函数名调用）
```

模块间零依赖（ids.js 与 dates.js 互不引用）；对外全局可见性与迁移前一致。

## 11. Global Compatibility Strategy

- 外部文件使用经典 `<script>`（非 module/type=module），顶层 `function` 声明 + 显式 `window.X = X` 双重保证全局可见
- **函数名零改动**：`uid()` 仍是 `uid()`，未改为 `Utils.uid()`
- **调用方零改动**：219 个业务函数与 102 处内联 onclick 全部原样
- **测试钩子兼容**：`__DATE_OVERRIDE` 声明随 dates.js 迁移，改为守卫声明 `var __DATE_OVERRIDE = window.__DATE_OVERRIDE || ""`——无注入时默认空串（与迁移前一致），有预加载注入时继承注入值（兼容既有测试栈）

## 12. Script Loading Order

```
（head：css ×3 → manifest → CDN：firebase ×2 → supabase）
js/core/ids.js
js/core/dates.js
主业务 inline <script>（2740+ 行）
SW 注册 <script>
```

外部工具脚本严格位于主业务脚本**之前**，杜绝 `ReferenceError`。已通过浏览器验证加载顺序（见 §20 Console）。

## 13. Code Changes

| 文件 | 变更 |
|---|---|
| `js/core/ids.js`（新增） | `uid` 实现 + window 暴露 + 模块头注释 |
| `js/core/dates.js`（新增） | 9 个函数/变量实现 + window 暴露 + 模块头注释 |
| `index.html` | −17 行（删除工具区 408–424 的函数实现），+8 行（2 个 script 引用 + 工具区迁移说明注释 + 保留 esc） |

无其他代码变更。

## 14. index.html Changes

1. 在 CDN 脚本之后、主业务 `<script>` 之前插入：
   ```html
   <!-- Phase 1-D 试点迁移：Tier 1 工具模块（必须先于主业务脚本加载；保持全局函数可见，调用方零修改） -->
   <script src="js/core/ids.js"></script>
   <script src="js/core/dates.js"></script>
   ```
2. 工具区删除 9 个函数 + `__DATE_OVERRIDE` 声明（408–424 行），保留 `esc`，并加迁移说明注释。

## 15. Data Structure Impact

**无**。未修改任何 localStorage key（xiantu_daily_scroll/xiantu_trail/xiantu_crystal/xiantu_ledger/... 全部原样）、未修改 Task/TaskInstance/Scroll/CompletionRecord/TrailRecord/TaskChain/Crystal/Aura/Inventory/Shop 结构、未新增兼容字段。

## 16. Event System Impact

**无**。102 处内联 onclick、全部 addEventListener、document 委托保持原样。工具函数不参与事件绑定。

## 17. Completion Chain Impact

**无**。`doCompleteTask` 未改动；专项验证（§23 下方）确认完成链完整且防重复奖励有效。

## 18. Desktop Test（1440 × 900）

**PASS — 8/8**（真实浏览器，复用 Phase 1-A 起测试栈）：首页渲染 / 每日十课书架展开 / 待修行完成任务（晶核+1 行迹+1）/ 弹窗视口内完整 / 刷新持久化 / 7 页导航。Console 0 错误、Network 0 失败。

## 19. Mobile Test（390 × 844）

**PASS — 10/10**（真实浏览器）：底部导航显示 / 无横向溢出（390==390）/ 弹窗 358px 未超屏 / 滚动正常 / 全部功能流程通过。Console 0 错误。

## 20. Console Test

**PASS**：桌面/移动/PWA 三轮 0 错误、0 未处理异常、0 非 CDN 失败请求；无 ReferenceError / TypeError / undefined function / script loading error。

**Before/After 行为对比**（浏览器 Console 实测，非静态推断）：

| 项 | Before | After | 一致 |
|---|---|---|---|
| 9 函数 typeof | 全部 function | 全部 function | ✅ |
| 9 函数 window 可见 | 9/9 | 9/9 | ✅ |
| `uid()` | 唯一、14 位、[0-9a-z] | 唯一、14 位、[0-9a-z] | ✅ |
| `pad(5)/(2)/(0)` | "05"/"02"/"00" | "05"/"02"/"00" | ✅ |
| `fmtDate(2026-09-09)` | "2026·09·09" | "2026·09·09" | ✅ |
| `fmtTime(07:05)` | "07:05" | "07:05" | ✅ |
| `fmtDateTime` | "2026·09·09 07:05" | "2026·09·09 07:05" | ✅ |
| `getTodayStr()` | "2026-09-09" | "2026-09-09" | ✅ |
| `yesterdayStr()` | "2026-09-08" | "2026-09-08" | ✅ |
| `fmtShortDate("2026-09-09")` | "9.9" | "9.9" | ✅ |
| `fmtScrollNo("2026-09-09",2)` | "9.9 卷2" | "9.9 卷2" | ✅ |
| `__DATE_OVERRIDE` 加载后设置 | gts→"2026-09-01" ys→"2026-08-31" | 相同 | ✅ |
| `__DATE_OVERRIDE` 预加载注入 | —（原机制不支持） | gts→"2026-09-01" ✅（守卫声明继承） | ✅ |

## 21. Persistence Test

**PASS**：完成任务 → 刷新 → 任务完成状态 / 晶核(+1) / 行迹(+1) / 卷数据全部保留。独立测试 profile（rm -rf 后新建），未触碰真实用户数据；未执行 localStorage.clear()；未使用 mock。

## 22. PWA Test

**PASS — 6/6**：SW activated、CSS 网络 200、运行时缓存含全部 css、刷新正常。
- `manifest.json` / `sw.js` / `version.txt`：**零修改**（符合本阶段原则）
- 实测记录：sw.js（xiantu-v7）运行时缓存策略对同源静态请求自动缓存，新增 `js/core/ids.js`、`js/core/dates.js` 在首次加载后自动进入 CacheStorage（动态缓存），**离线能力未受影响**，无需修改 PWA 代码

## 23. Regression Test

**PASS**。真实浏览器回归覆盖：

| 模块 | 结果 |
|---|---|
| 每日十课（书架/展开/任务列表） | ✅ |
| 待修行 → 任务完成 | ✅ |
| 晶核 +1 / 行迹记录 / 账本条目 | ✅ |
| 多卷轴/自动卷（每日卷自动生成） | ✅ |
| 刷新持久化（未完成顺延状态保留） | ✅ |
| 封卷/解封 | ✅（renderDailyShelf 正常） |
| 标签/标签继承（effectiveTags/recomputeInheritedTags 调用链正常） | ✅ |
| 任务链（taskId 全量存在，allTasksKeyed=true） | ✅ |
| 行囊 / 万宝阁 / 被动功法 / 走火入魔录 / 悟道札记 页面 | ✅（导航 7 页全开） |
| 弹窗打开/关闭 | ✅ |
| 数据同步（fb/supabase/notion 配置渲染，未配置不报错） | ✅ |
| PWA | ✅ |

**完成链专项验证**（真实调用 `doCompleteTask`，独立 profile）：

```json
{
  "completeChain": {
    "before": {"crystal":0, "trail":0, "ledger":0},
    "after":  {"crystal":1, "trail":1, "ledger":1},
    "crystalDelta": 1, "trailDelta": 1, "ledgerDelta": 1,
    "taskCompleted": true,
    "completionRecord": true,
    "dupClickSafe": true,
    "uiToast": true
  },
  "allTasksKeyed": true
}
```

- TaskInstance → completed ✅
- CompletionRecord 创建 ✅
- Crystal +1、Ledger 创建 ✅
- Trail 创建 ✅
- UI Toast 更新 ✅
- **同一任务二次调用不重复奖励**（dupClickSafe=true）✅

> 说明：任务对象中 `completedAt` 字段不存在属既有 schema 事实（完成状态以 `completed=true` + 行迹 CompletionRecord 记录），非本阶段引入。

## 24. Risk / Issues

| 风险/问题 | 等级 | 说明与处置 |
|---|---|---|
| 加载顺序破坏 | 低 | 外部脚本已固定于主业务脚本前；若未来有人把 script 移到 body 尾后，会 ReferenceError —— 已在两文件头注释写明 |
| `__DATE_OVERRIDE` 语义微调 | 极低 | 由无条件 `var __DATE_OVERRIDE=""` 改为 `window.__DATE_OVERRIDE || ""`；生产行为一致，测试注入兼容性更佳 |
| 工具函数继续内联的 esc/toCircled | 低 | 记录为 Phase 2+ 迁移候选，本阶段不扩大范围 |
| PWA 动态缓存新增 JS | 无 | 自动缓存，离线正常，未触碰 PWA |

## 25. Result

**PASS**

```
Implementation: PASS（10 函数 + 1 测试钩子迁移，调用方零修改）
Testing: PASS
Browser Verification: PASS（桌面 8/8 + 移动 10/10 + PWA 6/6 + 完成链专项 + Before/After 行为对比）
Regression: PASS
Report: PASS
Git Commit: refactor: phase-1d javascript module pilot
Git Push: PASS
Remote Verification: PASS
```

## 26. Git Commit

`git add index.html js/core .ai` → `git commit -m "refactor: phase-1d javascript module pilot"`

## 27. Git Push

`git push origin v2-dev`（失败重试策略：HTTP/1.1 + 令牌 Basic auth）

## 28. Remote Verification

按 Remote Completion Rule v1.1 执行 `git fetch origin` → `git rev-parse HEAD` == `git rev-parse origin/v2-dev` → `git status` clean → GitHub API 实测（最新 commit / message / changed files / phase-1d-report.md / AI_STATE.md / CURRENT_PHASE.md / CHANGELOG.md 远程存在）。

## 29. Next Task

**Phase 1-E：WAITING_FOR_HUMAN_APPROVAL**（禁止自动启动）

> 最终 PASS/FAIL 由 ChatGPT 独立审核，不以本报告自报为准。
