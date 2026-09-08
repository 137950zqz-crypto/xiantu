# AI Pipeline v1.1 Remote Completion Rule

> 归档日期：2026-09-08
> 状态：ENABLED（控制层已固化；远程推送待凭证权限修复后执行）

## Purpose

确保所有 AI 开发成果最终进入 GitHub，并可被外部审计。

## Completion Chain

```
Implementation → Testing → Report → Commit → Push → Remote Verification → Completed
```

只有最后一步成功（`LOCAL HEAD == ORIGIN/<CURRENT_BRANCH> HEAD`）才允许将任务标记为 COMPLETED；否则 `TASK STATUS = INCOMPLETE`。

## Local Completion

NOT SUFFICIENT

本地完成（代码写完 / 已提交）不等于任务完成。未推送、未做远程验证，一律视为未完成。

## Remote Verification

REQUIRED

每次 Push 后必须执行：

```
git fetch origin
git status
git log --oneline -5
git rev-parse HEAD
git rev-parse origin/$(git branch --show-current)
```

确认 `Local HEAD == Remote HEAD` 且 `Working Tree == CLEAN`；不一致则 STOP，任务不得结束。

## Main Branch Auto Push

DISABLED

禁止自动 push 到 main；merge 到 main 同样禁止。

## Automatic Phase Advancement

DISABLED

Phase 推进必须人工批准，AI 不得自行进入下一 Phase。

## 统一任务结束状态

每个 Phase / 子任务必须报告：

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

`Task Completed = YES` 仅当 `Git Commit = PASS AND Git Push = PASS AND Remote Verification = PASS`。
