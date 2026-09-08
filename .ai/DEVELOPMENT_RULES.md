# AI 开发规则（DEVELOPMENT_RULES）

以下规则为硬性约束。AI 在仙途行囊 V2 的任何开发行为都必须遵守。

## 规则 1：增量重构

每个 Phase 只能解决当前 Phase 的目标，不得顺手修改无关内容。

## 规则 2：保留旧功能

任何重构都必须进行回归测试。旧功能回归失败 = 重构失败。

## 规则 3：不允许大爆炸式修改

如果一个 Phase 需要修改大量无关文件，必须**停止并报告**，不得强行推进。

## 规则 4：不允许删除用户数据

禁止 `localStorage.clear()` 以及任何等价的数据清除行为（如直接删除业务 key、重置用户记录等）。

## 规则 5：不允许伪造测试

如果没有自动化测试，必须如实标注：

```
Automated Tests: NOT IMPLEMENTED
```

不得写 `Tests Passed`。测试结果必须来自真实执行。

## 规则 6：必须 Git 可回滚

- 每个 Phase 开始前必须存在 Git 基线（tag 或 commit）
- 每个 Phase 完成后必须产生 Git commit
- 每个 Phase 的 commit 应可独立回滚
- 发现与当前 Phase 无关的意外修改：立即停止，报告，等待人工处理，不得自行 reset / clean / 恢复

## 规则 7：人工批准闸门

AI 不得自行从 `PASSED` 进入下一 Phase。
必须等待项目负责人明确批准。

```
PASSED → WAITING_FOR_APPROVAL → 人工批准 → 下一 Phase
```

## 规则 8：远程完成条件（Remote Completion Rule，v1.1）

以后任何 AI 开发任务都必须满足完整闭环：

```
Implementation
    ↓
Testing
    ↓
Report
    ↓
Git Commit
    ↓
Git Push
    ↓
Remote Verification
    ↓
COMPLETED
```

- **只有最后一步成功**（`LOCAL HEAD == ORIGIN/<CURRENT_BRANCH> HEAD`），才允许将任务标记为 `COMPLETED`
- 否则：`TASK STATUS = INCOMPLETE`

### 强制远程验证（每次 Push 后必须执行）

```
git fetch origin
git status
git log --oneline -5
git rev-parse HEAD
git rev-parse origin/$(git branch --show-current)
```

确认：`Local HEAD == Remote HEAD` 且 `Working Tree == CLEAN`。
如果不一致：**STOP**，任务不得结束。

### 禁止"假完成"

以下情况均不得报告任务完成（全部属于 `TASK INCOMPLETE`）：

- 代码已经写完，但没有 commit
- 已经 commit，但没有 push
- push 命令执行了，但没有验证远程
- 本地 HEAD 与远程 HEAD 不一致
- GitHub 上没有对应最新 commit

### 统一任务结束状态

每一个 Phase / 子任务都必须有：

```
Implementation: PASS / FAIL
Testing: PASS / FAIL / NOT IMPLEMENTED
Browser Verification: PASS / FAIL / NOT APPLICABLE
Regression: PASS / FAIL / NOT IMPLEMENTED
Report: PASS / FAIL
Git Commit: PASS / FAIL
Git Push: PASS / FAIL
Remote Verification: PASS / FAIL
```

最终只有 `Git Commit = PASS AND Git Push = PASS AND Remote Verification = PASS`，才能 `Task Completed = YES`。
