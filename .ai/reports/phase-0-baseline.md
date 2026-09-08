# 仙途行囊 V2 · Phase 0 基线报告

**归档日期**：2026-09-08（UTC+8）
**阶段**：Phase 0 — 仓库保护与 V2 分支
**基线仓库**：`137950zqz-crypto/xiantu`
**本地路径**：`/Users/Zhuanz/Doubao/chats/2026-09-07/new-chat-1/xiantu`
**原则**：只保护、只审计、只验证。未修改任何业务代码。
**归档位置**：`.ai/reports/phase-0-baseline.md`（本文件）

---

## 1. Git

| 项目 | 值 |
|---|---|
| BASE_COMMIT | `678c95a9bf9001f7c7719be6ef4a491ded2ca217`（`678c95a fix(taskchain): 阶段二修复-同日Auto Scroll错误承接`） |
| v1-baseline | `678c95a`（已建立，指向原版 HEAD） |
| v2-dev | `678c95a`（已建立，从原版 HEAD 创建） |
| working tree | **clean**（无未提交修改） |
| 当前分支 | `v2-dev` |
| remote | `origin = https://github.com/137950zqz-crypto/xiantu.git`（正确） |
| 本地 vs 远程 | 本地 `main` 领先 `origin/main` **4 个提交**（已提交未推送，属既有状态，未作任何处理） |
| 回滚验证 | `git diff v1-baseline..v2-dev` → **空输出，业务代码零修改** |

> 说明：仓库目录外另发现两个相关目录 —— `2026-09-08/new-chat/xiantu-v2`（无 remote 的本地实验副本，含 v2 提交）与 `2026-09-02/new-chat-3/xiantu`（同一 remote 的旧 checkout）。两者均未改动，不影响基线。

---

## 2. 项目结构

单页应用结构（HTML/CSS/JS 全部内联于 index.html）：

```
xiantu/
├── index.html         # 入口 + 主 HTML + 全部 CSS + 全部 JS（182KB，3036 行）
├── manifest.json      # PWA manifest（name=仙途行囊，display=standalone，3 个图标）
├── sw.js              # Service Worker v7（缓存名 xiantu-v7）
├── version.txt        # 20260907-11（版本检测源）
├── README.md          # 项目说明
├── favicon.ico
└── icons/
    ├── favicon-32.png
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable-512.png
```

**重点识别**：
- 入口文件：`index.html`（单文件全量应用，无外部 JS/CSS 文件）
- 主 HTML/JS/CSS：均内联于 `index.html`（`<style>` 在 16 行起；主脚本 565 行起；SW 注册 3026 行）
- PWA：`manifest.json` + `sw.js`（网络优先 HTML/version.txt，缓存优先静态资源；SW 明确不触碰 localStorage 业务数据）+ 版本检测系统（APP_VERSION / version.txt / SKIP_WAITING 更新链路）
- 第三方依赖（CDN 引入）：Firebase 10.12.0（app/auth/firestore-compat）、Supabase JS v2；均仅用于可选的云同步
- 无 package.json、无构建工具、无测试框架

---

## 3. 数据系统

| 项目 | 值 |
|---|---|
| Storage | **localStorage 为主**（75 处引用）；sessionStorage 6 处（仅版本更新防循环）；**无 IndexedDB** |
| 数据 schema | `xiantu_data_schema_version` = 4（v4：Task 永久身份 + originalRecord/currentRecord + TaskChain + CompletionRecord） |

**主要数据 Key（localStorage）**：

| Key | 内容 |
|---|---|
| `xiantu_daily_scroll` | 每日十课·卷轴（含任务/链/标签/顺延） |
| `xiantu_trail` | 行迹（永久完成记录） |
| `xiantu_crystal` / `xiantu_aura` | 晶核 / 灵气 |
| `xiantu_bag_data` | 行囊物品 |
| `xiantu_shop_items` | 万宝阁商品 |
| `xiantu_passive` / `xiantu_fail` / `xiantu_insight` | 被动功法 / 走火入魔录 / 悟道札记 |
| `xiantu_ledger` / `xiantu_rewards` | 晶核流水 / 奖励账本 |
| `xiantu_backup_v4` | 迁移前自动备份快照 |
| `xiantu_firebase_config` / `xiantu_cloud_config_v1` / `xiantu_notion_config` | 云同步配置 |
| `xiantu_cloud_meta_v1` / `xiantu_cloud_dirty_v1` / `xiantu_fb_sync_on` | 云同步状态 |

**数据入口**：启动时 `initDefaultData()`（缺失才播种默认数据）→ `migrateAllData()`（备份→迁移→校验→失败回滚）→ `normalizeDaily()`（幂等补全）→ `migrateAutoScroll()`（每日自动卷）
**数据写入口**：`saveBag / savePassive / saveDailyScrolls / saveFail / saveInsight / saveTrail / saveShopItems / setCrystal / setAura`（统一写 localStorage + 触发云同步队列）
**备份**：`backupAllData()` → `xiantu_backup_v4`（迁移前快照）；`exportAllData()` / `exportSingle()` → JSON 文件
**恢复**：`restoreBackup()`（迁移失败回滚）；`importAllData()`（JSON 导入）
**同步**：三套可选云同步并存 —— Firebase（fbUploadAll/fbPullAll/fbAutoUpload）、Supabase（cloudSyncNow/cloudQueueSync）、Notion（uploadAllToNotion/pullFromNotion）；未配置时本地运行不受影响

---

## 4. 当前功能

测试方法：真实浏览器（本机 Chrome 引擎，headless 隔离 profile）加载原版 `http://localhost:8080/`，真实 DOM 操作 + 断言；桌面 1440×900 与移动 390×844 各一套；顺延/封卷使用应用自带 `__DATE_OVERRIDE` 测试钩子（代码内明确注明"仅用于测试"）。

| 模块 | 功能 | 当前状态 | 问题 |
|---|---|---|---|
| 每日十课 | 今日自动卷生成、展开查看、10 格任务槽 | 正常 | 无 |
| 今日任务 | 首页今日统计（卷数/完成数/百分比） | 正常 | 无 |
| 待修行/完成/未完成 | 任务状态标记与展示 | 正常 | 无 |
| 多卷 | 书架多卷展示（自动+手动） | 正常 | 无 |
| 自动卷 | 每日自动卷（type=auto + sourceDate 承接） | 正常 | 无 |
| 顺延 | 昨日未完成任务次日承接（taskId 复用、origNo 保留、已完成不承接、超 10 拆卷） | 正常 | 无 |
| 任务·新增/编辑/删除 | 编辑弹窗增删改（改名/备注/标签） | 正常 | 无 |
| 标签 | 任务自有标签、常用标签、输入回车新建 | 正常 | 无 |
| 标签继承 | 父任务标签沿任务链继承（inheritedTags） | 正常 | 无 |
| 任务链 | 设为 ◇首、＋后续任务、多分支（branchId/nodeNumber） | 正常 | 无 |
| 书架·查看/排序 | 时间倒序书架、封卷状态标识 | 正常 | 无 |
| 卷状态·封卷/解封 | 过去卷自动封卷、封卷拦截完成、解封/重新封印（二次确认） | 正常 | 无 |
| 行迹·完成记录 | 完成即永久写入 CompletionRecord | 正常 | 无 |
| 行迹·历史记录/搜索/筛选 | 历史列表、关键词搜索、标签筛选、三种排序 | 正常 | 无 |
| 晶核 | 完成任务 +1、购买消耗、吸收转化 | 正常 | 无 |
| 灵气 | 吸收晶核 1:100 转化 | 正常 | 无 |
| 行囊·物品/数量/使用/编辑/删除 | 物品列表、数量增减、编辑、删除 | 正常 | 无 |
| 万宝阁·商品/购买 | 商品列表、卡片购买 | 正常 | 无 |
| 万宝阁·余额不足 | 晶核不足拦截提示 | 正常 | 无 |
| 万宝阁·重复点击 | 余额不足时二次购买被拦截 | 正常 | 无 |
| 被动功法 | 查看/新增/编辑/删除 | 正常 | 无 |
| 走火入魔录 | 查看/新增/删除 | 正常 | 无 |
| 悟道札记 | 查看/新增/删除 | 正常 | 无 |
| PWA·manifest | manifest.json 正常加载（200，3 图标） | 正常 | 无 |
| PWA·Service Worker | SW v7 注册成功 | 正常 | 无 |
| PWA·离线能力 | 断网刷新仍可加载（SW 缓存兜底） | 正常 | 无 |
| PWA·安装能力 | display=standalone + 图标齐备 | 正常 | 无 |

**实测结果：桌面 21/21 通过，移动 11/11 通过。**

---

## 5. Console

| 项 | 结果 |
|---|---|
| Errors | **0** |
| Warnings | **0** |
| Unhandled Promise | **0** |
| Page Errors（JS 异常） | **0** |

> 备注：首次加载偶发 1 次 `Failed to load resource: net::ERR_CONNECTION_CLOSED`（未捕获到具体 URL，疑为外部 CDN 瞬时连接中断），后续全部运行（桌面 2 轮 + 移动 1 轮）均未复现，网络层 Failed = 0。仅记录，不处理。

---

## 6. Resource

| 项 | 结果 |
|---|---|
| Failed | **0** |
| 404 | **0** |
| 500 | **0** |
| 其他（blocked/CORS） | **0** |

（含 index.html、manifest.json、version.txt、icons、Firebase/Supabase CDN、SW 请求全量监控）

---

## 7. 数据持久化

真实操作 + 刷新验证（无 mock）：

| 操作 | 刷新后 | 结果 |
|---|---|---|
| 创建任务「测试任务A改」→ 刷新 | 任务仍存在 | **正常** |
| 完成任务「测试任务A改」→ 刷新 | 完成状态（done）仍保留 | **正常** |
| 完成 2 课获得晶核→ 购买消耗 + 吸收转化 → 刷新 | 晶核=0、灵气=100 精确保留 | **正常** |
| 行迹 2 条 → 刷新 | 记录仍在 | **正常** |
| 顺延任务承接至次日卷 → 刷新 | 仍在 9.9 卷 | **正常** |
| 行囊/万宝阁新增项 → 刷新 | 数据仍在 | **正常** |

---

## 8. Desktop 1440 × 900

**通过**：首页/导航/展开/弹窗/输入/滚动/全部模块 CRUD 正常；截图确认布局渲染正确（侧边导航 + 主面板 + 底部入口）。

## 9. Mobile 390 × 844

**通过**：首页加载、底部导航 8 页逐页切换、卷轴展开、触摸滚动、弹窗输入均正常；截图确认响应式布局正确。

---

## 10. 审计发现（只记录，不修复）

1. **代码结构**：全部业务代码（约 3000 行 HTML/CSS/JS）内联于单一 `index.html`，无模块化拆分 —— V2 拆分阶段的主要工作量所在。
2. **云同步三套并存**：Firebase + Supabase + Notion 三套可选同步共存于同一文件，代码路径交叉（`saveXxx` 统一触发），维护成本高；未配置时不影响本地功能。
3. **远程同步**：本地 `main` 领先 `origin/main` 4 个提交，未推送（既有状态）。
4. **测试钩子**：`__DATE_OVERRIDE`、`__versionCheck` 等全局测试钩子保留在生产代码中（用途明确，风险低）。
5. **default 数据**：`initDefaultData` 中"喷香氛"功法标记为 `mastered:true`，属既有默认数据内容，非缺陷。
6. **CDN 依赖**：Firebase/Supabase SDK 依赖外网 CDN，断网时仅影响云同步功能，本地核心功能离线可用（已实测）。

---

## 11. 完成条件核对

| 条件 | 状态 |
|---|---|
| 原仓库状态已确认 | ☑ |
| BASE_COMMIT 已记录 | ☑ `678c95a` |
| v1-baseline 已建立 | ☑ |
| v2-dev 已建立 | ☑ |
| 未修改原业务代码 | ☑（diff 为空） |
| 原版可以启动 | ☑（HTTP 200 + 完整渲染） |
| 核心功能完成基线测试 | ☑（桌面 21/21） |
| 数据刷新后仍存在 | ☑ |
| Desktop 测试完成 | ☑ 通过 |
| Mobile 测试完成 | ☑ 通过 |
| Console 已检查 | ☑ 0 错误 |
| Resource 已检查 | ☑ 0 失败 |
| 回滚点已确认 | ☑ v1-baseline 可回滚 |
| Git working tree clean | ☑ |
| Phase 0 基线报告完成 | ☑ 本报告 |

---

## 12. 最终 Git 状态

```
Branch: v2-dev
Working tree: clean

v1-baseline（678c95a）── 原版稳定状态
        ↓
v2-dev（678c95a）── 从原版开始 V2 渐进式重构
```

**Phase 0 完成。等待下一步指令（Phase 1 — CSS / UI 基础层拆分）。**
