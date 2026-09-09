# Phase 1-B Report

> 日期：2026-09-09
> 子任务：Phase 1-B · index.html 页面结构 / UI 骨架审计与最小拆分

## 1. Objective

完整审计 `index.html` 的页面结构 / UI Skeleton，识别稳定的页面与组件边界，仅对安全、低风险区域做最小拆分；为未来 `pages/`、`components/`、`router/` 预留清晰结构。**禁止大规模 HTML 拆分、禁止引入 HTML 动态加载架构。**

## 2. Git Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD | `ceac6e9b6a355610884d1065197fc86d79191df0`（refactor: phase-1a split css foundation） |
| Working Tree | CLEAN |
| Remote | `origin` → `github.com/137950zqz-crypto/xiantu.git` |
| Local == Remote | 一致 |

## 3. Current HTML Structure Audit

`index.html`：2760 行（Phase 1-A 后）；head = meta/PWA manifest/3 个 CSS link；body = 静态骨架 + 1 个内联主脚本（2746 行）+ 1 个 SW 注册小脚本。

```
body
├── #syncBar.sync-bar          App Shell · 全局同步状态条（fixed，onclick=openPage('setting')）
├── .app                       App Shell
│   ├── .sidebar (aside)       桌面侧边栏
│   │   ├── .brand
│   │   └── #sideNav (nav)      9 × button[data-page]（内联无 onclick，由 openPage 统一绑定 active）
│   └── main.content (main)    主内容区
│       ├── #page-home         首页（静态骨架 + #dashCrystal/#dashAura/#dashBag/#dashPassive/#dashTrail/#dashInsight/#todayVol/#todayNum/#todayFill/#todayPercent/#continueCard/#continueTxt）
│       ├── #page-bag          行囊（#bagSelectBtn/#bagContainer/#bagEmpty/#selectionBar/#selCount）
│       ├── #page-passiveSkill 被动功法（#passiveContainer/#passiveEmpty）
│       ├── #page-dailyLesson  每日十课（#dailyTagBar/#dailyShelfContainer/#dailyEmpty）
│       ├── #page-trail        行迹（#trailTotal/#trailSummary/#trailSearchInput/#trailTagBar/#trailContainer/#trailEmpty）
│       ├── #page-failRecord   走火入魔录（#failContainer/#failEmpty）
│       ├── #page-insight      悟道札记（#insightContainer/#insightEmpty）
│       ├── #page-shop         万宝阁（#shopCrystal/#shopAura/#shopContainer/#shopEmpty）
│       └── #page-setting      设置（版本/同步/数据管理 + 高级设置 details：Firebase/Supabase/Notion/重置）
├── #mobileNav.mobile-nav      全局组件 · 移动端底部导航（9 × button[data-page]）
├── #globalMask.modal-mask     全局组件 · 通用弹窗（#modalHead/#modalBody/#modalFooter）
├── #toastWrap                 全局组件 · Toast 容器
└── #updateBanner              全局组件 · 版本更新横幅（fixed，默认 display:none）
```

页面切换机制：`openPage(p)` → `getElementById('page-'+p)` + `.active` 类切换；导航高亮：`querySelectorAll("#sideNav button,.mobile-nav button")`。

## 4. DOM Architecture

| 类型 | 区域 |
|---|---|
| **A. App Shell** | `#syncBar`、`.app`、`.sidebar`、`main.content` |
| **B. 页面级容器** | 9 个 `div.page`（home/bag/passiveSkill/dailyLesson/trail/failRecord/insight/shop/setting） |
| **C. 全局组件** | `#mobileNav`、`#globalMask`（modal）、`#toastWrap`、`#updateBanner` |
| **D. 页面内部组件** | 任务卡（.task-row/.todo-btn）、书架（.shelf/.book）、标签（.tag-chip）、行囊物品（.item-slot）、商品卡（.shop-card）、列表卡（.li-card）等——全部由 JS 渲染进动态容器 |
| **E. 纯 JS 动态容器** | `#bagContainer`、`#passiveContainer`、`#dailyShelfContainer`、`#trailContainer`、`#failContainer`、`#insightContainer`、`#shopContainer`（renderXxx() 用 innerHTML 填充） |

## 5. Page / Component Mapping

| DOM 区域 | 类型 | 当前职责 | JS 依赖程度 | 是否可拆 | 风险 |
|---|---|---|---|---|---|
| 首页 #page-home | 页面容器 | Dashboard 数据展示 + 导航入口 | 高（8 个 id 直读 + 内联 onclick） | 否 | 高（renderHome 依赖） |
| 每日十课 #page-dailyLesson | 页面容器 | 书架渲染 + 标签过滤 | 高（2 id + renderDailyTagBar/renderScrollOpen） | 否 | 高 |
| 行迹 #page-trail | 页面容器 | 完成记录列表 + 搜索/排序/标签筛选 | 高（6 id + renderTrail） | 否 | 高 |
| 行囊 #page-bag | 页面容器 | 物品 CRUD + 多选删除 | 高（4 id + renderBag） | 否 | 高 |
| 万宝阁 #page-shop | 页面容器 | 商品 CRUD + 购买 + 吸收 + 流水 | 高（3 id + renderShop） | 否 | 高 |
| 被动功法 #page-passiveSkill | 页面容器 | 功法 CRUD | 高（renderPassive） | 否 | 高 |
| 走火入魔录 #page-failRecord | 页面容器 | 失败记录 CRUD | 高（renderFail） | 否 | 高 |
| 悟道札记 #page-insight | 页面容器 | 悟道 CRUD | 高（renderInsight） | 否 | 高 |
| 设置 #page-setting | 页面容器 | 版本/同步/数据管理/云配置 | 极高（~20 id：fb/supabase/notion/版本） | 否 | 极高 |
| 全局 Modal | 全局组件 | 所有新增/编辑/确认共用（showModal 注入 head/body/footer） | 极高（3 id + showModal/showConfirm） | 否 | 极高 |
| Toast #toastWrap | 全局组件 | 轻提示 | 中（toast() 注入） | 否 | 中 |
| 导航（sideNav/mobileNav） | 全局组件 | 页面切换 + active 高亮 | 高（组合选择器 + data-page） | 否 | 中 |

## 6. JS DOM Dependency Audit

- **getElementById**：约 95 个唯一 id 被直接引用（含 `getElementById('page-'+p)` 动态页面切换）
- **querySelectorAll**：`#sideNav button,.mobile-nav button`（导航高亮）、`.trail-sort .sort-btn`、`.tag-chip`、`.page`
- **querySelector**：`.task-list`、`.shop-op`、`.book-open`（动态内容）
- **动态模板**：`innerHTML` ×31、`insertAdjacentHTML` ×16、`createElement` ×16（div/a/input/canvas）
- **内联事件**：页面内按钮几乎全部使用 `onclick="openXxx()"` 直呼全局函数
- **219 个顶层函数**；初始化顺序：initDefaultData → migrateAllData → normalizeDaily → migrateAutoScroll → renderHome → fbInit → initCloud（内联脚本位于 body 尾部，假定解析时 DOM 已完整）
- **典型依赖链**：`#dailyShelfContainer` ← renderDailyTagBar/renderScrollOpen/每日卷构建；`#trailContainer` ← renderTrail/setTrailSort/setTrailTagFilter；`#modalBody/#modalFooter` ← showModal/showConfirm；`#bagContainer` ← renderBag/toggleBagSelectMode

结论：**DOM ID → JS 使用位置映射完整建立**（见上），任一页面级区域被移出（如 fetch 部分加载）都会导致渲染函数在容器存在前执行 → `null` 引用风险，且违反本阶段禁止引入动态加载架构的约束。

## 7. Changes

本阶段**未做 HTML 结构拆分**（判定不安全，见 §9），仅实施指令 §十四 允许的安全改善：

1. 结构分区注释：`App Shell`、`页面容器（9 页）`、`全局组件` 三个区域标记
2. 语义 aria-label：`#sideNav`（桌面主导航）、`main.content`（主内容区）、`#mobileNav`（移动端底部导航）

均为**纯增量**（注释 + 属性添加），DOM 层级、id、class、data-*、事件绑定零变化。

## 8. Files Changed

| 文件 | 变更 |
|---|---|
| `index.html` | +3 结构注释、+3 aria-label（纯增量，约 6 行） |
| `.ai/reports/phase-1b-report.md` | 本报告 |
| `.ai/CURRENT_PHASE.md` / `.ai/AI_STATE.md` / `.ai/CHANGELOG.md` | 状态同步 |

未修改：JS、CSS、数据结构、localStorage、sw.js、manifest.json、version.txt。

## 9. Why These Structures Were / Were Not Extracted

**未拆分（正确决策，非失败）**。理由（依据指令 §十 判据）：

- **JS 强直接 DOM 依赖**：约 95 个 id 直读 + 组合选择器 + 内联 onclick
- **初始化顺序强依赖**：内联脚本在 body 尾部同步执行，假定 DOM 已完整；部分加载会使容器异步就绪
- **页面切换依赖**：`getElementById('page-'+p)` 动态切换 9 页
- **Modal 依赖**：全局单例 #globalMask + 3 子 id，showModal 注入
- **动态模板依赖**：31 处 innerHTML / 16 处 insertAdjacentHTML
- **无构建系统**：项目无 package.json / 构建器；引入 fetch→innerHTML 部分加载即新增"HTML 动态加载架构"（指令 §九 禁止）

结论：

```
Phase 1-B Audit: PASS
Minimal Extraction: Limited（本阶段仅注释 + aria-label）
Reason: Current JS has strong direct DOM dependencies.
Aggressive extraction would introduce unnecessary risk.
Recommendation: Proceed to a controlled JS architecture audit
(Phase 2 Storage/Store 数据层拆分及其后的 JS 模块化）before further HTML extraction.
```

## 10. Desktop Test（1440 × 900）

**PASS — 8/8**（真实浏览器）

首页渲染（侧边栏 flex、今日修行卡、长期资产、修行入口）→ 每日十课（书架展开、10 任务行）→ 待修行完成任务（done + 晶核+1 + 行迹+1 + 完成推送）→ 弹窗（520px 视口内完整）→ 刷新持久化 → 7 页导航全部正常。Console 0 错误、Network 0 失败、无横向溢出。

## 11. Mobile Test（390 × 844）

**PASS — 10/10**（真实浏览器）

底部导航显示（9 项）、无横向溢出（390==390）、弹窗 358px 未超屏、页面滚动正常（scrollY=300）、每日十课/完成任务/刷新持久化/7 页导航全部通过。Console 0 错误、Network 0 失败。

## 12. Console

**PASS**：三轮测试（桌面/移动/PWA）0 错误、0 未处理异常、0 非 CDN 失败请求。CDN（gstatic/jsdelivr）偶发抖动为环境既有问题（Phase 1-A 已复测确认），本次未出现。

## 13. Functional Regression

**PASS**

- 每日十课 → 任务显示 → 点击"待修行" → 任务完成 → 页面状态正常
- 行迹：完成记录存在（trail=1）
- 晶核：完成任务 → 晶核 +1（0→1）
- 导航：首页/每日十课/行迹/行囊/更多（7 页）均可正常进入
- 弹窗新增任务流程正常

## 14. Persistence

**PASS**：完成任务 → 刷新 → 任务存在、完成状态保留、晶核/行迹保留（crystal=1, trail=1, doneCount=1, 卷轴=1）。测试使用独立 profile（fresh userDataDir），未触碰任何真实用户数据；未执行 localStorage.clear()。

## 15. PWA Regression

**PASS — 6/6**

- SW 注册并 activated（xiantu-v7）
- 3 个 CSS 网络加载 200；SW 运行时缓存包含全部 3 个 css 文件
- 刷新后正常；manifest.json / sw.js / version.txt 零改动
- 本次 HTML 改动（注释/aria-label）不影响 PWA 任何环节

## 16. Known Risks

| 风险 | 说明 | 状态 |
|---|---|---|
| 页面容器与 JS 耦合 | 9 页全部被渲染函数直接引用 | 记录，Phase 2+ 处理 |
| Modal 单例全局耦合 | 3 个 id 被所有表单/确认复用 | 记录 |
| 内联事件依赖 | onclick 遍布页面按钮 | 记录，后续 JS 模块化时收敛 |
| CDN 偶发失败 | 环境既有 | 复测确认，非本阶段 |

## 17. Future Refactoring Candidates

（仅规划，未实施）

- **Phase 2（Storage/Store）**：先解耦 localStorage 读写（saveXxx/getXxx 已封装，可先行抽取）
- **JS 模块化前置**：在进一步 HTML 拆分前，建议先做受控的 JS 架构审计（函数分组、事件委托化），使 DOM 依赖可追踪后再拆 HTML
- **导航组件化**：sideNav/mobileNav 已共用 data-page 协议，未来可收敛为同一渲染源
- **Modal 模板化**：表单模板与 showModal 解耦后可考虑组件化
- **语义化增强**：.page 可逐步过渡为 <section>，前提是 querySelector('.page') 依赖先收敛

## 18. Result

**PASS**

```
Implementation: PASS（审计 + 注释 + aria-label）
Testing: PASS
Browser Verification: PASS（桌面 8/8 + 移动 10/10 + PWA 6/6，真实浏览器）
Regression: PASS
Report: PASS
Git Commit: （待提交 refactor: phase-1b html structure audit）
Git Push: （待执行）
Remote Verification: （待执行）
```

> 按 Remote Completion Rule（v1.1）：最终状态以 Commit + Push + Remote Verification 全链路 PASS 为准。
