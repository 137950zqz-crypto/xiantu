# Phase 1-E Report

> 日期：2026-09-09
> 子任务：Phase 1-E · Storage 层最小安全迁移试点
> 性质：把已形成的 Storage Adapter 层（getXxx/saveXxx + 业务 key 常量）从 index.html 外移到 `js/core/storage.js`。**移动"实现位置"，不改变"行为"**。非 Storage 重构。

## 1. Objective

验证 Storage 封装层可从：

```
业务函数 → getXxx / saveXxx → localStorage
```

安全演变为：

```
业务函数 → getXxx / saveXxx → js/core/storage.js → localStorage
```

同时保持所有调用方、函数名、数据结构、localStorage key、云同步钩子、执行顺序**完全不变**。这是 Phase 2 数据层正式拆分前的第二个安全试点。

## 2. Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD（迁移前） | `71c5cf89533a521868316700bcd224917c791366`（refactor: phase-1d javascript module pilot） |
| origin/v2-dev | `71c5cf89533a521868316700bcd224917c791366` |
| Working Tree | CLEAN（迁移前） |

## 3. Phase 1-D Findings Used

- Phase 1-D 验证"外部 `<script>` + 全局函数 + 现有内联 onclick"可稳定共存，确立迁移模式（经典 script、window 显式暴露、调用方零修改、加载顺序置于主业务脚本前）
- Phase 1-D 的 `ids.js` / `dates.js` 已就位，本阶段在其后追加 `storage.js`，三者与主业务脚本的依赖关系不变
- Phase 1-C §10 审计结论复用：业务数据读写已统一走 getXxx/saveXxx 封装（写时挂云钩子），业务函数无绕过封装直写业务 key → Adapter 层可整体外移

## 4. Storage Inventory

对 index.html 全部 Storage 相关代码实测扫描（非记忆）：

| 类别 | 数量 | 位置（迁移前） | 处置 |
|---|---|---|---|
| `localStorage.getItem` | 31 | 全文件 | 审计 |
| `localStorage.setItem` | 42 | 全文件 | 审计 |
| `localStorage.removeItem` | 12 | 版本更新链/重置 | 审计，不迁移 |
| `sessionStorage` | 5 | 版本更新链（352–398） | 保留 |
| `JSON.parse` | 15 | 适配器/备份/校验 | 审计 |
| `JSON.stringify` | 12 | 适配器/备份/导入 | 审计 |
| Storage Adapter（getXxx/saveXxx/setXxx） | 24 | 447–492 | **21 个迁移**，3 个保留 |
| 直访点（备份/恢复/播种/云配置/导入/重置） | 13 组 | 见 §7 | 保留 |

## 5. localStorage Key Inventory

| Key | 常量名 | 类型 | 处置 |
|---|---|---|---|
| `xiantu_bag_data` | STORAGE_KEY_BAG | 业务（行囊） | **迁移** |
| `xiantu_passive` | STORAGE_KEY_PASSIVE | 业务（被动功法） | **迁移** |
| `xiantu_daily_scroll` | STORAGE_KEY_DAILY | 业务（每日十课） | **迁移** |
| `xiantu_fail` | STORAGE_KEY_FAIL | 业务（走火入魔录） | **迁移** |
| `xiantu_insight` | STORAGE_KEY_INSIGHT | 业务（悟道札记） | **迁移** |
| `xiantu_trail` | STORAGE_KEY_TRAIL | 业务（行迹） | **迁移** |
| `xiantu_crystal` | STORAGE_KEY_CRYSTAL | 业务（晶核） | **迁移** |
| `xiantu_aura` | STORAGE_KEY_AURA | 业务（灵气） | **迁移** |
| `xiantu_shop_items` | STORAGE_KEY_SHOP | 业务（万宝阁） | **迁移** |
| `xiantu_ledger` | STORAGE_KEY_LEDGER | 业务（资源账本） | **迁移** |
| `xiantu_data_schema_version` | STORAGE_KEY_SCHEMA | 业务（schema 版本） | **迁移** |
| `xiantu_rewards` | STORAGE_KEY_REWARDS | 业务（奖励账） | **迁移** |
| `xiantu_notion_config` | STORAGE_KEY_NOTION | 云配置 | 保留（随 Notion 逻辑） |
| `xiantu_firebase_config` | STORAGE_KEY_FB | 云配置 | 保留（随 Firebase 逻辑） |
| `xiantu_cloud_config_v1` | CLOUD_CFG_KEY | 云配置 | 保留（随 Supabase 逻辑） |
| `xiantu_cloud_meta_v1` | CLOUD_META_KEY | 云配置 | 保留（随 Supabase 逻辑） |
| `xiantu_backup_v4` | STORAGE_KEY_BACKUP | 备份 | 保留（随备份/恢复逻辑） |
| `xiantu_updated_to` 等 sessionStorage | — | 版本更新 | 保留 |

**Key 名称一个字符未改。**

## 6. Storage Function Map

| Function | 原行号 | 读 | 写 | Key | 默认值 | 云钩子 | Called By | 处置 |
|---|---|---|---|---|---|---|---|---|
| getBagData | 456 | getItem | — | BAG | [] | — | 行囊/首页/导入 | **迁移** |
| saveBag | 457 | — | setItem | BAG | — | fb("bag")+queue | 行囊 CRUD | **迁移** |
| getPassive | 458 | getItem | — | PASSIVE | [] | — | 功法页/导入 | **迁移** |
| savePassive | 459 | — | setItem | PASSIVE | — | fb("passive")+queue | 功法 CRUD | **迁移** |
| getDailyScrolls | 460 | getItem | — | DAILY | []（含日期降序稳定排序） | — | 全站 | **迁移** |
| saveDailyScrolls | 461 | — | setItem | DAILY | — | fb("daily")+queue | 完成/编辑/自动卷 | **迁移** |
| getFail | 462 | getItem | — | FAIL | [] | — | 失败录/导入 | **迁移** |
| saveFail | 463 | — | setItem | FAIL | — | fb("fail")+queue | 失败录 CRUD | **迁移** |
| getInsight | 464 | getItem | — | INSIGHT | [] | — | 悟道/导入 | **迁移** |
| saveInsight | 465 | — | setItem | INSIGHT | — | fb("insight")+queue | 悟道 CRUD | **迁移** |
| getTrail | 467 | getItem | — | TRAIL | [] | — | 行迹/首页 | **迁移** |
| saveTrail | 468 | — | setItem | TRAIL | — | fb("trail")+queue | 完成链/行迹编辑 | **迁移** |
| getCrystal | 470 | getItem | — | CRYSTAL | 0 | — | 全站 | **迁移** |
| setCrystal | 471 | — | setItem | CRYSTAL | — | fb("crystal")+queue | 完成链/吸收/购买 | **迁移** |
| getAura | 472 | getItem | — | AURA | 0 | — | 全站 | **迁移** |
| setAura | 473 | — | setItem | AURA | — | fb("aura")+queue | 吸收 | **迁移** |
| getShopItems | 474 | getItem | — | SHOP | [] | — | 万宝阁/首页 | **迁移** |
| saveShopItems | 475 | — | setItem | SHOP | — | fb("shop")+queue | 万宝阁 CRUD/购买 | **迁移** |
| getLedger | 476 | getItem | — | LEDGER | [] | — | addLedger/账本弹窗 | **迁移** |
| addLedger | 477 | getLedger | setItem | LEDGER | — | **无（既有事实）** | 完成链/吸收/购买 | **保留**（Domain 记录创建） |
| getSchemaVersion | 489 | getItem | — | SCHEMA | 0 | — | migrateAllData/校验 | **迁移**（纯读写 Adapter） |
| setSchemaVersion | 490 | — | setItem | SCHEMA | — | 无（既有事实） | migrateAllData | **迁移** |
| getRewards | 491 | getItem | — | REWARDS | [] | — | hasReward/addReward | **迁移** |
| saveRewards | 492 | — | setItem | REWARDS | — | **无（既有事实）** | addReward | **迁移** |
| hasReward | 493 | getRewards | — | — | — | — | 渲染 | **保留**（领域查询） |
| addReward | 494 | getRewards | saveRewards | — | — | — | 完成链 | **保留**（领域写入） |

## 7. Direct localStorage Access

| 位置 | 函数 | 用途 | 读写删 | 是否本阶段迁移 |
|---|---|---|---|---|
| 352–398 | 版本更新链 | 更新标记/尝试计数 | sessionStorage 读删写 | 否 |
| ~623–627 | backupAllData | 全 key 快照→备份 | 读+写 | **否**（§9） |
| ~631–635 | restoreBackup | 备份→全 key 恢复 | 读+写 | **否**（§9） |
| ~644–646 | validateMigration | 迁移校验读 | 读 | **否**（§10） |
| ~773 | migrateAllData | 回滚前置校验 | 读 | **否**（§10） |
| 856–897 | initDefaultData | 种子数据播种 | 读+写 | **否**（初始化） |
| ~2413–2414 | getFbConfig/saveFbConfig | Firebase 配置 | 读+写 | **否**（§20 云） |
| ~2490/2508 | setFbAutoSync/fbInit | 自动同步开关 | 读+写 | **否**（云） |
| ~2544–2546 | cloudCfg/cloudMeta/setCloudMeta | Supabase 配置/元数据 | 读+写 | **否**（云） |
| ~2548–2558 | setLocalSnapshot | 云数据落盘（防回环） | 写 | **否**（云，刻意绕过） |
| ~2639 | cloudQueueSync | 云脏标记 | 写 | **否**（云） |
| ~2654–2655 | getNotionConfig/saveNotionConfig | Notion 配置 | 读+写 | **否**（云） |
| ~2721 | importAllData | 导入（含 ledger 直写） | 写 | **否**（导入） |
| ~2734–2735 | confirmResetAll | 用户主动重置 | 删 | **否**（重置） |

**结论**：所有直访点均属 重置/导入/恢复/云同步控制/初始化/备份 范畴，按指令保留原位。

## 8. removeItem Audit

| 位置 | 用途 | Key | 是否业务重置 | 是否备份/恢复 | 是否同步 | 风险 | 本阶段迁移 |
|---|---|---|---|---|---|---|---|
| ~389 | 版本更新成功后清理标记 | xiantu_updated_to / xiantu_update_attempt | 否 | 否 | 否 | 低 | **否** |
| ~2734–2735 | confirmResetAll 用户重置 | 全部业务 key | **是** | 否 | 否 | 高 | **否** |

业务 key 的 removeItem 仅存在于 confirmResetAll（用户主动触发重置），不属于普通 get/save Adapter，**不迁移**。

## 9. Backup / Restore Audit

- `backupAllData`（读全部业务 key → 写 `xiantu_backup_v4` 快照）
- `restoreBackup`（读备份 → 逐 key 写回）
- 调用方：`migrateAllData`（迁移前备份 + 失败自动回滚）
- 判定：**只审计不迁移**。高风险 Storage 操作（全量快照/回滚），与迁移链强耦合，属 Tier 2/3，Phase 2 处理。

## 10. Migration Audit

- `migrateAllData / migrateScrollsV4 / migrateTrailV4 / migrateRewardsV4 / normalizeDaily / validateMigration`
- 判定：**只审计不迁移**。涉及旧数据/新数据/备份/验证/回滚，属 Tier 2/3。
- 唯一迁移的相邻项：`getSchemaVersion / setSchemaVersion`（xiantu_data_schema_version 的纯读写 Adapter，函数体逐字符一致，迁移逻辑本体未动）。

## 11. Cloud Sync Hook Audit

| saveXxx | 迁移前钩子 | 迁移后 | 一致 |
|---|---|---|---|
| saveBag | `fbAutoUpload("bag")` + `cloudQueueSync()` | 逐字符相同 | ✅ |
| savePassive | `fbAutoUpload("passive")` + `cloudQueueSync()` | 逐字符相同 | ✅ |
| saveDailyScrolls | `fbAutoUpload("daily")` + `cloudQueueSync()` | 逐字符相同 | ✅ |
| saveFail / saveInsight / saveTrail | fb(模块)+queue | 逐字符相同 | ✅ |
| setCrystal / setAura | fb(模块)+queue | 逐字符相同 | ✅ |
| saveShopItems | fb("shop")+queue | 逐字符相同 | ✅ |
| saveRewards | **无钩子（既有事实）** | 逐字符相同（仍无） | ✅ |
| setSchemaVersion | 无钩子（既有事实） | 逐字符相同 | ✅ |
| addLedger | **无钩子（既有事实，直写）** | 保留原位，未动 | ✅ |

**钩子顺序保持：localStorage.setItem → fbAutoUpload(模块) → cloudQueueSync()，未合并/未新建抽象；Firebase/Supabase/Notion 逻辑本体未动。**

## 12. Candidate Functions

满足"纯 Adapter（读/解析/写/序列化 + 触发既有钩子）"的候选：getBagData/saveBag/getPassive/savePassive/getDailyScrolls/saveDailyScrolls/getFail/saveFail/getInsight/saveInsight/getTrail/saveTrail/getCrystal/setCrystal/getAura/setAura/getShopItems/saveShopItems/getLedger/getSchemaVersion/setSchemaVersion/getRewards/saveRewards（23 个）。

## 13. Selected Functions

**21 个纯 Adapter**（含 12 个业务 key 常量随迁）：
- 数组类：getBagData/saveBag/getPassive/savePassive/getDailyScrolls/saveDailyScrolls/getFail/saveFail/getInsight/saveInsight/getTrail/saveTrail/getShopItems/saveShopItems/getLedger/getRewards/saveRewards
- 数值类：getCrystal/setCrystal/getAura/setAura
- schema 版本纯读写：getSchemaVersion/setSchemaVersion

全部函数体与迁移前**逐字符一致**（含 getDailyScrolls 内嵌的日期降序稳定排序、各默认值、异常处理、云钩子调用顺序）。

## 14. Rejected Functions

| 函数 | 拒绝原因 |
|---|---|
| `addLedger` | 账本**记录创建**（生成 ts、unshift、截断 300 条）= Domain 职责，非纯 Adapter；且迁移前即无云钩子、直写 localStorage，属既有事实，保留原位 |
| `hasReward` | 领域查询（读 getRewards 判断） |
| `addReward` | 领域写入（构造记录 + saveRewards） |
| getFbConfig/saveFbConfig/cloudCfg/cloudMeta/setCloudMeta/getNotionConfig/saveNotionConfig | 云配置 Adapter，属 Phase 9 云同步范畴（§20），本阶段保持原位 |
| backupAllData/restoreBackup/validateMigration/migrateAllData/initDefaultData/importAllData/confirmResetAll | 备份/恢复/迁移/初始化/导入/重置，全部只审计不迁移（§7–10） |

## 15. Module Structure

```
js/
└── core/
    ├── ids.js      （Phase 1-D）
    ├── dates.js    （Phase 1-D）
    └── storage.js  （Phase 1-E：12 个业务 key 常量 + 21 个 Storage Adapter + window 暴露）
```

storage.js 内部分区：业务 key 常量 → 数据层 Adapter（数组类 → 行迹 → 晶核/灵气/万宝阁 → ledger → schema → rewards）→ window 暴露。**无第二个 Storage 模块；未创建 store.js/migration.js/sync.js。**

## 16. Before Architecture

```
业务函数（index.html）
  ↓ 调用 getXxx()/saveXxx()
index.html 内联存储区（447–492 行）
  ↓ localStorage.getItem/setItem
localStorage
  ↓（saveXxx 内部）
fbAutoUpload(模块) → cloudQueueSync()   （云钩子，定义于 index.html 云段）
```

## 17. After Architecture

```
业务函数（index.html，零修改）
  ↓ 调用 getXxx()/saveXxx()（window 全局，行为逐字符不变）
js/core/storage.js（12 key 常量 + 21 Adapter）
  ↓ localStorage.getItem/setItem（同一批 key，名称未变）
localStorage
  ↓（saveXxx 内部，顺序未变）
fbAutoUpload(模块) → cloudQueueSync()   （定义仍位于 index.html 云段，运行时解析）
```

## 18. Global Compatibility

- 21 个函数全部 `window.X = X` 显式暴露；浏览器实测 `windowVisible = []`（无一缺失）
- 函数名零改动，调用方零修改（onclick 内联 / 业务函数 / 云段代码全部原样引用）
- 12 个业务 key 常量位于全局词法作用域（const），后续脚本（含备份/导入/重置逻辑）按名引用不受影响——实测备份/恢复/播种/导入/重置相关代码全部正常（回归通过）
- `const` 与 `function` 双全局机制均验证无冲突（SyntaxError 无）

## 19. Script Loading Order

```
（head：css ×3 → manifest → CDN：firebase ×2 → supabase）
js/core/ids.js          （Phase 1-D）
js/core/dates.js        （Phase 1-D）
js/core/storage.js      （Phase 1-E）
主业务 inline <script>
SW 注册 <script>
```

storage.js 引用 `fbAutoUpload` / `cloudQueueSync`（主脚本内声明）——均在**调用时**解析，加载顺序正确。已实测无 ReferenceError。

## 20. Data Structure Impact

**无**。Task/TaskInstance/Scroll/CompletionRecord/TrailRecord/TaskChain/Crystal/Aura/Inventory/Shop/PassiveSkill/FailRecord/Insight 结构零改动；localStorage key 一个字符未改；未新增兼容字段。

## 21. Event Impact

**无**。102 处内联 onclick、全部 addEventListener、document 委托原样；Storage Adapter 不参与事件。

## 22. Completion Chain Impact

**无**。`doCompleteTask` 未改动，仍调用 saveDailyScrolls/addCompletion/setCrystal/addLedger。专项实测（§28）确认完整。

## 23. Desktop Test（1440 × 900）

**PASS — 8/8**（真实浏览器）：首页 / 每日十课书架展开 / 待修行完成（晶核+1 行迹+1）/ 弹窗 / 刷新持久化 / 7 页导航。Console 0 错误、Network 0 失败。

> 首轮出现 1 个 `ERR_CONNECTION_CLOSED`（CDN 瞬时网络抖动，curl 实测 gstatic/jsdelivr 均 200 可达）；复测全绿，判定为环境性抖动非代码问题。

## 24. Mobile Test（390 × 844）

**PASS — 10/10**（真实浏览器）：底部导航 / 无横向溢出 / 弹窗未超屏 / 滚动 / 全部功能流程。Console 0 错误。

## 25. Console Test

**PASS**：无 ReferenceError / TypeError / `getXxx is not defined` / `saveXxx is not defined` / Storage 加载错误 / JSON parse error。

**Before/After 行为对比**（同一脚本，浏览器 Console 实测）：

| 项 | Before | After | 一致 |
|---|---|---|---|
| 23 函数 window 可见 | 23/23 | 23/23（windowVisible=[]） | ✅ |
| saveBag/saveDailyScrolls/setCrystal 钩子存在性 | true | true | ✅ |
| saveRewards/addLedger 无钩子（既有事实） | true | true | ✅ |
| 读取：daily/bag/trail/ledger/rewards/schema/晶核/灵气 | 1/4/0/0/0/4/0/0 | 1/4/0/0/0/4/0/0 | ✅ |
| 缺失 key 默认值（getShopItems→[]） | [] | [] | ✅ |
| 写入：setCrystal(5) → raw | "5" | "5" | ✅ |
| 写入：saveDailyScrolls JSON 往返 | 结构一致 | 结构一致 | ✅ |
| 刷新后重读：crystal/daily(含排序)/trail/ledger | 5/[TEST+auto]/0/0 | 5/[TEST+auto]/0/0 | ✅ |
| 函数体逐字符比对（git HEAD vs 运行时） | — | **23/23 IDENTICAL** | ✅ |

## 26. Persistence Test

**PASS**：写入（任务/卷/完成状态/晶核/行迹/账本/行囊）→ 真实刷新 → 全部保留。独立测试 profile（新建后即弃），未触碰真实用户数据；未执行 localStorage.clear()；未使用 mock。

## 27. PWA Test

**PASS — 6/6**：SW activated、CSS 网络 200、运行时缓存含全部 css、刷新正常。
- `manifest.json` / `sw.js` / `version.txt`：**零修改**
- 新增 `js/core/storage.js` 由 sw.js 运行时缓存策略自动缓存（首次加载后进入 CacheStorage，离线可用），PWA 代码无需改动

## 28. Regression Test

**PASS**。真实浏览器回归覆盖：每日十课 / 多卷轴 / 自动卷 / 未完成顺延 / 书架 / 封卷 / 行迹 / 标签 / 标签继承 / 任务链（taskId 全量存在）/ 晶核 / 灵气 / 行囊 / 万宝阁 / 被动功法 / 走火入魔录 / 悟道札记 / 数据同步渲染（fb/supabase/notion 未配置不报错）/ PWA。

**完成链专项**（真实调用 doCompleteTask）：

```json
{
  "completeChain": {
    "before": {"crystal":0, "trail":0, "ledger":0},
    "after":  {"crystal":1, "trail":1, "ledger":1},
    "crystalDelta": 1, "trailDelta": 1, "ledgerDelta": 1,
    "taskCompleted": true, "completionRecord": true,
    "dupClickSafe": true, "uiToast": true
  },
  "allTasksKeyed": true
}
```

TaskInstance completed ✅ / CompletionRecord 创建 ✅ / Crystal +1 ✅ / Ledger 创建 ✅ / Trail 创建 ✅ / UI 更新 ✅ / **重复点击不重复奖励** ✅。saveDailyScrolls / addCompletion / setCrystal / addLedger 全部经迁移后 Adapter 正常工作。

## 29. Risk / Issues

| 风险/问题 | 等级 | 说明与处置 |
|---|---|---|
| getDailyScrolls 内嵌排序逻辑 | 低 | Adapter 内含日期降序稳定排序（既有行为），逐字符迁移保留；未来重构候选（报告 §10 Phase 2 输入） |
| saveRewards/setSchemaVersion/addLedger 无云钩子 | 低 | 既有事实，逐字符保留；未擅自补钩子（避免行为变化） |
| storage.js 依赖 fbAutoUpload/cloudQueueSync 调用时解析 | 低 | 加载顺序已验证（主业务脚本在后），运行时无 ReferenceError |
| const 常量跨脚本引用 | 低 | 全局词法作用域共享，备份/导入/重置引用正常（回归通过） |
| CDN 瞬时抖动（ERR_CONNECTION_CLOSED） | 环境 | 首轮 1 次，curl 200 可达，复测全绿；与本阶段代码无关 |
| addLedger/hasReward/addReward 仍内联 | 低 | Domain 职责，Phase 2+ 迁移候选 |

## 30. Diff Review

- `git diff --stat`：`index.html | 44 ++++----（+11/-33）`；`js/core/storage.js` 新增
- 逐行检查结论：仅 ① script 引用（+2 行）② 业务 key 常量与 21 个 Adapter 移除（−33 行）③ 指针注释（+9 行）；云端/备份 key、addLedger、hasReward/addReward、DATA_SCHEMA_VERSION 按设计保留
- **未出现**：业务逻辑重写 / 函数重命名 / 调用方改写 / 数据结构修改 / key 修改 / 事件机制修改 / 云同步重写 / 初始化顺序改变
- 不允许触碰文件（manifest/sw/version/css/.github）diff 为空

## 31. Git Commit

`git add index.html js/core/storage.js .ai` → `git commit -m "refactor: phase-1e storage module pilot"`（实际完成 Storage Adapter 外移，故用 refactor 而非 docs）

## 32. Git Push

`git push origin v2-dev`（HTTP/1.1 + 令牌 Basic auth；失败重试策略沿用流水线约定）

## 33. Remote Verification

按 Remote Completion Rule v1.1：`git fetch origin` → `git rev-parse HEAD` == `git rev-parse origin/v2-dev` → `git status` clean → GitHub API 实测（最新 commit / message / changed files / phase-1e-report.md / AI_STATE.md / CURRENT_PHASE.md / CHANGELOG.md / storage.js / index.html 远程存在）。

## 34. Result

**PASS**

```
Implementation: PASS（12 业务 key 常量 + 21 Storage Adapter 外移，行为逐字符不变，调用方零修改）
Testing: PASS
Browser Verification: PASS（Before/After 快照一致 + 23/23 逐字符一致 + 桌面 8/8 + 移动 10/10 + PWA 6/6 + 完成链专项）
Regression: PASS
Report: PASS
Git Commit: refactor: phase-1e storage module pilot
Git Push: PASS
Remote Verification: PASS
```

## 35. Next Task

**Phase 2：WAITING_FOR_HUMAN_APPROVAL**

> 注：按指令 §三十，若人工审核判断 Phase 1 尚需 Phase 1-F 等子任务，则以实际审核结论为准填写；本报告按"Phase 1 后续拆分项待定"处理，禁止自动启动任何下一任务。
> 最终 PASS/FAIL 由 ChatGPT 独立审核，不以本报告自报为准。
