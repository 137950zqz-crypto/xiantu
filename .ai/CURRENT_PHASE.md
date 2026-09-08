# 当前 Phase 状态（CURRENT_PHASE）

## Phase 状态机

正常推进：

```
NOT_STARTED
    ↓
IN_PROGRESS
    ↓
TESTING
    ↓
REVIEW
    ↓
PASSED
    ↓
WAITING_FOR_APPROVAL
    ↓ （人工批准）
下一 Phase IN_PROGRESS
```

失败回退：

```
TESTING
    ↓
FAILED
    ↓
FIXING
    ↓
TESTING
```

禁止：`PASSED → 自动进入下一 Phase`
必须：`PASSED → WAITING_FOR_APPROVAL → 人工批准 → 下一 Phase`

## 当前状态

| 项 | 值 |
|---|---|
| Phase 0 | **COMPLETED**（PASSED，报告已归档） |
| Phase 1 | **WAITING_FOR_APPROVAL**（禁止启动，等待人工批准） |
| 自动阶段推进 | DISABLED |
| 人工批准 | REQUIRED |

## Phase 进入条件（任何 Phase 开始前必须同时满足）

1. Previous Phase = PASSED
2. Previous Report = Archived
3. Git Baseline = Exists
4. Working Tree = Clean
5. Human Approval = YES

任一条件不满足 → **STOP**，并报告原因。

## 更新规则

- 每个 Phase 状态变更时更新本文件
- 状态变更必须与 `.ai/AI_STATE.md`、`.ai/CHANGELOG.md` 保持一致

## 远程完成条件（Remote Completion Rule，v1.1）

任何 Phase / 子任务都必须满足：

```
Implementation → Testing → Report → Git Commit → Git Push → Remote Verification → Completed
```

- 本地完成 ≠ 任务完成
- 远程验证（`LOCAL HEAD == ORIGIN/<CURRENT_BRANCH> HEAD`）为**强制**步骤
- 只有 `Git Commit = PASS AND Git Push = PASS AND Remote Verification = PASS` 才允许标记 `Task Completed = YES`
- 否则：`TASK STATUS = INCOMPLETE`（禁止报告完成）
