# Release Candidate Report

## 1. Baseline
- Branch: v2-dev；HEAD: `d3267e2afec60e2c8bb268a9bba3685829b9d4e1`（refactor(store): standardize safe access paths，Phase 2-E）
- Local == origin/v2-dev；Working Tree clean（验收开始前实测）

## 2. Final Commit
- 验收期间产品代码 **0 修改**；本报告/问题清单/控制层状态为实际变更，提交为：
  - `chore(release): rc acceptance artifacts`（.ai 控制层 + 两份验收报告；无业务代码变更）

## 3. Release Candidate Result
**RELEASE CANDIDATE = PASS**

## 4. P0 Issues
- 0 项

## 5. P1 Issues
- 0 项

## 6. P2 Issues
- 0 项（RC-001 为程序化同步 click 的观察项，真实鼠标双击已验证安全；RC-002/RC-003 为测试脚本缺陷，已修正）

## 7. Core Function Test
- 启动/首次打开/刷新/重开：首页正常、8 导航入口、无白屏（rc-core 24/24 覆盖）
- 每日十课：10 槽位稳定；点击标题/标签/卡片/展开收起不触发完成；仅「待修行」触发
- 多卷：同日 3 卷共存、sequence=1/2/3、无覆盖无合并
- 行囊/被动功法/走火入魔录/悟道札记：增删持久化全通过（bag-passive-ui / fail-insight-ui / 全量回归）

## 8. Completion / Reward
- TaskInstance → completed ✓；CompletionRecord 创建（completionId/completedAt）✓；Crystal +1 ✓；ResourceLedger +1 ✓；TrailRecord +1 ✓
- 防重复（P0）：重复调用 doCompleteTask、刷新后、快速点击 ×5 → Crystal/Trail/Ledger 均不重复增加（rc-core + phase1d-chain dupClickSafe=true）
- 历史快照：完成「测试任务A(标签A)」后改当前任务为「测试任务B(标签B)」，行迹仍显示 A/A（originalTitle/tags 为完成时快照，不受后续修改影响）
- 资源：Crystal→Aura（1→100）正确，Ledger type=absorb 记录完整
- 万宝阁：余额足购买（-price/+物品/+账目）、余额不足不购买无负数无错误记录、真实鼠标双击只扣一次款（100→80、+1 物品、+1 账目）

## 9. TaskChain
- root→child→grandchild：rootTaskId/parentTaskId 链正确、branchId 同分支、nodeNumber 1→2 递增、root.isRoot=true、branches 结构稳定（rc-auto 实测）
- 标签继承：Own/Inherited/Effective 正确；inheritedTags=祖先 ownTags 并集（沿 parentTaskId 上溯）；子任务 ownTags 复制母任务（规则三十三，设计行为）；无反向继承（root.inheritedTags=[]）

## 10. Auto Scroll
- **跨日（P0）**：昨天 13 个未完成任务 → 今天 Auto01=10 + Auto02=3；13 个全部保留无丢失、无重复 Task 身份、原 TaskId 不变、无自动完成（rc-auto 实测，__DATE_OVERRIDE 注入 2026-09-12/13/14）
- **连续跨日**：Day3 仍 10+3、不无限复制、身份稳定无重复实例

## 11. Data Persistence
- 操作→刷新→关闭→重开：每日卷/Task/行囊/功法/失败录/悟道/行迹/资源全部一致（rc-core 刷新断言 + 全量回归 6 集合增删持久化 + PWA 刷新）

## 12. Backup / Restore
- backupAllData → 破坏性修改（清 bag、crystal=0）→ restoreBackup → 数据完整恢复；Task ID/Instance ID 不重新生成（sameId=true 实测）

## 13. Mobile
- 390×844：15/15 PASS；无横向溢出（sw=390, cw=390）、底部导航 flex 正常、9 导航入口、列表/卡片/按钮/弹窗/滚动正常

## 14. Desktop
- 1440×900：12/12 PASS；布局稳定、无异常空白、无按钮/弹窗错位、7 页导航全开

## 15. PWA
- 5/5 PASS：SW 注册 activated、css 三文件 200、刷新正常；manifest.json/sw.js/version.txt 零修改；xiantu_v2_* 用户数据不受影响（SW 更新场景由缓存策略保持）

## 16. Store Boundary
- js/core/store.js 越界扫描：仅头注释命中关键词，无 localStorage/sessionStorage/DOM/render/toast/modal/cloud/reward/ledger/completion/TaskChain/Auto Scroll/sealing/shop 代码
- store.js 仅 6 集合 `.get()/.save()` 薄委托；无业务方法（静态 grep + 运行期 XiantuStore 调用审计 48 处全为 get/save）

## 17. Schema Audit
- mkEmptyTask：taskId/title/completed/completeTime/delayDays/tags/ownTags/inheritedTags/note/chain{rootTaskId,parentTaskId,branchId,nodeNumber,isRoot}/parentId/chainId/chainOrder/isRoot/origNo/originalRecord/currentRecord/historyStatus —— 完整无异常新字段
- localStorage key（storage.js 12 个业务 key + 云相关 key）与 JSON shape 与 Phase 0 基线一致；无未经设计的新字段

## 18. Console
- 全部场景 0 页面错误（rc-core/rc-auto/rc-misc/全量回归/Store 专项/UI 专项：PAGE_ERRORS 全空）
- 无新增 ReferenceError/TypeError/SyntaxError/Uncaught

## 19. Network
- 全量回归 Network 0 失败；PWA 场景 css/js 全部 200

## 20. Regression
- Desktop 12/12、Mobile 15/15、PWA 5/5；完成链（+1/+1/+1、防重复、allTasksKeyed）；Store 2E 专项（编辑/详情/批量删除/纯计算/旧 API/持久化）；bag/passive/fail/insight UI 增删持久化；导航 7 页
- 性能基础：DOM ready ~2.6s（含 SW 注册/初始化）、页面切换 0–2ms，无卡顿/长空白/无限循环

## 21. Git Verification
- Commit：`d3267e2`（产品代码基线，未变）+ `chore(release): rc acceptance artifacts`（控制层）
- Push：PASS（见 Push 章节）
- Remote HEAD：与 Local 一致
- Tag：`v2.0.0-rc1`（已创建并推送）
- Working Tree：clean（Push/验证后实测）

## 22. Final Decision
**RELEASE CANDIDATE = PASS**

- P0 = 0，P1 = 0
- 核心流程、数据持久化、移动端、桌面端、PWA 全部 PASS
- 产品代码零修改（仅控制层/报告变更）
- 状态：READY FOR REAL-WORLD USE
- 下一阶段：**Real-world usage**（停止主动架构优化；以真实使用反馈驱动的小步迭代为主）
- 最终 PASS/FAIL 由 ChatGPT 独立读取 GitHub Remote Code / Commit / Tag / 报告后审核；本报告不自宣 v2.0.0 正式发布
