# Phase 1-A Report

> 日期：2026-09-08
> 子任务：Phase 1-A · CSS / UI 当前结构审计 + 基础 CSS 拆分

## 1. Objective

将集中在 `index.html` 内联 `<style>` 中的 CSS 进行第一次安全拆分，建立 `css/base.css`、`css/layout.css`、`css/components.css` 三文件结构。**视觉行为 1:1 保持，不优化、不改 UI、不动 JS。**

## 2. Baseline

| 项 | 值 |
|---|---|
| Branch | `v2-dev` |
| HEAD | `bf3e2ce0467980fe000c22c9341deeebc5f82e62`（chore: enforce remote completion workflow） |
| Working Tree | CLEAN |
| Remote | `origin` → `github.com/137950zqz-crypto/xiantu.git` |

## 3. CSS Audit

- `index.html`：3036 行 / 约 182KB，全部 HTML/CSS/JS 内联
- 内联 `<style>` 块：第 16–294 行，共 278 行 CSS
- 结构：`:root` 变量 → reset/基础元素（button/input/textarea/select/label）→ 按钮/图标 → 布局（.app/.sidebar/.content/.sync-bar/.mobile-nav/.hd）→ 网格与页面容器（.asset-grid/.menu-grid/.page/.page-head/.top-op）→ 组件（卡片/书架/任务/行迹/行囊/设置/Toast/弹窗/标签）→ 2 个媒体查询（桌面 min-width:900px / 手机 max-width:899px）→ 万宝阁组件
- 内联 `style="..."` 属性：65 处，全部为 JS 动态控制（空态 display:none、进度条 width、边距微调等），**保留**（业务结构与动态样式，非静态 CSS）
- 页面级专用 CSS：审计确认无独立页面样式段（所有页面共享同一套组件类），**不创建 `css/pages/`**（避免机械空目录）
- 级联依赖：原文件布局规则位于组件规则之前；媒体查询位于全部组件规则之后 → 拆分采用**原顺序区间切割**，保证级联 1:1

## 4. Files Changed

| 文件 | 变更 |
|---|---|
| `css/base.css` | 新增（1421B）：变量 / reset / 基础元素 / 排版 / 表单 |
| `css/layout.css` | 新增（2973B）：布局 / 同步条 / 导航 / 网格 / 页面容器 / 响应式 |
| `css/components.css` | 新增（19887B）：按钮 / 卡片 / 书架 / 任务 / 行迹 / 行囊 / 设置 / Toast / 弹窗 / 万宝阁 |
| `index.html` | `<style>` 块替换为 3 个 `<link rel="stylesheet">`（base → layout → components 顺序） |
| `.ai/reports/phase-1a-report.md` | 本报告 |
| `.ai/CURRENT_PHASE.md` / `.ai/AI_STATE.md` / `.ai/CHANGELOG.md` | 状态同步 |

未修改：`sw.js`、`manifest.json`、`version.txt`、任何 JS、任何数据结构。

## 5. CSS Split Result

- 加载顺序：`base.css → layout.css → components.css`（与原文件内顺序一致）
- 手机端媒体查询（max-width:899px）因同时含布局（.sidebar）与组件（.task-main/.todo-btn）规则，拆为两个完整媒体查询块，分别置于 layout.css 与 components.css（括号配对校验 OK）
- 规则总数：基线 242 → 拆分 243（**+1 为媒体查询由 1 块拆为 2 块的合法计数变化**；规则文本逐条 diff 确认仅此一处差异，无规则丢失/重复/增改）
- 拆分后 `grep -n "<style" index.html`：无输出（主体 CSS 不再内嵌）
- 无残留大块内联 CSS；65 处 JS 动态 inline style 保留（见 §3）

## 6. Functional Changes

**No intentional business logic changes.**

- JavaScript 零修改；HTML 仅替换 `<style>` 为 3 个 `<link>`
- 数据结构 / localStorage / PWA / 云同步均未触碰

## 7. Desktop Test（1440 × 900）

**PASS — 8/8**

- 基线（内联 CSS）vs 拆分（外链 CSS）布局测量对比：**242 个选择器 × 全部计算属性与 getBoundingClientRect 逐项对比，0 差异**（含颜色/字体/间距/圆角/尺寸/定位/弹性布局）
- 首页渲染（侧边栏 flex 显示、今日修行卡、长期资产、修行入口）
- 每日十课（书架展开、10 个任务行）
- 待修行 → 任务完成（done 状态 + 晶核 +1 + 行迹 +1 + 完成推送）
- 弹窗（新增任务弹窗 520px 宽，视口内完整显示，输入框可用）
- 刷新后状态持久化
- 7 个页面导航全部正常
- 无横向溢出

## 8. Mobile Test（390 × 844）

**PASS — 10/10**

- 基线 vs 拆分测量对比：0 差异
- 底部导航显示（9 项）、无横向溢出（scrollWidth 390 == clientWidth 390）
- 弹窗 358px 宽 ≤ 390px 视口，未超出屏幕
- 页面滚动正常（scrollY=300）
- 每日十课 / 完成任务 / 刷新持久化 / 7 页面导航全部通过

## 9. Console

**PASS**

- 拆分版：0 错误、0 未处理异常、0 失败资源（桌面 + 移动 + PWA 三轮测试）
- 说明：测试期间观察到 gstatic/jsdelivr CDN 偶发瞬时加载失败（云同步可选脚本），经复测**基线版本同样出现**（且两轮失败源不同），判定为网络抖动而非本阶段引入，不计入新增错误

## 10. Persistence

**PASS**

- 完成任务 → 刷新页面 → 任务存在、完成状态保留、晶核/行迹计数保留（crystal=1, trail=1, doneCount=1, 卷轴数=1）
- 未使用 mock；数据为应用真实 localStorage 流程

## 11. PWA Regression

**PASS — 6/6**

- SW 正常注册并 activated（`xiantu-v7`）
- 3 个 CSS 文件网络加载 200
- **SW 运行时缓存已自动包含全部 3 个 css 文件**（既有"缓存优先 + 运行时缓存"策略天然覆盖新 css/*.css；首次在线加载后离线可用）
- 刷新后页面正常；Console/Network 0 错误
- 结论：无需修改 PWA；`manifest.json` / `sw.js` / `version.txt` 零改动

## 12. Existing Feature Regression

**PASS**

- 每日十课 → 看到任务 → 点击"待修行" → 任务完成 → 页面状态正常
- 任务新增弹窗（含输入）正常
- 行迹 / 行囊 / 万宝阁 / 被动功法 / 走火入魔录 / 悟道札记 / 设置 7 页导航正常
- 完成推送（◇ 修行完成）正常
- 桌面侧边栏 / 移动底部导航按媒体查询正确切换

## 13. Known Issues

| 问题 | 分类 | 处理 |
|---|---|---|
| CDN（gstatic/jsdelivr）偶发瞬时加载失败 | 既有环境问题，非本阶段引入 | 记录；云同步为可选功能，失败自动降级 |
| 65 处 JS 动态 inline style 保留在 HTML | 既有结构（动态样式），非静态 CSS | 保留；后续 Phase 可评估收敛为 CSS 类 |
| 规则计数 242→243（媒体查询拆分） | 预期计数变化，非缺陷 | 已逐条 diff 验证 |

## 14. Future Improvements

（仅记录，本阶段不实施）

- `css/pages/` 暂不需要；若后续出现页面级样式可再评估
- 部分重复出现的颜色值可考虑提炼变量（如 `#4b331c`、`#fff1dc`、`#d4bc9c`）
- `display:-webkit-box` 行数截断（li-sum/shop-desc）可后续统一为工具类
- 动画/过渡时间可统一为变量
- inline style 动态样式可逐步收敛

## 15. Result

**PASS**

```
Implementation: PASS
Testing: PASS
Browser Verification: PASS（真实浏览器，桌面 8/8 + 移动 10/10 + PWA 6/6）
Regression: PASS
Report: PASS
Git Commit: （待提交 refactor: phase-1a split css foundation）
Git Push: （待执行）
Remote Verification: （待执行）
```

> 按 Remote Completion Rule（v1.1）：本任务最终状态以 Git Commit + Git Push + Remote Verification 全链路 PASS 为准。
