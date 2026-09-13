/* ================= 仙途行囊 V2 · core/store.js =================
 * 职责：数据状态访问边界（Store）。只做数据访问，不含业务逻辑 / UI / 云同步逻辑。
 * 当前已接入集合（渐进迁移，Phase 2-A / 2-B / 2-C）：
 *   dailyScrolls（每日十课卷轴集，xiantu_daily_scroll）
 *   trail       （行迹，xiantu_trail）
 *   bag         （物品行囊，xiantu_bag_data）
 *   passive     （被动功法，xiantu_passive）
 *   fail        （走火入魔录，xiantu_fail）
 *   insight     （悟道札记，xiantu_insight）
 * 边界（严格）：
 *   - Store → Storage Adapter（storage.js）→ localStorage → 原有 cloud hook（fbAutoUpload/cloudQueueSync 仍由 storage.js 负责）
 *   - 禁止直接访问 localStorage / sessionStorage
 *   - 禁止业务判断（自动卷/封卷/完成/奖励/晶核/灵气/任务链/标签继承/商店购买等）
 *   - 禁止 DOM / toast / modal / render / 事件
 *   - 禁止云同步调用（Firebase/Supabase/Notion）
 *   - 禁止资源业务逻辑（晶核/灵气/Ledger/Rewards 等不得进入 Store）
 * 旧 API（getXxx/saveXxx）保持存在、可调用、行为不变——渐进迁移，不全局替换。
 * 加载顺序：ids.js → dates.js → storage.js → store.js → 主业务 JS（store 必须在使用前加载）。
 * 已迁移真实调用路径（仅列选中的调用点，其余调用点保持旧 API）：
 *   Phase 2-A（读）：renderDailyShelf → dailyScrolls.get()；renderTrail → trail.get()
 *   Phase 2-B（写）：saveNewBagItem / confirmDelBag → bag.save()；saveAddPassive / confirmDelPassive → passive.save()
 *   Phase 2-C（写）：saveAddFail / confirmDelFail → fail.save()；saveAddInsight / confirmDelInsight → insight.save()
 *   Phase 2-D（读）：renderHome 4 项 dashboard 计数 → bag/passive/trail/insight.get()；
 *                    renderBag / renderPassive / renderFail / renderInsight 列表渲染 → 对应集合.get()
 *   Phase 2-E（读+写，统一安全访问规范）：CRUD 页面读（saveNewBagItem/openBagDetail/openBagEdit/saveEditBag/confirmDelBag、
 *                    saveAddPassive/openPassiveEdit/saveEditPassive/confirmDelPassive、saveAddFail/openFailDetail/openEditFail/
 *                    saveEditFail/confirmDelFail、saveAddInsight/openInsightDetail/openEditInsight/saveEditInsight/confirmDelInsight
 *                    → 对应集合.get()）；普通 CRUD 写（confirmDeleteBagSelected/saveEditBag/saveEditPassive/saveEditFail/
 *                    saveEditInsight → 对应集合.save()）；纯计算读（getDayScrollIndex/getScrollNoById/collectAllTags/
 *                    nextTrailOrder → dailyScrolls/trail.get()）
 * 访问规范：普通业务代码访问已纳入 Store 的数据集合时优先经 XiantuStore；旧 API（getXxx/saveXxx）全部保留。
 * 高风险区（completion/reward/ledger/crystal/aura/TaskChain/Auto Scroll/sealing/migration/backup/restore/import/export/
 * reset/cloud config/cloud sync/商店购买）不通过 Store，保持原路径。详见 .ai/store-access-policy.md。
 */
window.XiantuStore = {
  /* 每日十课卷轴集（xiantu_daily_scroll，Phase 2-A） */
  dailyScrolls: {
    get() { return getDailyScrolls(); },
    save(data) { return saveDailyScrolls(data); }
  },
  /* 行迹（永久完成记录，xiantu_trail，Phase 2-A） */
  trail: {
    get() { return getTrail(); },
    save(data) { return saveTrail(data); }
  },
  /* 物品行囊（xiantu_bag_data，Phase 2-B：纯 CRUD 写路径） */
  bag: {
    get() { return getBagData(); },
    save(data) { return saveBag(data); }
  },
  /* 被动功法（xiantu_passive，Phase 2-B：纯 CRUD 写路径） */
  passive: {
    get() { return getPassive(); },
    save(data) { return savePassive(data); }
  },
  /* 走火入魔录（xiantu_fail，Phase 2-C：纯 CRUD 写路径） */
  fail: {
    get() { return getFail(); },
    save(data) { return saveFail(data); }
  },
  /* 悟道札记（xiantu_insight，Phase 2-C：纯 CRUD 写路径） */
  insight: {
    get() { return getInsight(); },
    save(data) { return saveInsight(data); }
  }
};
