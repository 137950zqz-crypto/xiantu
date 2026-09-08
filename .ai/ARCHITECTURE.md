# 架构说明（ARCHITECTURE）

> 本文档描述仙途行囊 V2 的当前架构（Phase 0 审计结果）与 V2 目标架构方向（规划，未实施）。

## 一、当前架构（Phase 0 审计结果）

### 1. 总览

单页应用（SPA）。全部 HTML / CSS / JavaScript 内联于单一 `index.html`（约 3036 行 / 182KB）。
无构建工具、无模块系统、无 package.json、无测试框架。

### 2. 文件结构

```
xiantu/
├── index.html          # 入口 + 主 HTML + 全部 CSS + 全部 JS（内联）
├── manifest.json       # PWA manifest（display=standalone，3 图标）
├── sw.js               # Service Worker v7（缓存名 xiantu-v7）
├── version.txt         # 20260907-11（版本检测源）
├── README.md           # 项目说明
├── favicon.ico
└── icons/              # PWA 图标（192 / 512 / maskable-512 / favicon-32）
```

### 3. 运行时引导顺序（index.html 内联脚本）

```
initDefaultData()   → 缺失 key 播种默认数据（不覆盖已有数据）
migrateAllData()    → schema 迁移：备份 → 迁移 → 校验 → 失败回滚
normalizeDaily()    → 幂等补全新模型字段与 10 格不变量
migrateAutoScroll() → 每日自动卷（严格昨日继承 + 过期重建；不动手动卷）
renderHome()        → 首页渲染
fbInit()            → Firebase 云同步初始化（可选）
initCloud()         → Supabase 云同步初始化（可选）
load 事件           → Service Worker 注册（sw.js?v7）
```

### 4. 数据模型（schema v4）

- **Task**：永久任务身份（taskId 创建后不变）
- **originalRecord / currentRecord**：任务最初创建位置 / 当前真实位置
- **chain**：任务链 `{rootTaskId, parentTaskId, branchId, nodeNumber, isRoot}`
- **CompletionRecord**：行迹（completionId + originalTaskPosition + completedAt + completionSequence）
- 兼容策略：新字段与旧字段（id/chainId/chainOrder/parentId/isRoot/origNo/tags）**双写同步**，旧版本与云端数据不破坏

### 5. 存储

- **localStorage**：全部业务数据（`xiantu_` 前缀，约 20 个 key，见 Phase 0 报告 §3）
- **sessionStorage**：仅版本更新防循环（`xiantu_updated_to` / `xiantu_update_attempt`）
- **无 IndexedDB**
- 写入口统一封装：`saveBag / savePassive / saveDailyScrolls / saveFail / saveInsight / saveTrail / saveShopItems / setCrystal / setAura`（写 localStorage + 触发云同步队列）

### 6. PWA 与版本更新

- `manifest.json`：display=standalone，支持安装
- `sw.js` v7：HTML / version.txt 网络优先，静态资源缓存优先；activate 只清理 SW 静态缓存，绝不触碰 localStorage 业务数据
- 版本检测链路：APP_VERSION（20260907-11）↔ version.txt → SKIP_WAITING → controllerchange → 清理旧缓存 → reload（防循环）

### 7. 云同步（可选，三套并存）

Firebase（Auth + Firestore）、Supabase、Notion —— 均为可选配置；未配置时本地功能完全可用。

## 二、V2 目标架构方向（规划，未实施）

| 阶段 | 层 | 目标 |
|---|---|---|
| Phase 1 | CSS / UI 基础层 | 从 index.html 拆分样式与页面骨架 |
| Phase 2 | Storage / Store 数据层 | 封装 localStorage 读写、迁移、备份恢复 |
| Phase 3-8 | 领域模型 | Task / TaskInstance / Scroll / 每日十课 / Trail / TaskChain / Resource / 行囊等独立模块 |
| Phase 9 | 同步与数据 | 云同步、数据迁移、备份恢复独立化 |
| Phase 10 | PWA / 验收 | SW 更新链路独立化 + 全面验收 |

> **重要**：目标架构仅为规划文档，不构成已实施行为。实际拆分必须按 Phase 顺序、经人工批准后逐步进行；每步都必须保持既有功能可运行。
