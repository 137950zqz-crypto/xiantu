# Phase 1-C Report

> 日期：2026-09-09
> 子任务：Phase 1-C · JavaScript 当前架构审计与模块边界设计
> 性质：**只审计，不重构**。本阶段未迁移任何 JS 代码。

## 1. Objective

建立一张可靠的"现有 JS → 职责 → 依赖 → 模块边界 → 未来迁移顺序"地图，为后续 Phase 2+ 提供输入。禁止任何 JS 架构重构。

## 2. Git Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD | `9d941975ac87d3c7445d4dbfa915f83093a9348c`（refactor: phase-1b html structure audit） |
| Working Tree | CLEAN |
| Remote | `origin` → `github.com/137950zqz-crypto/xiantu.git` |
| Local == Remote | 一致 |

## 3. Current JavaScript Overview

- 全部 JS 内联于 `index.html` 两个 `<script>` 块：主脚本 2746 行（289–2749）+ SW 注册小脚本 10 行（2750–2760）
- **219 个顶层函数**；无模块系统、无 import/export、无构建工具、无 package.json
- 外部依赖：Firebase compat SDK ×3（gstatic，可选）+ Supabase JS v2（jsdelivr，可选）——未配置时本地功能完全可用
- 无测试框架（Automated Tests: NOT IMPLEMENTED，与 Phase 0/1 一致）

## 4. Global State Audit

| 全局状态 | 行号 | 类型 | 谁创建 | 谁修改 | 谁读取 | 谁持久化 | 谁渲染 |
|---|---|---|---|---|---|---|---|
| `currentPage` | 916 | Global State | 声明 | openPage | openPage | — | 导航高亮 |
| `currentScrollIndex` | 1001 | Global State | 声明 | toggleScrollExpand/addNewScroll/addNextTask/delScroll | renderDailyShelf/renderScrollOpen | — | renderDailyShelf |
| `taskOpen{}` | 1003 | Global State | 声明 | toggleTaskOpen | renderTaskList | — | renderScrollOpen |
| `dailyTagFilter` | 1004 | Global State | 声明 | setDailyTagFilter | renderTaskList/renderDailyTagBar | — | 标签栏/任务列表 |
| `trailTagFilter/trailSearch/trailSort` | 1261 | Global State | 声明 | setTrailTagFilter/input/setTrailSort | renderTrail | — | renderTrail |
| `editingTags[]` | 1444 | Temporary | openEditTask/openTrailEdit | addEditingTag/removeEditingTag | renderTagEditUI/saveEditTask/saveTrailEdit | — | renderTagEditUI |
| `bagSelectMode/bagSel` | 1941 | Global State | 声明 | toggleBagSelectMode/toggleSel/... | renderBag/confirmDeleteBagSelected | — | renderBag |
| `itemImgData` | 2007 | Temporary | 选择图片 | clearItemImg | saveNewBagItem/saveEditBag | — | itemImageSection |
| `syncState{}` | 2368 | Global State | 声明 | markSync | renderSyncBar | — | renderSyncBar |
| `fbApp/fbAuth/fbDb/fbUser/fbSyncOn/fbSuppress/fbUnsubs` | 2412 | Global State（云） | fbInit/initFirebase | 登录/登出/监听 | fb* 系列 | xiantu_fb_sync_on | renderFbConfig/renderSyncBar |
| `cloudClient/cloudUser/cloudSyncTimer/cloudBusy` | 2516 | Global State（云） | initCloud | 登录/登出 | cloud* 系列 | xiantu_cloud_* | renderCloudStatus/renderSyncBar |
| `__DATE_OVERRIDE` | 414 | Constant（测试钩子） | 声明 | 外部测试注入 | getTodayStr/yesterdayStr | — | — |

**状态依赖图**：业务函数修改内存对象 → `saveXxx()` 写 localStorage → `fbAutoUpload`/`cloudQueueSync` 挂云 → `renderXxx()` 回写 UI。**无中央 store；状态 = localStorage + 模块级全局变量 + 每次渲染全量重建 DOM**。

## 5. Function Map

| Function | 行号 | Responsibility | Reads | Writes | Calls | Called By | Proposed Layer | Risk |
|---|---|---|---|---|---|---|---|---|
| `doCompleteTask` | 1182 | 任务完成（业务+存储+UI） | getDailyScrolls | saveDailyScrolls/trail/crystal/ledger | addCompletion/addReward/setCrystal/addLedger/renderScrollOpen/renderHome/showCompletionToast | renderTaskList 内联 onclick | services/completion | 高 |
| `addCompletion` | 1222 | 写行迹记录 | getTrail/findTaskById | saveTrail | — | doCompleteTask | domain/completion | 高 |
| `showCompletionToast` | 1208 | 完成推送 UI | #toastWrap | — | — | doCompleteTask | components | 低 |
| `renderTrail` | 1263 | 行迹渲染（读+UI） | getTrail/collectAllTags | — | — | openPage/setTrailSort/... | pages/trail | 中 |
| `openPage` | 917 | 页面切换 | — | currentPage | render*×9 | 导航/内联 onclick | router | 高 |
| `showModal/closeAllModal` | 943/949 | 弹窗控制 | #globalMask | — | — | 全部弹窗 | components/modal | 高 |
| `toast` | 434 | 轻提示 | #toastWrap | — | — | 全站 | components | 低 |
| `showConfirm` | 447 | 确认弹窗 | — | — | showModal | 全站删除/重置 | components | 中 |
| `renderHome` | 967 | 首页渲染 | getDailyScrolls/getBagData/... | — | ensureTodayScroll/getTodayStats/renderSyncBar | init/openPage('home')/全站 | pages/home | 中 |
| `ensureTodayScroll` | 1835 | 每日自动卷 | getDailyScrolls | saveDailyScrolls | collectCarryFromYesterday/rebuildStaleAutoScrolls | renderHome/renderDailyShelf/init | services/auto-scroll | 高 |
| `rebuildTodayAuto` | 1771 | 自动卷重建 | getDailyScrolls | saveDailyScrolls | collectCarryFromYesterday/mkCarried | rebuildStaleAutoScrolls | services/auto-scroll | 高 |
| `addNewScroll` | 1868 | 新增手动卷 | getDailyScrolls | saveDailyScrolls | — | 内联 onclick | services/daily-ten | 中 |
| `renderDailyShelf` | 1037 | 书架渲染 | getDailyScrolls | — | ensureTodayScroll/renderDailyTagBar/renderScrollOpen | openPage('dailyLesson') | pages/daily-ten | 中 |
| `renderScrollOpen` | 1102 | 卷轴展开渲染 | getDailyScrolls | — | renderTaskList | renderDailyShelf/doCompleteTask | pages/daily-ten | 中 |
| `renderTaskList` | 1136 | 任务列表渲染 | getDailyScrolls | — | — | renderScrollOpen | pages/daily-ten | 中 |
| `saveEditTask` | 1493 | 任务编辑保存（业务+存储+UI） | getDailyScrolls | saveDailyScrolls | recompute*/render* | 弹窗按钮 | services/task | 高 |
| `delTaskInScroll` | 1523 | 清空任务 | getDailyScrolls | saveDailyScrolls | compactScroll/render* | 内联 onclick | services/task | 高 |
| `addNextTask` | 1687 | 创建后续任务 | getDailyScrolls | saveDailyScrolls | mkEmptyTask/fillTaskPosition | 弹窗按钮 | domain/task-chain | 高 |
| `setTaskAsRoot/unsetRoot` | 1881/1913 | ◇首 设置/取消 | getDailyScrolls | saveDailyScrolls | recompute* | 弹窗按钮 | domain/task-chain | 高 |
| `compactScroll` | 1554 | 补位 | getDailyScrolls | — | — | delTaskInScroll | domain/scroll | 中 |
| `getBagData/saveBag` | 465/466 | 行囊存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `getDailyScrolls/saveDailyScrolls` | 469/470 | 每日存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `getTrail/saveTrail` | 476/477 | 行迹存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `getCrystal/setCrystal` | 479/480 | 晶核存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `getAura/setAura` | 481/482 | 灵气存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `getShopItems/saveShopItems` | 483/484 | 万宝阁存储 | localStorage | localStorage+云 | — | 全站 | core/storage | 中 |
| `migrateAllData` | 774 | 总迁移入口 | 全 key | backup/save | migrate*+validate | init/import | core/migration | 极高 |
| `normalizeDaily` | 796 | 幂等补全 | getDailyScrolls | saveDailyScrolls | — | init | core/migration | 高 |
| `initDefaultData` | 865 | 播种默认数据 | localStorage | localStorage | — | init | core/migration | 中 |
| `renderShop` | 2239 | 万宝阁渲染 | getShopItems/getCrystal/getAura | — | — | openPage('shop') | pages/shop | 中 |
| `doShopBuy` | 2321 | 购买（业务+存储+UI） | getShopItems/getCrystal | setCrystal/saveShopItems/addLedger | — | 商品卡 onclick | services/shop | 高 |
| `doAbsorb` | 2344 | 吸收晶核 | getCrystal | setAura/setCrystal/addLedger | — | 弹窗 | services/resource | 中 |
| `renderPassive/renderFail/renderInsight` | 2090/2137/2188 | 页面渲染 | get* | — | — | openPage | pages/* | 中 |
| `renderBag` | 1942 | 行囊渲染 | getBagData | — | updateSelCount | openPage('bag') | pages/bag | 中 |
| `fbInit/fbAutoUpload/fbStartListeners` | 2502/2488/2495 | Firebase 同步 | fb 配置 | Firestore | applyModuleData | init/saveXxx 钩子 | sync/firebase | 高 |
| `initCloud/cloudQueueSync/cloudUpload` | 2600/2638/2626 | Supabase 同步 | cloud 配置 | Supabase | setLocalSnapshot | init/saveXxx 钩子 | sync/supabase | 高 |
| `uploadAllToNotion/pullFromNotion` | 2677/2691 | Notion 同步 | notion 配置 | Notion API | saveXxx | 内联 onclick | sync/notion | 高 |
| `exportAllData/importAllData` | 2706/2711 | 导出导入 | 全 key | saveXxx | migrateAllData | 设置页 | services/data | 中 |
| `confirmResetAll` | 2732 | 重置（用户触发） | — | removeItem×10 | initDefaultData | 设置页 | services/data | 极高 |
| `backupAllData/restoreBackup` | 631/638 | 备份恢复 | 全 key | backup key | — | migrateAllData | core/storage | 极高 |
| `toast/showConfirm/showModal` | 434/447/943 | 全局 UI | DOM | DOM | — | 全站 | components | 中 |
| 工具函数（esc/pad/fmt*/uid/...） | 406–424 | 纯工具 | — | — | — | 全站 | core/utils | 低 |

> 纯工具函数（esc/pad/fmtDate/fmtTime/fmtDateTime/getTodayStr/yesterdayStr/uid/fmtShortDate/fmtScrollNo/toCircled/badgeNo 等）按 Utilities 归类，不逐条展开。

## 6. DOM Dependency Map

- **getElementById 直读**：约 95 个唯一 id（见 Phase 1-B §6）；页面容器按 `getElementById('page-'+p)` 动态寻址
- **组合选择器**：`#sideNav button,.mobile-nav button`（导航高亮）、`.trail-sort .sort-btn`、`.tag-chip`、`.page`
- **动态内容选择器**：`.task-list`、`.shop-op`、`.book-open`、`.book[data-idx=...]`
- **内联事件**：HTML 静态 102 处 onclick + JS 模板生成的约 20 处（onclick/oninput/onkeydown/onchange）
- **依赖链示例**：`#dailyShelfContainer` ← renderDailyShelf ← openPage ← 导航按钮；`#modalBody/#modalFooter` ← showModal ← 全部编辑/确认弹窗；`#toastWrap` ← toast/showCompletionToast

## 7. Event System Audit

| 事件 | 绑定位置 | 处理函数 | 业务函数 | 依赖固定 DOM ID |
|---|---|---|---|---|
| 导航按钮 click | 938（addEventListener，静态绑定） | 匿名 | openPage | 否（querySelectorAll） |
| 页面按钮 onclick | HTML 内联 ×102 + JS 模板内联 | 全局函数名 | 各业务函数 | 是（函数直呼） |
| 任务完成按钮 onclick | renderTaskList 模板 | doCompleteTask | 完成链 | 是 |
| 书展开 click | renderDailyShelf 动态 addEventListener | 匿名 | toggleScrollExpand | 是（.book[data-idx]） |
| 长按/右键编辑 | renderTaskList 动态绑定（contextmenu/touchstart/touchend/touchmove） | 匿名 | openEditTask | 是 |
| Escape 关闭弹窗 | 953（document 委托） | 匿名 | closeAllModal | 是（#globalMask） |
| 右滑关闭弹窗 | 955–956（document 委托） | 匿名 | closeAllModal | 是 |
| 行迹卡 click | renderTrail 动态绑定 | 匿名 | openTrailDetail | 否 |
| 行囊卡 click | renderBag 动态绑定 | 匿名 | openBagDetail/toggleSel | 否 |
| 功法/失败/悟道卡 click | 动态绑定 | 匿名 | open*Edit/open*Detail | 否 |
| 万宝阁卡 click | 动态绑定 | 匿名 | openShopBuy | 否 |
| SW controllerchange/statechange | 352–365 | finish/doUpdate | 版本更新链 | 是（#updateBanner/#versionStatus） |
| 输入 oninput/onkeydown/onchange | 内联 | trailSearch/回车标签/自动同步 | renderTrail/addEditingTagFromInput/setFbAutoSync | 是 |

**结论**：事件体系 = 内联 onclick（主）+ 渲染时动态绑定（次）+ document 级委托（弹窗关闭）。**大多数事件处理函数直接以全局函数名引用，依赖固定 DOM id —— 这是未来模块化的最大约束**，决定拆分顺序必须"先建接口、后移函数"。

## 8. Rendering System Audit

| 分类 | 函数 | 是否混合业务 |
|---|---|---|
| Page Rendering | renderHome/renderDailyShelf/renderTrail/renderBag/renderShop/renderPassive/renderFail/renderInsight/renderSetSync/renderCloudStatus/renderNotionConfig/renderFbConfig | renderHome 混合（ensureTodayScroll 写）；其余读-only |
| Component Rendering | renderScrollOpen/renderTaskList/renderDailyTagBar/renderTagEditUI/renderSyncBar | 读-only（renderTaskList 直接读 getDailyScrolls） |
| Modal Rendering | showModal/showConfirm/openXxx（openEditTask/openTrailEdit/openBagDetail/...） | openXxx 读业务数据构造模板（读混合） |
| Resource Rendering | renderHome 中晶核/灵气/资产渲染 | 读混合 |
| State Rendering | markSync→renderSyncBar、updateSelCount | 读混合 |
| 完成链渲染 | doCompleteTask 内 renderScrollOpen+renderHome+showCompletionToast | **业务+存储+UI 三重混合** |

## 9. Storage / Persistence Audit

**读取链路**：UI/业务 → `getXxx()` → `JSON.parse(localStorage.getItem(KEY))` → 内存对象
**写入链路**：业务修改对象 → `saveXxx(data)` → `localStorage.setItem` + `fbAutoUpload(module)` + `cloudQueueSync()`
**更新链路**：业务函数改内存 → 整体 saveXxx 写回（无 diff 写入）
**删除链路**：业务 filter/splice → saveXxx 写回；重置走 confirmResetAll（removeItem×10）
**备份/恢复**：backupAllData（读全 key → `xiantu_backup_v4`）↔ restoreBackup；迁移失败自动回滚
**云同步**：saveXxx 挂 fbAutoUpload（Firebase 模块级上传）+ cloudQueueSync（Supabase 脏标记 + 600ms 防抖上传）；Notion 手动全量

## 10. Direct localStorage Access

| 行号 | 函数 | 用途 | 读写删 | 是否绕过统一层 |
|---|---|---|---|---|
| 465–501 | getXxx/saveXxx 系列 | 业务数据封装本体 | 读写 | 否（封装本身） |
| 631–648 | backupAllData/restoreBackup | 迁移备份/回滚 | 读写 | 是（备份全 key，合理） |
| 782 | validateMigration | 校验读备份 | 读 | 是（合理） |
| 865–906 | initDefaultData | 播种默认数据 | 读写 | 是（初始化，合理） |
| 2413–2414 | getFbConfig/saveFbConfig | Firebase 配置 | 读写 | 是（云配置独立封装） |
| 2490/2508 | setFbAutoSync/fbInit | 自动同步开关 | 读写 | 是（小状态 key） |
| 2544–2546 | cloudCfg/cloudMeta/setCloudMeta | Supabase 配置/元数据 | 读写 | 是（云配置独立封装） |
| 2548–2558 | setLocalSnapshot | 云数据落盘（**刻意绕过 saveXxx 防云回环**） | 写 | 是（设计如此） |
| 2639 | cloudQueueSync | 云脏标记 | 写 | 是（小状态 key） |
| 2654–2655 | getNotionConfig/saveNotionConfig | Notion 配置 | 读写 | 是（云配置独立封装） |
| 2721 | importAllData | 导入（ledger 直写） | 写 | 是（可统一） |
| 2734–2735 | confirmResetAll | 用户主动重置 | 删 | 是（用户触发，合理） |

**关键结论**：业务数据读写已统一走 `getXxx/saveXxx` 封装（写时自动挂云同步钩子），**不存在业务函数绕过封装直接读写业务 key 的情况**（除刻意设计：setLocalSnapshot 防回环、云配置独立小封装）。这是 Phase 2 的有利起点。

## 11. Business / UI / Storage Mixed Functions

| 函数 | 混合类型 | 优先级 |
|---|---|---|
| `doCompleteTask` | Business + Storage + UI | **最高** |
| `saveEditTask` | Business + Storage + UI | **最高** |
| `delTaskInScroll` | Business + Storage + UI | **最高** |
| `setTaskAsRoot/unsetRoot` | Business + Storage + UI | 高 |
| `addNextTask` | Business + Storage + UI | 高 |
| `doShopBuy/doAbsorb` | Business + Storage + UI | 高 |
| `ensureTodayScroll/rebuildTodayAuto` | Business + Storage | 高 |
| `unlockScroll/resealScroll` | Business + Storage + UI | 中 |
| `renderHome` | Business（ensureTodayScroll）+ UI | 中 |
| `openEditTask/openTrailEdit` | Business 读 + UI 模板 | 中 |

## 12. Current Dependency Graph

```
当前架构：
UI Event（onclick / 动态绑定 / 委托）
   ↓
全局函数（219 个顶层函数，内联同名调用）
   ↓
业务逻辑（doCompleteTask / saveEditTask / ensureTodayScroll …）
   ↓
全局状态（模块级 let + 内存对象）
   ↓
localStorage（getXxx/saveXxx 统一封装）
   ↓
Render（renderXxx 全量重建 DOM）—— 无响应式 diff
   ↕
云同步钩子（fbAutoUpload / cloudQueueSync —— saveXxx 内同步触发）
```

## 13. Proposed V2 Module Mapping

| 目标模块 | 现有函数 | 说明 |
|---|---|---|
| `core/utils.js` | esc/pad/fmt*/uid/toCircled/... | 纯工具，零依赖 |
| `core/ids.js` | uid | 并入 utils 亦可 |
| `core/dates.js` | getTodayStr/yesterdayStr/fmtDate/fmtTime/fmtDateTime/fmtShortDate/fmtScrollNo | 依赖 __DATE_OVERRIDE |
| `core/storage.js` | getXxx/saveXxx 全系列 + STORAGE_KEY_* 常量 | 封装已存在，直接迁移 |
| `core/migration.js` | migrateAllData/normalizeDaily/migrateScrollsV4/migrateTrailV4/migrateRewardsV4/backupAllData/restoreBackup/validateMigration/initDefaultData | 高内聚 |
| `domain/task.js` | mkEmptyTask/sameTask/syncTaskCompat/effectiveTags/fillTaskPosition/recomputeInheritedTags | 模型 helper |
| `domain/scroll.js` | isAutoScroll/getDayScrollIndex/getScrollNoById/isScrollLocked/compactScroll/splitOverflowScrolls | 卷模型 |
| `domain/task-chain.js` | chainRowsFor/getBranches/getBranchTasks/getRootOfTask/recomputeChainRoots/nextChainNo | 链模型 |
| `domain/completion.js` | addCompletion/nextTrailOrder | 行迹模型 |
| `domain/resource.js` | getCrystal/setCrystal/getAura/setAura/addLedger | 资源模型（存储已封装） |
| `services/daily-ten.js` | renderDailyShelf/renderScrollOpen/renderTaskList/renderDailyTagBar（UI 侧）+ addNewScroll/delScroll（业务侧） | 拆页面/服务两层 |
| `services/auto-scroll.js` | ensureTodayScroll/rebuildTodayAuto/rebuildStaleAutoScrolls/collectCarryFromYesterday/mkCarried | 高内聚 |
| `services/completion.js` | doCompleteTask/showCompletionToast | 完成链 |
| `services/trail.js` | renderTrail/setTrailSort/setTrailTagFilter/openTrailDetail/openTrailEdit/saveTrailEdit | 行迹页 |
| `services/task.js` | saveEditTask/delTaskInScroll/openEditTask | 任务编辑 |
| `services/resource-ledger.js` | doAbsorb/addLedger | 资源账本 |
| `services/inventory.js` | renderBag/openAddItem/saveNewBagItem/toggleBagSelectMode/confirmDeleteBagSelected/fileToDataUrl | 行囊 |
| `services/shop.js` | renderShop/openAddShopItem/doShopBuy/openAbsorb/openLedger | 万宝阁 |
| `sync/firebase.js` | fbInit/fbAutoUpload/fbUploadModule/fbPullAll/fbStartListeners/... | 独立 |
| `sync/supabase.js` | initCloud/cloudUpload/cloudQueueSync/cloudInitialSync/... | 独立 |
| `sync/notion.js` | notionFetch/uploadAllToNotion/pullFromNotion | 独立 |
| `pages/home.js` | renderHome/getTodayStats/continuePractice | 首页 |
| `pages/settings.js` | renderSetSync/exportAllData/importAllData/confirmResetAll/... | 设置 |
| `router.js` | openPage + 导航绑定 | 页面切换 |
| `app.js` | initDefaultData→migrateAllData→normalizeDaily→migrateAutoScroll→renderHome→fbInit→initCloud + SW 注册 | 引导 |

> 映射按真实职责归类；**未为匹配目录强行拆分类**。Mixed 函数记录"先拆接口、后移实现"。

## 14. Proposed Migration Order

依据真实依赖图（工具零依赖 → 存储被全站依赖 → 模型被服务依赖 → 页面最重）：

```
1. core/utils + core/dates        （零依赖，纯移动）
2. core/storage（getXxx/saveXxx + STORAGE_KEY_*）   （封装已存在）
3. core/ids（并入 utils）
4. domain/task + domain/scroll + domain/task-chain + domain/completion + domain/resource（模型 helper，无 UI）
5. core/migration（依赖 storage + domain）
6. services/auto-scroll（依赖 domain/scroll + storage）
7. services/task + services/completion + services/trail（业务服务层）
8. services/resource-ledger + services/inventory + services/shop（资源/物品/商店）
9. pages/*（渲染层，依赖 services）
10. router（openPage + 导航）
11. sync/*（Firebase/Supabase/Notion，依赖 storage + services）
12. app.js 初始化引导（最后，牵一发动全身）
```

## 15. Tier 1 — Safe

**可以最先抽离（纯移动，零行为变化）：**

1. **工具函数**：esc/pad/fmtDate/fmtTime/fmtDateTime/getTodayStr/yesterdayStr/uid/fmtShortDate/fmtScrollNo/toCircled（无任何状态/存储依赖）
2. **STORAGE_KEY_* 常量 + getXxx/saveXxx 存储封装**（465–501 行）：封装已存在、职责单一、写时挂云钩子；抽离后以 window 挂载或加载顺序保证可用
3. **IC 常量 + 日期工具**
4. **模型纯函数**：sameTask/effectiveTags/syncTaskCompat/parseOrigNo/shortToIso/fillTaskPosition/isAutoScroll/isScrollLocked/getDayScrollIndex/getScrollNoById（无 UI/存储副作用，读入参）

## 16. Tier 2 — Controlled

**需要先建立接口再迁移：**

1. **迁移模块**（migrateAllData 等）：依赖 storage+domain，但只被 init/import 调用 → 先抽 storage/domain 即可整体搬
2. **自动卷服务**（ensureTodayScroll/rebuildTodayAuto）：写 storage + 被 renderHome/renderDailyShelf/init 调用 → 需保持调用时序
3. **云同步三套**（fb/supabase/notion）：依赖 saveXxx 钩子 + 各自 SDK 全局对象 → 先固定"模块数据快照/落盘"接口（getModuleData/applyModuleData 已存在）
4. **弹窗/Toast 组件**（showModal/showConfirm/toast/closeAllModal）：被全站调用 → 需以全局接口形式挂载
5. **页面渲染函数**（renderXxx）：读 storage + 依赖 openPage 调用时机 → 建议在 services 就绪后按页迁移

## 17. Tier 3 — High Risk

**绝对不能先拆（或必须最后处理）：**

1. **初始化序列**（2742–2748）：initDefaultData→migrateAllData→normalizeDaily→migrateAutoScroll→renderHome→fbInit→initCloud——顺序即契约，任何提前/延后都会破坏数据模型
2. **doCompleteTask 完成链**：业务+存储+UI 三重混合 + 防重复/封卷/空名规则 + 全副本同步——必须等 storage/trail/resource 服务全部就绪
3. **页面切换 openPage + 导航绑定**：9 页路由中枢 + 渲染分发
4. **Modal 单例**：全局 3 id 被所有表单/确认复用
5. **数据重置/导入**（confirmResetAll/importAllData）：直接删 key/写全库
6. **版本更新链**（303–405）：window 测试钩子 + SW 事件 + sessionStorage 防循环
7. **事件体系整体**：内联 onclick ×102 + 动态绑定——任何函数改名/移动都会断链

## 18. Recommended Next Refactoring Step

**Phase 2（Storage/Store 数据层拆分）** 的自然起点：

- 第一步先把 `STORAGE_KEY_*` + `getXxx/saveXxx`（465–501 行，约 40 行）与工具函数移入独立文件，以 `<script>` 顺序加载（base → utils → storage → 业务），**不引入构建系统**
- 封装已存在（写时自动挂 fbAutoUpload/cloudQueueSync），迁移风险极低，可立即验证
- 迁移模块（core/migration）紧随其后（依赖 storage + domain 纯函数）
- 云同步接口（getModuleData/applyModuleData 快照协议）已成形，可作为 Phase 9 的接口基线

**本阶段明确声明：No JavaScript architecture migration was performed.** 本阶段产物 = 架构审计 + 依赖地图 + 模块边界设计。

## 19. Desktop Test（1440 × 900）

**PASS — 8/8**（真实浏览器）：首页渲染 / 每日十课书架展开 / 待修行完成任务（晶核+1 行迹+1）/ 弹窗视口内完整 / 刷新持久化 / 7 页导航。Console 0 错误、Network 0 失败。

## 20. Mobile Test（390 × 844）

**PASS — 10/10**（真实浏览器）：底部导航显示 / 无横向溢出（390==390）/ 弹窗 358px 未超屏 / 滚动正常 / 全部功能流程通过。

## 21. Console

**PASS**：桌面/移动/PWA 三轮 0 错误、0 未处理异常、0 非 CDN 失败请求。

## 22. Persistence

**PASS**：完成任务 → 刷新 → 任务/完成状态/晶核/行迹保留（crystal=1, trail=1, doneCount=1）。独立测试 profile，未触碰真实用户数据；未执行 localStorage.clear()。

## 23. PWA

**PASS — 6/6**：SW activated、CSS 网络 200、运行时缓存含全部 css、刷新正常。manifest.json/sw.js/version.txt 零改动。

## 24. Known Issues

| 问题 | 说明 | 处置 |
|---|---|---|
| 219 个函数全部为 window 全局 | 内联脚本无模块边界 | Phase 2+ 逐步收敛 |
| 内联 onclick ×102 + 动态绑定 | 函数名即契约，改名断链 | 记录，迁移顺序约束 |
| Mixed 函数集中（doCompleteTask 等 12 个） | 业务+存储+UI 耦合 | 记录为最高优先级拆分对象 |
| setLocalSnapshot 直写 localStorage | 刻意绕过封装防云回环 | 设计如此，保留 |
| 无测试框架 | 全部为手工/脚本浏览器验证 | NOT IMPLEMENTED 如实标注 |
| CDN 偶发失败 | 环境既有 | 复测确认，非本阶段 |

## 25. Result

**PASS**

```
Implementation: PASS（审计 + 地图 + 模块设计，零代码迁移）
Testing: PASS
Browser Verification: PASS（桌面 8/8 + 移动 10/10 + PWA 6/6）
Regression: PASS
Report: PASS
Git Commit: （待提交 docs: phase-1c javascript architecture audit）
Git Push: （待执行）
Remote Verification: （待执行）
```

> 按 Remote Completion Rule（v1.1）：最终状态以 Commit + Push + Remote Verification 全链路 PASS 为准。
