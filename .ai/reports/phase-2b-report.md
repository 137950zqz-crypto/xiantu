# Phase 2-B Report

> 日期：2026-09-09
> 子任务：Phase 2-B · Store 第二批安全迁移（受控读写边界试点）
> 性质：在 Phase 2-A（纯读取）基础上，增加真实、低风险、可验证的**写入路径**经 Store。非全量迁移。

## 1. Phase

Phase 2-B（Phase 2 · Storage/Store 数据层拆分的第二个试点子任务）。

## 2. Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD（迁移前） | `0dcf71e3ccd3726684ae98459ea59832d3837044`（refactor: phase-2a store layer pilot） |
| origin/v2-dev | 同上，一致 |
| Working Tree | CLEAN（迁移前） |

## 3. Audit

对 index.html + js/core/storage.js 做实际代码审计。storage.js 现有 12 个业务 key + 21 个 Adapter（含 getBagData/saveBag、getPassive/savePassive、getFail/saveFail、getInsight/saveInsight、getShopItems/saveShopItems、getCrystal/setCrystal、getAura/setAura、getLedger、getRewards/saveRewards、getSchemaVersion/setSchemaVersion）。候选集合（bag/passive/fail/insight/shopItems）调用点全量 grep 定位（每集合 12~14 处调用，分布于渲染、CRUD、云快照、导入导出）。

## 4. Candidate comparison

| 候选 | get/save | 调用点 | CRUD 写点 | 业务判断 | UI | 云钩子 | 奖励/多资源 | 重复调用 | 初始化特殊 | 迁移/备份 | 风险 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **bag（行囊）** | getBagData/saveBag | 13 | 5（新增/编辑/删除/批量删除/商店购买） | CRUD 无，购买有 | 有 | 有（save 内） | 购买会动晶核/灵气 | 无 | 默认 4 物品初始化 | 导出/导入/快照 | **低（CRUD）/ 高（购买，不迁）** |
| **passive（被动功法）** | getPassive/savePassive | 12 | 3（新增/编辑/删除） | 无 | 有 | 有（save 内） | 无 | 无 | 默认 4 功法初始化 | 导出/导入/快照 | **低** |
| fail（走火入魔录） | getFail/saveFail | 12 | 3 | 无 | 有 | 有（save 内） | 无 | 无 | 无 | 导出/导入/快照 | 低 |
| insight（悟道札记） | getInsight/saveInsight | 12 | 3 | 无 | 有 | 有（save 内） | 无 | 无 | 无 | 导出/导入/快照 | 低 |
| shopItems（万宝阁） | getShopItems/saveShopItems | 11 | 3 | 有（购买逻辑） | 有 | 有（save 内） | **购买会动晶核** | 无 | 默认商品初始化 | 导入 | 中（购买不迁） |
| crystal / aura | setCrystal/setAura | — | — | 有 | 有 | 有 | 是 | 是 | 是 | 是 | **禁止**（指令七） |
| ledger / rewards / completion / auto-scroll / task chain / migration / cloud config / backup / reset / import-export | — | — | — | — | — | — | — | — | — | — | **禁止**（指令七） |

## 5. Selected modules

**bag + passive**（指令优先级：纯 CRUD 数据集合，第一优先）。

## 6. Store API changes

store.js 扩展（保持 window.XiantuStore classic script）：

```js
window.XiantuStore = {
  dailyScrolls: { get() { return getDailyScrolls(); }, save(data) { return saveDailyScrolls(data); } },   // Phase 2-A
  trail:       { get() { return getTrail(); },       save(data) { return saveTrail(data); } },             // Phase 2-A
  bag:         { get() { return getBagData(); },     save(data) { return saveBag(data); } },               // Phase 2-B
  passive:     { get() { return getPassive(); },     save(data) { return savePassive(data); } }            // Phase 2-B
};
```

无 BaseStore/GenericStore/RepositoryFactory/StoreManager 等抽象；无 ES Module / import / export / bundler / package.json。

## 7. Migrated call sites

4 个**真实 WRITE** 调用点（占 bag/passive CRUD 写点的 4/8）：

| # | 函数 | 行号 | 原调用 | 现调用 | 类型 |
|---|---|---|---|---|---|
| 1 | saveNewBagItem | 2026 | saveBag(arr) | XiantuStore.bag.save(arr) | 新增物品 |
| 2 | confirmDelBag | 2057 | saveBag(arr) | XiantuStore.bag.save(arr) | 删除物品 |
| 3 | saveAddPassive | 2087 | savePassive(arr) | XiantuStore.passive.save(arr) | 新增功法 |
| 4 | confirmDelPassive | 2106 | savePassive(arr) | XiantuStore.passive.save(arr) | 删除功法 |

实际写入链路（浏览器实测）：`saveNewBagItem → XiantuStore.bag.save → saveBag → localStorage.setItem + fbAutoUpload("bag") + cloudQueueSync()`。

## 8. Non-migrated call sites

保留旧 API 直调（渐进迁移，不全局替换）：
- bag：saveEditBag（编辑）、confirmDeleteBagSelected（批量删除）、doShopBuy（商店购买——涉及晶核/灵气多资源，**禁止**）、getModuleData/applyModuleData/cloudSnapshot/uploadAllToNotion/exportAllData/exportSingle/pullFromNotion/importAllData（云同步/快照/导入导出，**禁止**）
- passive：saveEditPassive（编辑）、云同步/导入导出点同上
- fail/insight/shopItems 全部调用点本阶段未迁移（后续 Phase 候选）

## 9. Storage boundary

- Store 只做数据访问委托；不直接访问 localStorage/sessionStorage（浏览器 toString 扫描 true）
- storage.js 职责不变：getXxx/saveXxx 函数体逐字符未动，云钩子仍在其内
- 未新建 store 之外的新模块

## 10. Cloud hook verification

浏览器实测：`saveBag.toString()` 含 `localStorage.setItem` + `fbAutoUpload("bag")` + `cloudQueueSync()`；`savePassive` 同理（"passive"）；Store 自身 toString 不含任何 fbAutoUpload/cloudQueueSync/firebase/supabase/notion。链路 `Business → Store → Storage → localStorage → 原有 cloud hooks` 顺序未变。

## 11. Before/After behavior

Store 专项 A–J（浏览器实测）：
- A 原 API 存在：getBagData/saveBag/getPassive/savePassive 均 function → true
- B Store API 存在：XiantuStore.bag/passive 的 get/save 均 function → true
- C Store 委托 Storage Adapter：toString 含对应 getXxx/saveXxx → true
- D 写入 key 不变：STORAGE_KEY_BAG=xiantu_bag_data、STORAGE_KEY_PASSIVE=xiantu_passive（storage.js 常量未动）
- E 数据结构不变：bag/passive 数组结构 JSON 完全一致 → true
- F 返回值不变：Store.get() 与旧 getXxx() 内容相等 → true
- G 默认值不变：[] 兜底（storage.js 原样）→ true（页面自带 4 件默认物品/4 门默认功法属既有初始化行为，非本阶段引入）
- H cloud hook 不变 → true
- I refresh 后数据仍存在 → true（见 §15）
- J 原有业务功能正常 → 全量回归 PASS（见 §18）

## 12. Desktop test（1440 × 900）

**PASS — 8/8**：首页 / 每日十课书架展开 / 待修行完成（晶核+1 行迹+1）/ 弹窗 / 刷新持久化 / 7 页导航（含行囊、被动功法页正常打开与渲染）。

## 13. Mobile test（390 × 844）

**PASS — 10/10**：底部导航 / 无横向溢出（390==390）/ 弹窗 358px / 滚动 / 全部功能流程。

## 14. Console

**PASS**：0 errors；无 `XiantuStore is undefined` / `saveBag is not defined` / `savePassive is not defined` / JSON parse error。

## 15. Persistence

**PASS**（真实 UI 操作 + 真实刷新，独立测试 profile）：
- 行囊：新增「UI测试物品」（经 XiantuStore.bag.save）→ 刷新 → 存在；删除 → 刷新 → 仍删除
- 功法：新增「UI测试功法」（经 XiantuStore.passive.save）→ 刷新 → 存在；删除 → 刷新 → 仍删除
- 10/10 断言全 true，PAGE_ERRORS=[]
- 未清空 localStorage；未触碰真实用户数据；未用 mock

## 16. Completion regression

**PASS**：待修行 → 完成 → Crystal +1 → Trail +1 → Ledger +1 → CompletionRecord；**dupClickSafe=true**（重复点击不重复奖励）。完成链未迁移，回归无影响。

## 17. PWA

**PASS — 6/6**：SW 注册 activated / CSS 网络加载 200 / 运行时缓存含 css（xiantu-v7）/ 刷新正常。manifest.json / sw.js / version.txt **零修改**；store.js 由运行时缓存策略自动缓存。

## 18. Full regression

**PASS**：桌面 8/8 + 移动 10/10 + PWA 6/6 + 完成链专项 + bag/passive UI 增删持久化。覆盖每日十课 / 多卷轴 / 自动卷 / 未完成顺延 / 书架 / 封卷 / 行迹 / 标签 / 任务链 / 晶核 / 灵气 / 行囊 / 万宝阁 / 被动功法 / 走火入魔录 / 悟道札记。

## 19. Diff audit

- `git diff --check`：**PASS**
- `git diff --stat`：index.html +12/−4；js/core/store.js +10
- 变更仅限 4 处写调用点 + store.js 两个集合扩展 + 行内注释
- 未触碰：css/、manifest.json、sw.js、version.txt、.github/、storage.js、ids.js、dates.js、任何业务逻辑/数据结构/key/事件/云同步代码
- 无顺手重构、无全局替换（剩余 CRUD 写点 saveEditBag/saveEditPassive/confirmDeleteBagSelected 保留旧 API）

## 20. Git commit

`git add index.html js/core/store.js .ai` → `git commit -m "refactor: phase-2b expand store boundary"`

## 21. Git push

`git push origin v2-dev`（HTTP/1.1 + 令牌，失败重试至成功）

## 22. Remote verification

`git fetch origin` → `git rev-parse HEAD` == `git rev-parse origin/v2-dev` → `git status` clean；GitHub API 实测最新 commit SHA / commit message / changed files / phase-2b-report.md / 状态文件远程存在。

## 23. Final result

**PASS**（执行完成；最终 PASS/FAIL 由 ChatGPT 独立审核 GitHub：Commit / store.js 代码 / index.html Diff / Storage 边界 / 云钩子 / 控制层状态）。

## 24. Next phase

**Phase 2-C：WAITING_FOR_HUMAN_APPROVAL**（本阶段已停止，未自动进入）。
