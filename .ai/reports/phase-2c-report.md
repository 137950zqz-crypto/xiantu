# Phase 2-C Report

> 日期：2026-09-09
> 子任务：Phase 2-C · Store 第三批安全迁移 + Store 边界规范化 + 控制层一致性修正
> 性质：渐进迁移第三批（fail/insight 写路径）+ 注释规范化 + 控制层一致化。非大规模重构。

## 1. Phase

Phase 2-C（Phase 2 · Storage/Store 数据层拆分的第三个试点子任务）。

## 2. Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD（迁移前） | `e8dd50bd3c351e5f41de60e653fa9678f4049c22`（refactor: phase-2b expand store boundary） |
| origin/v2-dev（ls-remote 实测） | 同上，一致 |
| Working Tree | CLEAN（迁移前） |

## 3. Repository state

- 本地 HEAD == 远程 HEAD == e8dd50b（`git rev-parse` + `ls-remote` 双确认）
- working tree clean；未重做 Phase 2-A/2-B

## 4. Control layer audit

发现两处不一致（指令第五项所述）：

1. `.ai/AI_STATE.md` 代码块 `Next Task: Phase 1-D`——Phase 1 时期历史残留，与表格中 `Next Task: Phase 2-C` 矛盾；
2. `.ai/AI_STATE.md` `Last Completed Phase: 0` 与 `.ai/CURRENT_PHASE.md` 中 `Phase 1 | IN_PROGRESS`——而 Phase 1 子任务 1-A~1-E 已全部 PASSED 并经人工审核（各阶段指令明确确认），实际已推进至 Phase 2-C，属过期状态；
3. `.ai/CURRENT_PHASE.md` 中 Phase 1 标 IN_PROGRESS 与当前进度矛盾。

## 5. Control layer fixes

- `AI_STATE.md` 代码块统一为：Current Phase: 2 / Current Task: Phase 2-C / Current Status: WAITING_FOR_REVIEW / Last Completed Phase: 1 / Next Task: Phase 2-D；新增历史字段说明（Archive 标注，旧值 Phase 1-D/Last Completed 0 已注明为历史残留，历史保留于 CHANGELOG）
- `AI_STATE.md` 含义表同步更新（Last Completed Phase: 1 = Phase 1 大阶段完成）
- `CURRENT_PHASE.md` 状态表更新：Phase 1 → **COMPLETED**（1-A~1-E 全部 PASSED 并经人工审核）；Phase 2 → IN_PROGRESS（子任务制）；当前子任务 Phase 2-C；下一子任务 Phase 2-D
- 两个文件当前状态字段完全一致，无互相矛盾的"当前 Phase"

## 6. Store current API

```js
window.XiantuStore = {
  dailyScrolls: { get(){return getDailyScrolls()}, save(data){return saveDailyScrolls(data)} },  // 2-A
  trail:       { get(){return getTrail()},       save(data){return saveTrail(data)} },            // 2-A
  bag:         { get(){return getBagData()},     save(data){return saveBag(data)} },              // 2-B
  passive:     { get(){return getPassive()},     save(data){return savePassive(data)} },          // 2-B
  fail:        { get(){return getFail()},        save(data){return saveFail(data)} },             // 2-C
  insight:     { get(){return getInsight()},     save(data){return saveInsight(data)} }           // 2-C
};
```

文件头注释已从"Phase 2-A 试点"规范化为完整职责说明（当前接入集合、禁止项、已迁移路径清单）。**仅改注释，行为零变更**。

## 7. Candidate audit

重新读取 storage.js / index.html / store.js 后全量调用图（当前行号）：

| 集合 | get/save | READ 点 | WRITE 点（CRUD） | 云/导入导出点 |
|---|---|---|---|---|
| fail | getFail/saveFail | renderFail(2115)、openFailDetail(2139)、openEditFail(2145) | saveAddFail(2134+2136)、saveEditFail(2151+2153)、confirmDelFail(2156+2158) | 2439/2440/2522/2654/2682/2703/2674/2691 |
| insight | getInsight/saveInsight | renderHome(948)、renderInsight(2166)、openInsightDetail(2190)、openEditInsight(2196) | saveAddInsight(2185+2187)、saveEditInsight(2202+2204)、confirmDelInsight(2207+2209) | 2439/2440/2522/2654/2682/2703/2674/2691 |
| shopItems | getShopItems/saveShopItems | renderShop(2217)、openShopItemMenu(2236)、openShopEdit(2260)、openShopBuy(2284)、doShopBuy(2297读) | saveAddShopItem(2254+2257)、saveEditShop(2272+2274)、confirmDelShop(2277+2279) | 2439/2440/2522/2682/2695 |

## 8. Candidate risk table

| 候选 | 纯 CRUD | 业务判断 | 资源/奖励 | 云特殊处理 | 初始化 | 迁移/备份 | 多集合联动 | 风险 |
|---|---|---|---|---|---|---|---|---|
| **fail** | 是 | 无 | 无 | 无（save 内标准钩子） | 无 | 无 | 无 | **低** |
| **insight** | 是 | 无 | 无 | 无（save 内标准钩子） | 无 | 无 | 无 | **低** |
| shopItems | 管理路径是 | 购买有 | **doShopBuy 动晶核/灵气+bag** | 无 | 默认商品 | 无 | 购买路径联动 bag/crystal | 中（管理路径可迁，购买不迁） |

## 9. Selected collections

**fail + insight**（指令第一优先：普通记录型集合；shopItems 因购买路径联动资源而落选——本阶段完全不碰 shopItems）。

## 10. Migrated call sites

4 个**真实 WRITE** 调用点（占 fail/insight CRUD 写点 4/6）：

| # | 函数 | 行号 | 原调用 | 现调用 | 类型 |
|---|---|---|---|---|---|
| 1 | saveAddFail | 2136 | saveFail(arr) | XiantuStore.fail.save(arr) | 新增失败记录 |
| 2 | confirmDelFail | 2158 | saveFail(arr) | XiantuStore.fail.save(arr) | 删除失败记录 |
| 3 | saveAddInsight | 2187 | saveInsight(arr) | XiantuStore.insight.save(arr) | 新增悟道札记 |
| 4 | confirmDelInsight | 2209 | saveInsight(arr) | XiantuStore.insight.save(arr) | 删除悟道札记 |

## 11. Non-migrated call sites

- fail/insight：saveEditFail / saveEditInsight（编辑，保留旧 API 渐进）；全部云同步/快照/导入导出点（applyModuleData/pullFromNotion/importAllData/getModuleData/cloudSnapshot/uploadAllToNotion/exportAllData/exportSingle）不碰
- shopItems：全部不迁（本阶段）
- crystal/aura/ledger/rewards/daily-scroll 自动化/completion/task chain/migration/backup/cloud config/reset/import-export：按指令排除

## 12. Store boundary verification

浏览器 toString 实测全 true：noLocalStorage（无 localStorage/sessionStorage）、noDOM（无 document/querySelector/innerHTML）、noCloud（无 fbAutoUpload/cloudQueueSync/firebase/supabase/notion）、**noResource**（无 crystal/aura/ledger/reward）。Store 保持"薄"边界。

## 13. Storage delegation verification

`XiantuStore.fail.save.toString()` 含 `saveFail`、`fail.get` 含 `getFail`；insight 同理（浏览器实测 true）。Storage Adapter（storage.js）函数体零修改。

## 14. Cloud hook verification

浏览器实测：`saveFail` 含 `fbAutoUpload("fail")`+`cloudQueueSync()`；`saveInsight` 含 `fbAutoUpload("insight")`+`cloudQueueSync()`；`saveBag`/`savePassive` 钩子同前。链路 `Business → Store → Storage → localStorage → 原有 cloud hooks` 顺序/参数/次数未变。

## 15. Existing Store regression

2-A/2-B 已迁移集合回归（浏览器实测全 true）：dailyScrolls/trail/bag/passive 的 Store.get() 与旧 API 数据一致；4 个已有 WRITE（saveNewBagItem/confirmDelBag/saveAddPassive/confirmDelPassive）经 grep 复核仍走 `XiantuStore.bag/passive.save`（未改回）；编辑路径 saveEditBag/saveEditPassive 保持旧 API；购买路径 `doShopBuy` 的 `saveBag(bag)` 保持旧 API（不进 Store 资源逻辑）。

## 16. New Store paths

新增 4 条：`saveAddFail → XiantuStore.fail.save → saveFail → localStorage+云钩子`；`confirmDelFail`、`saveAddInsight`、`confirmDelInsight` 同理。Store 专项 A–J 全通过（A 旧 API 10 个存在 / B 6 集合 API / C 委托 / E·F·G 数据一致 / H 云钩子 / boundary）。

## 17. Desktop（1440 × 900）

**PASS — 8/8**（首页 / 每日十课 / 待修行完成晶核+1 行迹+1 / 弹窗 / 刷新持久化 / 7 页导航；Console 0 错误、Network 0 失败）。

> 注：首轮出现 7/8，根因为测试脚本固定 profile（profile-p1a-desktop）数据跨运行累积导致点击目标已完成；清 profile 后 8/8，**非代码回归**。

## 18. Mobile（390 × 844）

**PASS — 10/10**（底部导航 / 无横向溢出 / 弹窗 / 滚动 / 全部功能流程；Console 0 错误）。

## 19. Console

**PASS**：三模式 + 专项测试 0 errors；无 XiantuStore 未定义 / saveFail 未定义 / 加载顺序错误 / 重复定义 / TypeError / ReferenceError。

## 20. Persistence

**PASS**（真实 UI 操作 + 真实刷新，独立 profile）：fail 新增「UI失败测试」→ 刷新存在 → 删除 → 刷新仍删除；insight 新增「UI悟道测试」→ 刷新存在 → 删除 → 刷新仍删除；10/10 断言 true，PAGE_ERRORS=[]。未清空 localStorage、未碰真实用户数据、未用 mock。

## 21. Completion Chain

**PASS**：crystalDelta=1 / trailDelta=1 / ledgerDelta=1 / taskCompleted=true / **dupClickSafe=true**；0 页面错误。完成链未迁移。

## 22. PWA

**PASS — 6/6**：SW 注册 activated / CSS 加载 200 / 运行时缓存（xiantu-v7）/ 刷新正常。manifest.json / sw.js / version.txt **零修改**（Diff 确认未出现）。

## 23. Full Regression

**PASS**：桌面 8/8 + 移动 10/10 + PWA 6/6 + 完成链专项 + fail/insight UI 持久化。覆盖每日十课/多卷/自动卷/顺延/书架/封卷/行迹/标签/标签继承/任务链/晶核/灵气/行囊/万宝阁/被动功法/走火入魔录/悟道札记。

## 24. Diff audit

- `git diff --check`：**PASS**
- 变更文件恰为允许范围：`.ai/AI_STATE.md`、`.ai/CURRENT_PHASE.md`、`index.html`（+8/−4 仅 4 处写点）、`js/core/store.js`（注释规范化 + fail/insight 集合）
- 未触碰：storage.js / css / manifest / sw / version / .github / 业务逻辑 / 数据结构 / key / 云钩子
- 无顺手重构、无全局替换

## 25. Git commit

`git add .ai index.html js/core/store.js` → `git commit -m "refactor: phase-2c extend store boundary"`

## 26. Git push

`git push origin v2-dev`（HTTP/1.1 + 令牌，失败重试至成功）

## 27. Remote verification

`git fetch origin` → `git rev-parse HEAD` == `git rev-parse origin/v2-dev` → `git status` clean；GitHub API 实测最新 commit SHA / changed files / store.js / index.html / AI_STATE.md / CURRENT_PHASE.md / phase-2c-report.md 远程存在。

## 28. Final result

**PASS**（执行完成；最终 PASS/FAIL 由 ChatGPT 独立审核 GitHub：commit / store.js / index.html Diff / Storage 边界 / 云钩子 / 控制层一致性）。

## 29. Next phase

**Phase 2-D：WAITING_FOR_HUMAN_APPROVAL**（本阶段已停止，未自动进入）。
