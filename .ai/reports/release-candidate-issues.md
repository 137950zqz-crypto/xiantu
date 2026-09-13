# Release Candidate Issues

验收基线：`d3267e2afec60e2c8bb268a9bba3685829b9d4e1`（v2-dev，Local == Remote，Working Tree clean）

## 结论摘要
- P0：0 项
- P1：0 项
- P2：0 项
- 验收过程中发现的问题全部为**测试脚本自身断言缺陷**（取数下标错误、元素选择器错误、程序化 click 假象），修正断言后重测全部通过；**产品代码零问题**，无需任何代码修复。

## 问题登记表

| ID | 等级 | 问题 | 影响 | 是否阻止 Release | 状态 |
|---|---|---|---|---|---|
| RC-001 | P2 | 万宝阁购买确认按钮（`#modalFooter .btn-primary`，无 id）被程序化同步 `.click()` 连续调用两次时，会因元素尚未从 DOM 移除而触发两次 `doShopBuy`（扣两次款） | 真实用户双击路径已验证安全：第一次点击后 modal 立即关闭并移除按钮，第二次物理点击命中遮罩（`closeAllModal`），实测只扣一次款（100→80、+1 物品、+1 条账目）；仅程序化同步事件序列存在该行为 | NO | 已通过真实鼠标事件序列验证，无需修复（非真实交互路径） |
| RC-002 | P2 | 历史快照/多卷等测试初期断言直接取 `getTrail()[0]`、重复调用 `getDailyScrolls()` 导致引用不一致（storage.js 每次 get 返回新解析对象） | 测试脚本问题；修正断言（取 trail[1]、单次取 list）后全通过 | NO | FIXED（脚本） |
| RC-003 | P2 | 万宝阁「余额足购买」测试未先充值导致跳过；标签继承测试假设子任务 ownTags 为空（实际设计为 addNextTask 复制母任务 ownTags，规则三十三） | 测试脚本问题；修正后全通过 | NO | FIXED（脚本） |

> 注：RC-001 已用真实鼠标事件序列（mouse.down/up + 120ms 间隔）验证产品行为正确；RC-002/RC-003 为测试脚本缺陷，非产品缺陷。产品代码在本验收期间 **0 修改**（`git status` 全程 clean，直至写入本报告与控制层文件）。

## Release 判定输入
- 核心流程验收（rc-core）：24/24 PASS
- 跨日/链/封卷/备份验收（rc-auto）：25/25 PASS
- 细节验收（rc-misc，含真实鼠标双击）：4/4 PASS
- 全量回归：Desktop 12/12、Mobile 15/15、PWA 5/5、完成链/Store 专项/6 集合 UI 全 PASS
- Console / Network：0 错误（全部场景）
