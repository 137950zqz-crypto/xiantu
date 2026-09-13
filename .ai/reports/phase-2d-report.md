# Phase 2-D Report

## 1. Objective
在不改变现有业务行为的前提下，扩大安全 READ 覆盖（Business/UI → XiantuStore → Storage → localStorage → 原有 cloud hooks），为后续 Domain 重构准备稳定入口。不扩大业务边界；高风险区（migration/backup/restore/import/export/reset/cloud config/completion/reward/ledger/TaskChain/Auto Scroll/sealing/crystal/aura）一律保留原路径。

## 2. Baseline
- Branch: v2-dev
- HEAD: `daa51b0a537960494f5201cff289a7697fda8c47`（refactor: phase-2c extend store boundary）
- Local == Remote: YES；Working Tree: clean

## 3. Store / Storage 边界复核
- `js/core/store.js`：window.XiantuStore 6 集合（dailyScrolls/trail/bag/passive/fail/insight），全部为薄委托 `get(){return getXxx()}` / `save(d){return saveXxx(d)}`；无 localStorage/sessionStorage/DOM/云/业务判断/资源逻辑。
- `js/core/storage.js`：12 业务 key + 21 个 Storage Adapter，cloud hooks（fbAutoUpload/cloudQueueSync）全部位于其中；本阶段零修改。
- 加载顺序：ids.js → dates.js → storage.js → store.js → 主业务 JS（未变）。

## 4. READ 路径审计表
index.html 中 **50 处 localStorage 直访**全部定位并逐一定性：

| 位置 | 用途 | 归属 | 是否安全迁移 | 处理 |
|---|---|---|---|---|
| 460 | addLedger 写 ledger | ledger | NO（例外） | 保留 |
| 605-607 | 备份快照 | backup | NO（例外） | 保留 |
| 611-615 | 恢复 | restore | NO（例外） | 保留 |
| 753 | 迁移校验 validateMigration | migration | NO（例外） | 保留 |
| 836-877 | 初始化默认数据（bag/passive/daily/fail/insight/crystal/aura/ledger/trail/shop） | initialization | NO（例外） | 保留 |
| 2392-2393 | getFbConfig/saveFbConfig | cloud config | NO（例外） | 保留 |
| 2469/2487 | xiantu_fb_sync_on | cloud config | NO（例外） | 保留 |
| 2523-2525 | cloudCfg/cloudMeta/setCloudMeta | cloud config | NO（例外） | 保留 |
| 2528-2537 | 云数据导入 applyCloudData | cloud import | NO（例外） | 保留 |
| 2559 | 云配置写入 saveCloudConfig | cloud config | NO（例外） | 保留 |

## 5. 迁移的 8 个安全 READ（纯渲染/计数，无副作用、无业务判断、非云上下文）

| # | 旧路径 | 新路径 | 安全理由 |
|---|---|---|---|
| 1 | renderHome: `getBagData().length`（dashBag） | `XiantuStore.bag.get().length` | 纯 dashboard 计数，只读 |
| 2 | renderHome: `getPassive().length`（dashPassive） | `XiantuStore.passive.get().length` | 纯 dashboard 计数，只读 |
| 3 | renderHome: `getTrail().length`（dashTrail） | `XiantuStore.trail.get().length` | 纯 dashboard 计数，只读 |
| 4 | renderHome: `getInsight().length`（dashInsight） | `XiantuStore.insight.get().length` | 纯 dashboard 计数，只读 |
| 5 | renderBag: `const list=getBagData()` | `const list=XiantuStore.bag.get()` | 列表渲染纯读 |
| 6 | renderPassive: `const list=getPassive()` | `const list=XiantuStore.passive.get()` | 列表渲染纯读 |
| 7 | renderFail: `const list=getFail()` | `const list=XiantuStore.fail.get()` | 列表渲染纯读 |
| 8 | renderInsight: `const list=getInsight()` | `const list=XiantuStore.insight.get()` | 列表渲染纯读 |

## 6. 保留的高风险/例外路径（本阶段未迁移，明确清单）
- migration（753）、backup（605-607）、restore（611-615）、import/export（云导入 2528-2537、导出 2682/2703、导入 2691/2699 附近）、reset、cloud config（2392-2393/2469/2487/2523-2525/2559）、completion（doCompleteTask 1153）、reward（addReward）、ledger（addLedger 460）、TaskChain（1545-1696 链逻辑）、Auto Scroll（1784-1805）、sealing（封卷/解封/重新封印）、crystal（getCrystal/setCrystal）、aura（getAura/setAura）
- 其余未选中安全读取点（渐进不贪量）：getTodayStats 内 getDailyScrolls（含统计逻辑）、renderHome 内 getDailyScrolls（continueTxt 分支含 allDone 业务判断）、continuePractice/getDayScrollIndex/getScrollNoById/collectAllTags、openBagDetail/openBagEdit/openPassiveEdit/openFailDetail/openEditFail/openInsightDetail/openEditInsight（详情读取，留待后续）、renderScrollOpen 内 getDailyScrolls（1075）
- 50 处 localStorage 直访：全部属于上述例外区，逐一定位确认，零迁移。

## 7. Store 越界检查
- 14 处 XiantuStore 调用全部为 6 集合的 `.get()` / `.save()`；无业务判断/DOM/云/资源逻辑（浏览器边界实测全 true：noLocalStorage/noDOM/noCloud/noResource/noBusiness）。
- store.js 本阶段仅更新文件头注释（追加 Phase 2-D 已迁移 READ 清单），行为零变更。

## 8. Store 专项测试（store2d-test.js）
- 旧 API 12 个全存在（getDailyScrolls/saveDailyScrolls/getTrail/saveTrail/getBagData/saveBag/getPassive/savePassive/getFail/saveFail/getInsight/saveInsight）
- 6 集合 Store API 全存在；6 集合 JSON 一致性（Store.get == 旧 API）全 true
- dashboard 4 项渲染走 Store 且数值一致全 true
- 边界 5 项全 true；云钩子 6 个 saveXxx 仍含 cloudQueueSync true
- Store 写 → 真实刷新 → Store.get == 旧 API 读取（bag/fail 持久化一致）
- PAGE_ERRORS: []

## 9. 功能回归（phase2d-regress.js，真实浏览器）
### Desktop 1440×900：**12/12 PASS**
首页渲染+Store dashboard / 每日十课书架 / 展开任务列表（10 行）/ 待修行-完成任务（晶核+1、行迹+1）/ 刷新-状态持久化 / bag·passive·fail·insight 四集合 UI 增删持久化 / 导航-7 页可打开 / Console 0 错误 / Network 0 失败

### Mobile 390×844：**15/15 PASS**
上述全部 + 移动-无横向溢出（sw=390=cw）/ 移动-底部导航（flex）/ 导航入口 9 个 / Console 0 错误 / Network 0 失败

### PWA：**5/5 PASS**
SW 注册（count=1 activated）/ CSS 三文件加载（base/layout/components 全 200）/ 刷新正常 / Console 0 错误 / Network 0 失败
- manifest.json / sw.js / version.txt：零修改（git diff 确认）

## 10. 完成链回归（phase1d-chain.js）
- crystalDelta=1、trailDelta=1、ledgerDelta=1、dupClickSafe=true、PAGE_ERRORS=[]
- 同一 TaskInstance 不重复奖励；完成按钮仍是唯一完成入口

## 11. 数据一致性
- key 名（xiantu_daily_scroll/xiantu_trail/xiantu_bag_data/xiantu_passive/xiantu_fail/xiantu_insight 等 12 个业务 key）：零修改
- JSON shape / array/object / ID / date / slot / status：零修改（6 集合 Store.get == 旧 API 全 true 实证）

## 12. Console / Network
- Desktop/Mobile/PWA 三模式 Console 0 页面错误；Network 0 失败资源

## 13. Diff Audit
- `git diff --stat`：index.html +16/-8、store.js +2；仅 2 个文件
- `git diff --check`：通过（无空白错误）
- 无 PWA/CSS/storage.js/业务逻辑/数据结构/cloud hook 修改
- 无格式化污染、无大规模重写、无旧功能删除

## 14. Node Test
- 项目无 package.json → `Node Test = NOT IMPLEMENTED`（未伪造；如实记录）
- 已执行：真实浏览器回归（puppeteer-core + 本机 Chrome）+ Console/Network/Persistence 检查

## 15. 测试环境备注（如实记录）
- `/tmp/xiantu-test/test-phase1a.js`（历史三模式回归脚本）在本次执行前已被系统清理（Cannot find module），已重建等价回归脚本 `phase2d-regress.js`（桌面/移动/PWA 三模式 + 6 集合 UI 增删持久化），全部真实浏览器断言。
- `/tmp/xiantu-test/node_modules` 曾被部分清理（puppeteer-core 仅剩空目录），已在测试工作区重装（npm install puppeteer-core@23.11.1 --no-save），不影响项目仓库。

## 16. Result
**PASS**（执行完成；最终 PASS/FAIL 由 ChatGPT 独立读取 GitHub 审核）

## 17. Next Task
- Phase 2-E：WAITING_FOR_HUMAN_APPROVAL（禁止自动启动）
- 未开始任何 Phase 2-E / Phase 3 工作
