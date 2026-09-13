# Phase 2-E Report

## 1. Baseline
- Branch: v2-dev；HEAD: `a4cec3a5102038064ec7a9c7f56289a97669879b`；Local == Remote；Working Tree clean

## 2. Final Commit
- `refactor(store): standardize safe access paths`（实际 SHA 见 Git 章节）

## 3. Store Access Audit（访问矩阵）
以实际代码为准（index.html + js/core/storage.js + js/core/store.js）：

| 数据 | READ 旧 API（剩余） | WRITE 旧 API（剩余） | Store READ（累计） | Store WRITE（累计） |
|---|---|---|---|---|
| dailyScrolls | getDailyScrolls：migration(623/631/768)/统计(931/951/965)/封卷(1054-1074)/completion(1154)/TaskChain(1363+)——全部 BUSINESS-COUPLED/INFRASTRUCTURE 保留 | saveDailyScrolls：migration(712/831)/封卷(1058/1069)/completion(1168)/TaskChain(1653+)——保留 | renderDailyShelf、getDayScrollIndex、getScrollNoById、collectAllTags | —（无安全 CRUD 写路径） |
| trail | getTrail：migration(717/738)/completion(1169)/行迹编辑删除(1194/1225/1329/1355)——保留 | saveTrail：migration(733)/行迹编辑删除(1220/1228/1371/1384)——保留 | renderTrail、collectAllTags、nextTrailOrder | — |
| bag | 剩余：云/导出/导入(2443/2526/2658/2686/2707)、doShopBuy(2306)——INFRASTRUCTURE/BUSINESS-COUPLED 保留 | 剩余：云(2444/2678/2695)——INFRASTRUCTURE 保留 | renderBag、renderHome、saveNewBagItem、openBagDetail、openBagEdit、saveEditBag、confirmDelBag、confirmDeleteBagSelected | saveNewBagItem、confirmDelBag、saveEditBag、confirmDeleteBagSelected |
| passive | 剩余：云/导出——保留 | 剩余：云——保留 | renderPassive、renderHome、saveAddPassive、openPassiveEdit、saveEditPassive、confirmDelPassive | saveAddPassive、confirmDelPassive、saveEditPassive |
| fail | 剩余：云/导出——保留 | 剩余：云——保留 | renderFail、renderHome、saveAddFail、openFailDetail、openEditFail、saveEditFail、confirmDelFail | saveAddFail、confirmDelFail、saveEditFail |
| insight | 剩余：云/导出——保留 | 剩余：云——保留 | renderInsight、renderHome、saveAddInsight、openInsightDetail、openEditInsight、saveEditInsight、confirmDelInsight | saveAddInsight、confirmDelInsight、saveEditInsight |

## 4. SAFE migrations（本阶段迁移，逐点验证安全）
**WRITE（5 处普通 CRUD 保存）**：
1. confirmDeleteBagSelected：`saveBag(arr)` → `XiantuStore.bag.save(arr)`（批量删除，纯 filter+保存）
2. saveEditBag：`saveBag(arr)` → `XiantuStore.bag.save(arr)`（编辑物品）
3. saveEditPassive：`savePassive(arr)` → `XiantuStore.passive.save(arr)`（编辑功法）
4. saveEditFail：`saveFail(arr)` → `XiantuStore.fail.save(arr)`（编辑失败记录）
5. saveEditInsight：`saveInsight(arr)` → `XiantuStore.insight.save(arr)`（编辑悟道）

**READ（24 处，纯读取无副作用）**：
- bag 6：saveNewBagItem 读、openBagDetail、openBagEdit、saveEditBag 读、confirmDelBag 详情读、confirmDelBag 删除回调读
- passive 5：saveAddPassive 读、openPassiveEdit、saveEditPassive 读、confirmDelPassive 详情读、删除回调读
- fail 6：saveAddFail 读、openFailDetail、openEditFail、saveEditFail 读、confirmDelFail 详情读、删除回调读
- insight 6：saveAddInsight 读、openInsightDetail、openEditInsight、saveEditInsight 读、confirmDelInsight 详情读、删除回调读
- 纯计算 5：getDayScrollIndex、getScrollNoById、collectAllTags（daily+trail 两处）、nextTrailOrder

## 5. BUSINESS-COUPLED retained paths（业务耦合，保留）
- doCompleteTask（1154，completion）、addCompletion（1169）、addReward、addLedger（460）、setCrystal/setAura、doShopBuy（2306，商店购买涉晶核灵气）、unlockScroll/resealScroll（1054-1069，封卷）、TaskChain（1545-1696）、Auto Scroll（1784-1805）、renderHome 内 getDailyScrolls（951，allDone 业务判断）、getTodayStats（931，统计含业务语义）

## 6. INFRASTRUCTURE retained paths（基础设施，保留）
- migration（623/631/717/738/768/712/733/831）、backup（605-607）、restore（611-615）、import/export（2695/2696/2686/2707）、reset、cloud config（2392-2393/2469/2487/2523-2525/2559）、cloud sync（2443-2444/2526/2658/2678/applyModuleData）、初始化默认数据（836-877）

## 7. Store Boundary
- 48 处 XiantuStore 调用全部为 6 集合 `.get()/.save()`；越界扫描仅命中注释/定义行
- store.js 未增加任何业务方法；仅文件头注释追加 Phase 2-E 说明
- 浏览器边界实测（store2d 基础 + 2E 全流程）：无 localStorage/DOM/云/资源/业务判断

## 8. Storage Boundary
- storage.js 零修改；12 业务 key + 21 Adapter + cloud hooks（fbAutoUpload/cloudQueueSync）原位
- localStorage key / JSON shape / 默认值：零修改（Store.get == 旧 API 全 true）

## 9. Cloud Hook
- 6 个 saveXxx 仍含 cloudQueueSync（实测 true）；Store 不调用云；链路 Business → Store → Storage → localStorage → 原 cloud hooks 未绕过

## 10. Persistence
- 编辑 bag/passive/fail/insight → 真实刷新 → 数据保留（实测 passive0/fail0/insight0 保留、bag 删除保持）
- 批量删除 → 刷新 → 保持删除状态（bag 4→0）
- Store READ == 旧 API READ（oldEq true）

## 11. Desktop 1440×900
**12/12 PASS**：首页+Store dashboard / 每日十课书架 / 展开任务列表 / 待修行完成 / 刷新持久化 / bag·passive·fail·insight 增删持久化 / 7 页导航 / Console 0 / Network 0

## 12. Mobile 390×844
**15/15 PASS**：上述全部 + 无横向溢出（sw=390）/ 底部导航（flex）/ 9 导航入口 / Console 0 / Network 0

## 13. Console
Desktop/Mobile/PWA 三模式 0 页面错误（PAGE_ERRORS=[]）

## 14. Network
三模式 0 失败资源

## 15. Regression
- 完成链：crystalDelta=1、trailDelta=1、ledgerDelta=1、dupClickSafe=true、completionRecord=true、PAGE_ERRORS=[]
- 6 集合 UI 增删持久化全通过；7 页导航全通过
- Store 2E 专项：编辑 4 集合经 Store 保存成功、详情读取经 Store（bag0=P2E编辑物品）、批量删除经 Store（4→0）、纯计算 4 项等价、旧 API 12 个保留

## 16. PWA
**5/5 PASS**（SW activated、CSS 3 文件 200、刷新正常）；manifest.json/sw.js/version.txt 零修改（git diff 确认）

## 17. Diff Audit
- `git diff --stat`：index.html 69 行（44+/34-）、store.js +9（注释）、新增 .ai/store-access-policy.md
- `git diff --check`：通过
- 无无关重构/格式化污染/旧功能删除/数据 schema 修改/PWA 修改/高风险业务修改
- 唯一修复：getScrollNoById 迁移时注释与下一行被工具合并（语法错误），已修复并复测通过

## 18. Node Test
项目无 package.json → **Node Test = NOT IMPLEMENTED**（未伪造）；已执行真实浏览器回归 + Console/Network/Persistence + 静态调用审计

## 19. Remote Verification
见 Git 章节（Commit + Push + HEAD 比对 + GitHub API 实测）

## 20. AI_STATE
UPDATED（Phase 2-E COMPLETED / WAITING_FOR_REVIEW；Next: Phase 2-F / WAITING_FOR_HUMAN_APPROVAL）

## 21. CURRENT_PHASE
UPDATED（Phase 2 IN_PROGRESS；当前子任务 Phase 2-E；下一子任务 Phase 2-F 等待人工批准）

## 22. Store Access Policy
新增 `.ai/store-access-policy.md`（访问规范：普通业务优先 Store → Storage → localStorage+cloud hooks；高风险区域清单；渐进迁移原则）

## 23. Result
**PASS**（执行完成；最终 PASS/FAIL 由 ChatGPT 独立读取 GitHub 审核）

## 24. Next Task
- Phase 2-F：WAITING_FOR_HUMAN_APPROVAL（禁止自动启动）
