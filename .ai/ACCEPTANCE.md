# 验收标准（ACCEPTANCE）

## Phase 0 验收清单（已完成，全部 ☑）

- [x] 原仓库状态已确认
- [x] BASE_COMMIT 已记录（`678c95a`）
- [x] v1-baseline 已建立
- [x] v2-dev 已建立
- [x] 未修改原业务代码（`git diff v1-baseline..v2-dev` 为空）
- [x] 原版可以启动（HTTP 200 + 完整渲染）
- [x] 核心功能完成基线测试（桌面 21/21、移动 11/11）
- [x] 数据刷新后仍存在（任务 / 完成状态 / 资源）
- [x] Desktop 测试完成（1440×900 通过）
- [x] Mobile 测试完成（390×844 通过）
- [x] Console 已检查（0 错误）
- [x] Resource 已检查（0 失败）
- [x] 回滚点已确认（v1-baseline）
- [x] Git working tree clean
- [x] Phase 0 基线报告完成并归档（`.ai/reports/phase-0-baseline.md`）

## 通用 Phase 验收要求（每个 Phase 完成后必须满足）

- [ ] 目标范围内的功能可用（真实执行验证，非推测）
- [ ] 旧功能回归通过
- [ ] 浏览器测试通过（Desktop 1440×900 / Mobile 390×844）
- [ ] Console 无新增错误
- [ ] Network / Resource 无新增失败
- [ ] 数据持久化验证通过
- [ ] 未修改与当前 Phase 无关的业务代码
- [ ] Git commit 存在且可回滚
- [ ] 报告已生成至 `.ai/reports/phase-X-report.md`（统一格式）

## 验收权限

- AI 可以执行测试并如实报告结果
- **验收通过 / 进入下一 Phase 必须由项目负责人人工确认**
- AI 不得自行宣布最终验收通过
- 报告内容必须全部为真实执行结果；禁止"应该可以"写成"已通过"
