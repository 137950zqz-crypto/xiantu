# 变更日志（CHANGELOG）

格式：`日期 · 内容`。记录每个 Phase 的关键动作与结果。

## 2026-09-13 · Phase 2-D（扩大安全 READ 覆盖，不扩大业务边界）

- 8 个安全 READ 迁移经 Store（Business/UI → XiantuStore → Storage → localStorage → 原有 cloud hooks）：
  - renderHome 4 项 dashboard 计数：dashBag/dashPassive/dashTrail/dashInsight → XiantuStore.bag/passive/trail/insight.get().length
  - renderBag / renderPassive / renderFail / renderInsight 列表渲染 → XiantuStore.bag/passive/fail/insight.get()
- 迁移安全性：全部为纯渲染/计数读取，无副作用、无业务判断、非云上下文；旧 API（getBagData/getPassive/getFail/getInsight/getTrail/getDailyScrolls 等 12 个）全部保留可调用
- 保留例外（零迁移）：50 处 localStorage 直访全部属例外区——migration（753）/backup（605-607）/restore（611-615）/初始化默认数据（836-877）/cloud config（2392-2393/2469/2487/2523-2525/2559）/云导入 applyCloudData（2528-2537）/ledger（460）；completion/reward/TaskChain/Auto Scroll/sealing/crystal/aura 未触碰
- Store 边界复核：14 处 XiantuStore 调用全部为 6 集合 .get()/.save()；store.js 仅更新文件头注释（追加 Phase 2-D READ 清单），行为零变更；key/数据结构/云钩子/PWA 零修改
- Store 专项（6 集合一致性 + dashboard + 边界 5 项 + 云钩子 + 写后刷新持久化）全通过；完成链回归（晶核+1/行迹+1/账本+1/防重复）PASS
- 真实浏览器回归：桌面 1440×900 **12/12**、移动 390×844 **15/15**（含无横向溢出 sw=390、底部导航 flex、9 导航入口）、PWA **5/5**（SW activated、CSS 3 文件 200、刷新正常）；6 集合 UI 增删 + 刷新持久化全通过；Console 0 错误、Network 0 失败
- 测试环境备注：历史 test-phase1a.js 被 /tmp 清理，已重建等价回归脚本 phase2d-regress.js；puppeteer-core 在测试工作区重装（不影响项目）
- Node test suite: NOT IMPLEMENTED（项目无 package.json，未伪造）；git diff --check 通过；Diff 仅限 index.html（+16/-8）+ store.js（+2 注释）+ .ai
- 状态：Phase 2-D COMPLETED / WAITING_FOR_REVIEW；Phase 2-E WAITING_FOR_HUMAN_APPROVAL

## 2026-09-08 · Phase 0 完成 + AI 开发流水线初始化

### Phase 0（仓库保护与基线）— 完成

- BASE_COMMIT：`678c95a9bf9001f7c7719be6ef4a491ded2ca217`
- 标签 `v1-baseline` 建立（指向原版 HEAD）
- 分支 `v2-dev` 建立（HEAD = BASE_COMMIT，业务代码零修改）
- 核心功能基线测试：**桌面 21/21、移动 11/11 通过**
- Console：0 错误 / 0 警告；Resource：0 失败
- 数据持久化：任务 / 完成状态 / 资源刷新后全部保留
- 回滚点已确认：`v1-baseline` 可直接回滚

### AI 自动开发流水线 — 初始化

- 建立 `.ai/` 控制层：PROJECT_SPEC / DEVELOPMENT_RULES / CURRENT_PHASE / ACCEPTANCE / ARCHITECTURE / CHANGELOG / AI_STATE
- 归档 Phase 0 基线报告 → `.ai/reports/phase-0-baseline.md`
- 建立 `.github/workflows/test.yml` 与 `.github/workflows/regression.yml`
- 业务代码未修改；用户数据未修改；Phase 1 未启动（WAITING_FOR_APPROVAL）

## 2026-09-08 · Phase 1-A（CSS / UI 基础层拆分）

- `index.html` 内联 `<style>`（16-294 行）拆分为 `css/base.css` + `css/layout.css` + `css/components.css`
- 视觉 1:1 验证通过：桌面/移动 242 选择器 × 全属性测量对比 0 差异；真实浏览器桌面 8/8、移动 10/10、PWA 6/6
- Console 0 错误、Network 0 失败、数据持久化通过、SW 运行时缓存自动覆盖 3 个 css 文件
- 未修改 JS / 数据结构 / sw.js / manifest.json / version.txt；65 处 JS 动态 inline style 保留
- 状态：Phase 1-A COMPLETED / WAITING_FOR_REVIEW；Phase 1-B WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 1-B（HTML 结构审计 + 最小拆分）

- 完整审计：2760 行 index.html → DOM 树（App Shell / 9 页面容器 / 全局组件 / 动态容器），约 95 个 id 的 JS 依赖映射、219 个顶层函数
- 判定：**不拆分 HTML**（JS 强 DOM 依赖 + 内联事件 + 无构建系统，激进拆分不安全）；仅加结构分区注释 + 3 个 aria-label（纯增量）
- 真实浏览器测试：桌面 8/8、移动 10/10、PWA 6/6；Console 0 错误、Network 0 失败、持久化通过
- 未修改 JS / CSS / 数据结构 / sw.js / manifest.json / version.txt
- 状态：Phase 1-B COMPLETED / WAITING_FOR_REVIEW；Phase 1-C WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 1-C（JS 架构审计 + 模块边界设计）

- **只审计、零代码迁移**：完整读取 2746 行内联 JS，建立 219 函数 × 职责 × 行号 × 依赖映射
- 关键发现：存储封装已成形（getXxx/saveXxx + 写时挂 fbAutoUpload/cloudQueueSync）；业务函数无绕过封装直写业务 key（除 setLocalSnapshot 刻意防回环）
- 完成链实证：doCompleteTask → saveDailyScrolls → addCompletion → addReward/setCrystal/addLedger → render*+showCompletionToast
- 模块映射 + 迁移顺序 + Tier 1（工具/存储/模型纯函数）/ Tier 2（迁移/自动卷/云同步）/ Tier 3（初始化/完成链/openPage/Modal/事件体系）已设计
- 真实浏览器测试：桌面 8/8、移动 10/10、PWA 6/6；Console 0 错误、持久化通过
- 未修改任何业务 JS；状态：Phase 1-C COMPLETED / WAITING_FOR_REVIEW；Phase 1-D WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 1-D（JS 模块化迁移最小安全试点）

- 从 index.html 内联 JS 抽离 10 个 Tier 1 纯工具函数 + 1 个测试钩子声明到外部模块：
  - `js/core/ids.js`：uid
  - `js/core/dates.js`：pad/fmtDate/fmtTime/fmtDateTime/getTodayStr/yesterdayStr/__DATE_OVERRIDE/fmtShortDate/fmtScrollNo
- 兼容策略：经典 `<script>` + window 显式暴露，函数名零改动、调用方零修改（219 业务函数 + 102 内联 onclick 原样）；加载顺序固定于主业务脚本之前
- `__DATE_OVERRIDE` 守卫声明（window.__DATE_OVERRIDE || ""）：生产行为一致，测试预加载注入兼容
- Before/After 浏览器 Console 实测：9 函数输出逐项一致；完成链专项：晶核+1/行迹+1/账本+1、CompletionRecord 创建、重复调用无重复奖励
- 真实浏览器测试：桌面 8/8、移动 10/10、PWA 6/6；Console 0 错误；持久化通过；manifest/sw/version 零修改
- 未修改业务逻辑/数据结构/事件机制/PWA；状态：Phase 1-D COMPLETED / WAITING_FOR_REVIEW；Phase 1-E WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 1-E（Storage 层最小安全迁移试点）

- 将已形成的 Storage Adapter 层从 index.html 外移到 `js/core/storage.js`：
  - 12 个业务 key 常量（BAG/PASSIVE/DAILY/FAIL/INSIGHT/TRAIL/CRYSTAL/AURA/SHOP/LEDGER/SCHEMA/REWARDS）
  - 21 个纯 Adapter（getBagData/saveBag/.../getSchemaVersion/setSchemaVersion/getRewards/saveRewards）
- 兼容验证：**23/23 函数体与迁移前逐字符一致**（git HEAD vs 运行时 toString 比对，含云钩子调用顺序）；Before/After 读取/写入/缺失 key 默认值/刷新重读逐项一致；window 全局可见 23/23
- 云钩子原样保留：saveXxx → setItem → fbAutoUpload(模块) → cloudQueueSync()；saveRewards/setSchemaVersion/addLedger 无钩子属既有事实，逐字保留
- 未迁移（按边界保留）：addLedger/hasReward/addReward（Domain 职责）、云配置 key 与读写、备份/恢复/迁移/初始化/导入/导出/重置逻辑（仅审计）
- 真实浏览器测试：桌面 8/8、移动 10/10、PWA 6/6、完成链专项（晶核+1/行迹+1/账本+1/防重复）；Console 0 错误；持久化通过；manifest/sw/version 零修改
- 未修改业务逻辑/数据结构/key/事件机制/PWA；状态：Phase 1-E COMPLETED / WAITING_FOR_REVIEW；Phase 2 / Phase 1-F（待定）WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 2-A（Store 层设计 + 最小安全迁移试点）

- 在 js/core/storage.js 之上建立 Store 数据访问边界 `js/core/store.js`（window.XiantuStore）：
  - dailyScrolls.get/save → getDailyScrolls/saveDailyScrolls；trail.get/save → getTrail/saveTrail
  - 纯委托 storage.js：无 localStorage 直访、无业务逻辑、无 DOM、无云同步逻辑（边界浏览器实测全通过）
- 迁移 2 条真实读取路径（其余 38 个调用点不动）：renderDailyShelf → XiantuStore.dailyScrolls.get()；renderTrail → XiantuStore.trail.get()
- 旧 API 保留（getDailyScrolls/saveDailyScrolls/getTrail/saveTrail 存在、可调用、行为不变）；localStorage key / 数据结构 / 云钩子链（saveXxx → setItem → fbAutoUpload → cloudQueueSync）零修改
- Store 专项 A/B/C/D 全通过（存在/API/旧API/数据一致）+ Store.save→刷新→Store.get 持久化通过
- 真实浏览器测试：桌面 8/8、移动 10/10、PWA 6/6、完成链专项（晶核+1/行迹+1/账本+1/防重复）；Console 0 错误
- Node test suite: NOT IMPLEMENTED（无 package.json，未伪造测试；已做 node --check 语法检查）
- 未修改业务逻辑/数据结构/key/事件/PWA/迁移/云同步；状态：Phase 2-A COMPLETED / WAITING_FOR_REVIEW；Phase 2-B WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 2-B（Store 第二批安全迁移：受控读写边界试点）

- store.js 扩展 bag/passive 两个集合（XiantuStore.bag.get/save → getBagData/saveBag；XiantuStore.passive.get/save → getPassive/savePassive），仍为纯委托（无 localStorage/DOM/云/业务判断，浏览器边界实测全 true）
- 迁移 4 个**真实 WRITE** 调用点（其余调用点保留旧 API）：saveNewBagItem（新增物品）、confirmDelBag（删除物品）、saveAddPassive（新增功法）、confirmDelPassive（删除功法）→ XiantuStore.bag.save / XiantuStore.passive.save
- 未迁移（渐进保留）：saveEditBag/saveEditPassive/confirmDeleteBagSelected/doShopBuy（万宝阁购买，涉晶核灵气，禁止）/全部云同步·快照·导入导出点
- 云钩子链保持（save → setItem → fbAutoUpload → cloudQueueSync 由 storage.js 负责）；key/数据结构/默认值/事件/PWA 零修改
- Store 专项 A–J 全通过；bag/passive 真实 UI 增删 + 刷新持久化 10/10；桌面 8/8、移动 10/10、PWA 6/6、完成链（晶核+1/行迹+1/账本+1/防重复）；Console 0 错误
- Node test suite: NOT IMPLEMENTED（未伪造）；git diff --check 通过
- 状态：Phase 2-B COMPLETED / WAITING_FOR_REVIEW；Phase 2-C WAITING_FOR_HUMAN_APPROVAL

## 2026-09-09 · Phase 2-C（Store 第三批安全迁移 + Store 边界规范化 + 控制层一致性修正）

- store.js 扩展 fail/insight 两个集合（XiantuStore.fail.get/save → getFail/saveFail；XiantuStore.insight.get/save → getInsight/saveInsight），仍为纯委托（无 localStorage/DOM/云/资源业务逻辑，浏览器边界实测全 true，含 noResource）
- 文件头注释从"Phase 2-A 试点"规范化为完整职责说明（6 集合清单 + 禁止项 + 已迁移路径），**仅注释、行为零变更**
- 迁移 4 个真实 WRITE 调用点：saveAddFail / confirmDelFail → fail.save()；saveAddInsight / confirmDelInsight → insight.save()（其余调用点保留旧 API）
- 控制层一致性修正：AI_STATE.md 代码块残留 `Next Task: Phase 1-D` / `Last Completed Phase: 0` 修正为 Phase 2-D / Last Completed Phase: 1（Phase 1 大阶段完成，历史字段加 Archive 说明）；CURRENT_PHASE.md 中 Phase 1 由 IN_PROGRESS 修正为 COMPLETED；两文件当前状态字段完全一致
- 边界复核：2-A/2-B 已有 4 个 WRITE 仍经 XiantuStore；编辑路径 saveEditBag/saveEditPassive 与购买路径 doShopBuy 保持旧 API
- Store 专项（6 集合 A–J + 已有回归）全通过；fail/insight 真实 UI 增删 + 刷新持久化 10/10；桌面 8/8、移动 10/10、PWA 6/6、完成链（+1/+1/+1/防重复）；Console 0 错误
- Node test suite: NOT IMPLEMENTED（未伪造）；git diff --check 通过；Diff 仅限 .ai + index.html + store.js
- 状态：Phase 2-C COMPLETED / WAITING_FOR_REVIEW；Phase 2-D WAITING_FOR_HUMAN_APPROVAL

## 2026-09-08 · AI Pipeline v1.1（远程完成闭环固化）

- GitHub Push is now mandatory for task completion.
- Remote HEAD verification is mandatory.
- Local completion does not equal task completion.
- Phase advancement remains manually approved.
- Main merge/push remains disabled.
- 更新文件：`.ai/DEVELOPMENT_RULES.md`（新增规则 8）、`.ai/CURRENT_PHASE.md`、`.ai/AI_STATE.md`、新增 `.ai/reports/pipeline-v1.1-remote-completion.md`
- 业务代码未修改；用户数据未修改；Phase 1 未启动
