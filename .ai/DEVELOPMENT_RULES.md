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
