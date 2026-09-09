# Phase 2-A Report

> 日期：2026-09-09
> 子任务：Phase 2-A · Store 层设计 + 最小安全迁移试点
> 性质：在既有 `js/core/storage.js` 之上建立 Store 数据访问边界，并迁移**极少量**真实读取路径。非全面 Store 化 / Service 层 / Domain 重构。

## 1. 基线

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD（迁移前） | `8c62f2adb5b807c8f9698f790080f6b3db439ddb`（refactor: phase-1e storage module pilot） |
| origin/v2-dev | `8c62f2adb5b807c8f9698f790080f6b3db439ddb` |
| Working Tree | CLEAN（迁移前） |

> 确认非 71c5cf8；未重做 Phase 1-E。

## 2. Storage 当前状态

- `js/core/storage.js`（Phase 1-E 产物）：12 个业务 key 常量 + 21 个 Storage Adapter（getXxx/saveXxx），函数体与迁移前逐字符一致，云钩子 `fbAutoUpload(模块)` + `cloudQueueSync()` 由 storage.js 负责
- 本阶段保持其职责不变；**未把业务规则/Domain/UI 塞回 storage.js**

## 3. DailyScrolls 调用链审计

`getDailyScrolls()/saveDailyScrolls()` 全量调用点（40 处，34 个函数，实际代码 grep 定位）：

| 函数 | 行号 | 读/写 | 业务逻辑 | 副作用 | 云同步 | 全局变量依赖 | 修改数据 | 风险 |
|---|---|---|---|---|---|---|---|---|
| validateMigration | 621 | 读 | 是（迁移校验） | 否 | 否 | 否 | 否 | 高 |
| migrateScrollsV4 | 629/710 | 读+写 | 是（迁移） | 是 | 是（save） | 否 | 是 | 极高 |
| normalizeDaily | 766/829 | 读+写 | 是（幂等补全） | 是 | 是（save） | 否 | 是 | 极高 |
| getTodayStats | 929 | 读 | 是 | 否 | 否 | 否 | 否 | 中 |
| renderHome | 945/949 | 读 | 是（含 dashboard） | 否 | 否 | 是 | 否 | 中 |
| continuePractice | 963 | 读 | 是 | 可能（addNewScroll） | 否 | 是 | 否 | 中 |
| getDayScrollIndex | 979 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| getScrollNoById | 986 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| collectAllTags | 993 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| **renderDailyShelf** | **1008** | **读** | 是（渲染） | **否** | **否** | 是 | 否 | **低 ✅** |
| unlockScroll | 1052 | 读+写 | 是（封卷） | 是 | 是（save） | 是 | 是 | 高 |
| resealScroll | 1061 | 读+写 | 是（封卷） | 是 | 是（save） | 是 | 是 | 高 |
| renderScrollOpen | 1072 | 读 | 是（渲染） | 否 | 否 | 是 | 否 | 低 |
| doCompleteTask | 1152 | 读+写 | 是（完成链） | 是 | 是（save） | 是 | 是 | **极高** |
| saveTrailEdit | 1361 | 读+写 | 是（行迹编辑） | 是 | 是（save） | 是 | 是 | 高 |
| findTaskSlotByKey | 1385 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| openEditTask | 1433 | 读 | 是 | 否 | 否 | 是 | 否 | 中 |
| saveEditTask | 1463 | 读+写 | 是（编辑） | 是 | 是（save） | 是 | 是 | 高 |
| delTaskInScroll | 1493 | 读+写 | 是（删除） | 是 | 是（save） | 是 | 是 | 高 |
| compactScroll | 1525 | 读 | 是（补位） | 否 | 否 | 否 | 否 | 中 |
| nextChainNo | 1545 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| findTaskById | 1553 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| findOriginalTaskById | 1561 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| getBranchTasks | 1575 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| getBranches | 1600 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| scrollOfTask | 1644 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| updateTaskById | 1647 | 读+写 | 是（链更新） | 是 | 是（save） | 否 | 是 | 高 |
| addNextTask | 1657/1696 | 读+写 | 是（任务链） | 是 | 是（save） | 是 | 是 | 高 |
| rebuildTodayAuto | 1784 | 读+写 | 是（自动卷） | 是 | 是（save） | 是 | 是 | 极高 |
| ensureTodayScroll | 1805 | 读+写 | 是（自动卷） | 是 | 是（save） | 是 | 是 | 极高 |
| addNewScroll | 1838 | 读+写 | 是 | 是 | 是（save） | 是 | 是 | 高 |
| setTaskAsRoot | 1851 | 读+写 | 是（任务链） | 是 | 是（save） | 是 | 是 | 高 |
| unsetRoot | 1883 | 读+写 | 是（任务链） | 是 | 是（save） | 是 | 是 | 高 |
| delScroll | 1900 | 读+写 | 是（删除） | 是 | 是（save） | 是 | 是 | 高 |
| getModuleData | 2433 | 读 | 否（快照协议） | 否 | 否 | 否 | 否 | 中（云） |
| applyModuleData | 2434 | 写 | 否（快照协议） | 是 | 是（save，suppress） | 否 | 是 | 中（云） |
| cloudSnapshot | 2516 | 读 | 否（快照协议） | 否 | 否 | 否 | 否 | 中（云） |
| uploadAllToNotion | 2648 | 读 | 是（上传） | 是 | 是 | 否 | 否 | 中（云） |
| exportAllData | 2676 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |
| exportSingle | 2697 | 读 | 是 | 否 | 否 | 否 | 否 | 低 |

## 4. Trail 调用链审计

`getTrail()/saveTrail()` 全量调用点：

| 函数 | 行号 | 读/写 | 业务逻辑 | 副作用 | 云同步 | 修改数据 | 风险 |
|---|---|---|---|---|---|---|---|
| validateMigration | 621 | 读 | 是 | 否 | 否 | 否 | 高 |
| migrateTrailV4 | 715/731 | 读+写 | 是（迁移） | 是 | 是 | 是 | 极高 |
| migrateRewardsV4 | 736 | 读 | 是（迁移） | 否 | 否 | 否 | 高 |
| renderHome | 945 | 读 | 是（dashboard） | 否 | 否 | 否 | 中 |
| collectAllTags | 994 | 读 | 是 | 否 | 否 | 否 | 低 |
| doCompleteTask→addCompletion | 1167 | 写 | 是（完成链） | 是 | 是 | 是 | **极高** |
| saveTrailEdit（内部读） | 1192/1218 | 读+写 | 是（行迹编辑） | 是 | 是 | 是 | 高 |
| removeTrailForTask | 1222/1226 | 读+写 | 是（删除） | 是 | 是 | 是 | 高 |
| nextTrailOrder | 1228 | 读 | 是 | 否 | 否 | 否 | 低 |
| **renderTrail** | **1233** | **读** | 是（渲染） | **否** | **否** | 否 | **低 ✅** |
| setTrailTagFilter | 1327 | 读 | 是 | 否 | 否 | 否 | 低 |
| openTrailDetail | 1353 | 读 | 是 | 否 | 否 | 否 | 中 |
| saveTrailEdit | 1369 | 写 | 是（编辑） | 是 | 是 | 是 | 高 |
| setRootOfTrail/unsetRootOfTrail | 1374/1382 | 读+写 | 是（链根） | 是 | 是 | 是 | 高 |
| getModuleData/applyModuleData | 2433/2434 | 读/写 | 否（快照） | 是 | 是 | 是 | 中（云） |
| cloudSnapshot | 2516 | 读 | 否（快照） | 否 | 否 | 否 | 中（云） |
| uploadAllToNotion | 2648 | 读 | 是 | 是 | 是 | 否 | 中（云） |
| exportAllData | 2676 | 读 | 是 | 否 | 否 | 否 | 低 |
| importAllData | 2686 | 写 | 是 | 是 | 是 | 是 | 高 |
| exportSingle | 2697 | 读 | 是 | 否 | 否 | 否 | 低 |

## 5. 最终选择哪个试点

**选择 2 个试点对象：DailyScrolls + Trail**，各迁移 **1 条纯读取路径**：

1. `renderDailyShelf()`（@1008）读取 → `XiantuStore.dailyScrolls.get()`
2. `renderTrail()`（@1233）读取 → `XiantuStore.trail.get()`

## 6. 选择理由

- 两条路径均为 **纯读取、零副作用、零云钩子、零业务判断**（渲染函数入口直接读全量数据）
- 调用点明确、行为确定性高（JSON.parse 每次返回新引用，经 Store 委托无引用差异风险）
- 完成链/自动卷/封卷/迁移/云快照等读+写路径（doCompleteTask、ensureTodayScroll、rebuildTodayAuto、migrate*、applyModuleData 等）全部**不动**——避免云钩子/数据一致性风险
- 满足指令"至少 1 个、最多 2 个试点对象 + 至少一条真实调用路径经过 Store"

## 7. Store API

```js
window.XiantuStore = {
  dailyScrolls: { get() { return getDailyScrolls(); }, save(data) { return saveDailyScrolls(data); } },
  trail:       { get() { return getTrail(); },       save(data) { return saveTrail(data); } }
};
```

## 8. store.js 实际代码职责

- 纯数据访问边界：get/save 各委托 storage.js 对应 Adapter
- **边界实测（浏览器 toString 扫描）**：无 `localStorage`/`sessionStorage`、无 DOM（document/querySelector/innerHTML）、无云同步（fbAutoUpload/cloudQueueSync/firebase/supabase/notion）、无业务判断（if/completed/crystal）——全部为 true
- store.js 语法检查通过（node --check）

## 9. 实际迁移了哪条调用路径

- `renderDailyShelf → XiantuStore.dailyScrolls.get() → getDailyScrolls() → localStorage`
- `renderTrail → XiantuStore.trail.get() → getTrail() → localStorage`

## 10. 未迁移哪些路径

其余 **全部** DailyScrolls/Trail 调用点（38 个函数）保持旧 API 直接调用，包括：完成链（doCompleteTask/addCompletion）、自动卷（ensureTodayScroll/rebuildTodayAuto）、封卷（unlockScroll/resealScroll）、任务链（addNextTask/setTaskAsRoot/updateTaskById）、迁移（migrate*）、云同步（getModuleData/applyModuleData/cloudSnapshot/uploadAllToNotion）、导入导出、备份恢复、其余渲染函数。

## 11. 旧 API 兼容性

`getDailyScrolls/saveDailyScrolls/getTrail/saveTrail` 全部保留：存在、可调用、行为不变（浏览器实测 C_old 全 true）。渐进迁移，未全局替换。

## 12. localStorage key 验证

`xiantu_daily_scroll` / `xiantu_trail` 等 key 名称**零修改**（store.js 未定义任何 key，仅经 storage.js 常量委托）。

## 13. 数据结构验证

Task/Scroll/Trail/CompletionRecord 等结构零修改；store.js 未新增字段/未改变默认值/未改 schema。

## 14. Cloud Hook 验证

浏览器实测链路：`Store.save → saveDailyScrolls → localStorage.setItem + fbAutoUpload("daily") + cloudQueueSync()`；`saveTrail` 同理含 `fbAutoUpload("trail")`。钩子仍由 storage.js 负责，顺序未变，Store 未引入任何新云逻辑。

## 15. Desktop 测试（1440 × 900）

**PASS — 8/8**：首页 / 每日十课书架展开 / 待修行完成（晶核+1 行迹+1）/ 弹窗 / 刷新持久化 / 7 页导航。Console 0 错误、Network 0 失败。

## 16. Mobile 测试（390 × 844）

**PASS — 10/10**：底部导航 / 无横向溢出（390==390）/ 弹窗 358px 未超屏 / 滚动 / 全部功能流程。Console 0 错误。

## 17. Console

**PASS**：0 errors；无 `XiantuStore is undefined` / `getDailyScrolls is undefined` / `saveDailyScrolls is undefined` / `getTrail is undefined` / `saveTrail is undefined`。

**Store 专项（A/B/C/D + 边界 + 持久化）实测结果**：

```json
A_exists: true（collections: ["dailyScrolls","trail"]）
B_api:    dailyIsArr=true, trailIsArr=true（dailyLen=1, trailLen=0）
C_old:    getDailyScrolls/getTrail 均 function，返回数组
D_consistency: daily=true, trail=true, 引用相互独立（JSON 内容一致）
cloudChain:    Store.save→saveDailyScrolls→(setItem+fbAutoUpload+cloudQueueSync) 全 true
boundary:      noLocalStorage/noDOM/noCloud/noBusiness 全 true
持久化:        Store.trail.save 写入 → 真实刷新 → Store.trail.get() 读到（taskId=ST）
PAGE_ERRORS:   []
```

## 18. Persistence

**PASS**：Store.save 写入 → 真实刷新 → Store.get 读取一致；全流程独立测试 profile，未触碰真实用户数据；未执行 localStorage.clear()；未使用 mock。

## 19. Completion Chain

**PASS**：待修行 → doCompleteTask → TaskInstance completed → CompletionRecord 创建 → Crystal +1 → Ledger +1 → Trail +1 → UI 更新；**重复点击不重复奖励**（dupClickSafe=true）。完成链本身未迁移（仍走旧 API），回归无影响。

## 20. Regression

**PASS**：每日十课 / 自动卷 / 封卷 / 行迹 / 标签 / 标签继承 / 任务链 / 晶核 / 灵气 / 行囊 / 万宝阁 / 被动功法 / 走火入魔录 / 悟道札记 / 同步渲染 / PWA 全部通过（桌面 8/8 + 移动 10/10 + PWA 6/6 + 完成链专项）。

## 21. Node Test 状态

**Node test suite: NOT IMPLEMENTED**（仓库无 package.json / 正式测试套件，未伪造 Unit Test）。已执行：`node --check js/core/store.js` 语法检查（静态检查，不冒充测试）。

## 22. Diff 审计

- `git diff --stat`：`index.html | 6 ++++--（+4/-2）`；`js/core/store.js` 新增
- index.html 变更 = script 引用（+2 行）+ 两处读取迁移（2 行替换）
- **未出现**：顺手重构 / 业务逻辑变化 / 数据结构变化 / key 修改 / 全局替换 / 无关文件修改
- 未触碰：manifest.json / sw.js / version.txt / css/ / .github/ / storage.js / ids.js / dates.js

## 23. Commit

`git add index.html js/core/store.js .ai` → `git commit -m "refactor: phase-2a store layer pilot"`

## 24. Push

`git push origin v2-dev`（HTTP/1.1 + 令牌 Basic auth，失败重试）

## 25. Remote HEAD

`git rev-parse origin/v2-dev` == `git rev-parse HEAD`

## 26. Remote Verification

按 Remote Completion Rule：fetch → HEAD==origin/v2-dev → clean → GitHub API 实测（commit / message / changed files / store.js / index.html / 报告 / 状态文件远程存在）。

## 27. 风险

| 风险 | 等级 | 处置 |
|---|---|---|
| Store 仅覆盖 2 条读取路径 | 低 | 有意为之（试点）；其余路径 Phase 2-B+ 按序迁移 |
| 未来全局替换风险 | 低 | 明确禁止；旧 API 保留为渐进迁移锚点 |
| ensureTodayScroll 与 renderDailyShelf 顺序耦合 | 低 | renderDailyShelf 先调用 ensureTodayScroll（旧 API，业务不动），再经 Store 读取——行为未变 |
| 云钩子经 Storage 传递 | 低 | 实测链路完整 |

## 28. 下一阶段建议

- **实际完成**：Store 层建立（XiantuStore.dailyScrolls/trail）+ 2 条真实读取路径迁移 + 旧 API 兼容 + 全量回归
- **后续建议（未实施）**：Phase 2-B 可将更多纯读取路径（renderHome/renderScrollOpen/collectAllTags 等）经 Store；写入路径需逐条评估云钩子副作用后再迁移；Trail 写入（addCompletion/saveTrailEdit）建议在 Service 层就位后迁移

> 最终 PASS/FAIL 由 ChatGPT 独立审核（GitHub Commit / store.js 代码 / index.html Diff / Storage 边界 / 控制层状态），不以本报告自报为准。
