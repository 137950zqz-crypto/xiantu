# 变更日志（CHANGELOG）

格式：`日期 · 内容`。记录每个 Phase 的关键动作与结果。

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

## 2026-09-08 · AI Pipeline v1.1（远程完成闭环固化）

- GitHub Push is now mandatory for task completion.
- Remote HEAD verification is mandatory.
- Local completion does not equal task completion.
- Phase advancement remains manually approved.
- Main merge/push remains disabled.
- 更新文件：`.ai/DEVELOPMENT_RULES.md`（新增规则 8）、`.ai/CURRENT_PHASE.md`、`.ai/AI_STATE.md`、新增 `.ai/reports/pipeline-v1.1-remote-completion.md`
- 业务代码未修改；用户数据未修改；Phase 1 未启动
