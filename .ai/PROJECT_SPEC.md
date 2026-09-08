# 仙途行囊 V2 · 项目规格（PROJECT_SPEC）

> 本文档是仙途行囊 V2 开发的最高业务规格。一切开发行为必须以此为准。
> 本文档不包含实现细节，只定义目标、边界与禁止事项。

## 1. 唯一功能母仓库

原始 GitHub 仓库 `137950zqz-crypto/xiantu` 是仙途行囊 V2 的**唯一功能母仓库**。
所有后续开发必须在原仓库基础上进行。

```
Original Repository
        ↓
Incremental Refactoring
        ↓
V2
```

而不是：

```
Original Repository
        ↓
Rewrite
        ↓
New V2
```

## 2. 核心原则

- 渐进式重构，不推倒重来
- 原仓库是资产，不是废品
- 所有已经验证过的功能，默认保留
- 任何破坏旧功能的重构，一律视为失败
- 开发节奏固定为：审计 → 小步修改 → 测试 → 浏览器验证 → 报告 → 人工验收 → 下一阶段

## 3. 禁止事项（硬性）

- ❌ 一次性重写整个项目
- ❌ 创建另一个独立 V2 项目作为主线
- ❌ 删除已有功能
- ❌ 为了重构随意改变业务数据结构
- ❌ 清空 localStorage / 用户数据
- ❌ 使用 mock 冒充真实功能
- ❌ 未测试就提交
- ❌ 自动进入下一 Phase
- ❌ AI 自己宣布验收通过
- ❌ 自动 merge 到 main
- ❌ 自动 push 到 main
- ❌ 自动修改用户数据
- ❌ 与当前 Phase 无关的代码修改

## 4. Phase 顺序（固定，不可跳越、不可倒序）

| Phase | 内容 |
|---|---|
| Phase 0 | 仓库保护与基线（已完成） |
| Phase 1 | CSS / UI 基础层拆分 |
| Phase 2 | Storage / Store 数据层拆分 |
| Phase 3 | Task / TaskInstance / Scroll 重构 |
| Phase 4 | 每日十课 / 自动卷 / 封卷 |
| Phase 5 | Completion / Trail 行迹 |
| Phase 6 | TaskChain / 标签继承 |
| Phase 7 | 晶核 / 灵气 / ResourceLedger |
| Phase 8 | 行囊 / 万宝阁 / 功法 / 失败 / 悟道 |
| Phase 9 | 云同步 / 数据迁移 / 备份恢复 |
| Phase 10 | PWA / 更新 / 全面验收 |

每个 Phase 开始前必须获得人工批准；每个 Phase 完成后必须生成报告并等待验收。
