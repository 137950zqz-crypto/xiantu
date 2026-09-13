# Store Access Policy（仙途行囊 V2 · Phase 2-E）

简短访问规范。普通业务代码访问**已纳入 Store 的数据集合**时，优先经 `XiantuStore`；高风险区域保持原路径。

## 访问规范

```
普通业务代码
    ↓ 优先
XiantuStore.xxx.get() / XiantuStore.xxx.save()
    ↓
Storage Adapter（storage.js：getXxx / saveXxx）
    ↓
localStorage + 原有 cloud hooks（fbAutoUpload / cloudQueueSync）
```

- **Store**：只调用 Storage Adapter，做数据访问边界。禁止 localStorage/sessionStorage 直访、禁止 DOM/render/toast/modal、禁止业务判断、禁止云同步调用。
- **Storage**：负责持久化 + 已有 cloud hooks。cloud hook 不得被 Store 绕过或复制。
- **旧 API 保留**：`getXxx() / saveXxx()` 继续存在、可调用、行为不变（渐进迁移，不全局替换）。
- **逐调用点迁移**：每个调用点单独判断；安全才迁移，不改变业务行为。

## 已纳入 Store 的集合（6）

| 集合 | key | Store API |
|---|---|---|
| dailyScrolls | xiantu_daily_scroll | get / save |
| trail | xiantu_trail | get / save |
| bag | xiantu_bag_data | get / save |
| passive | xiantu_passive | get / save |
| fail | xiantu_fail | get / save |
| insight | xiantu_insight | get / save |

## 高风险区域（Phase 2 当前不通过 Store 统一，保持原路径）

completion、reward、ledger、crystal、aura、TaskChain、Auto Scroll、sealing（封卷/解封/重新封印）、migration、backup、restore、import/export、reset、cloud configuration、cloud sync、商店购买（doShopBuy）。

> 这些区域即使包含读取，也不得包装成 Store 操作或迁移访问入口（例如：doCompleteTask / addCompletion / addReward / addLedger / setCrystal / setAura / unlockScroll / resealScroll / doShopBuy / applyModuleData / cloudSnapshot / exportAllData / importAllData 等）。

## 渐进迁移原则

1. 旧 API 保留
2. 新代码优先 Store
3. 逐调用点迁移，不全局替换
4. 不改变业务行为 / 数据结构 / key / cloud hook / PWA
5. Store 不增加业务方法（禁止 completeTask / reward / addCrystal / createAutoScroll / seal / purchase 等）
