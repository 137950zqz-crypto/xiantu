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

## 2026-09-08 · AI Pipeline v1.1（远程完成闭环固化）

- GitHub Push is now mandatory for task completion.
- Remote HEAD verification is mandatory.
- Local completion does not equal task completion.
- Phase advancement remains manually approved.
- Main merge/push remains disabled.
- 更新文件：`.ai/DEVELOPMENT_RULES.md`（新增规则 8）、`.ai/CURRENT_PHASE.md`、`.ai/AI_STATE.md`、新增 `.ai/reports/pipeline-v1.1-remote-completion.md`
- 业务代码未修改；用户数据未修改；Phase 1 未启动
