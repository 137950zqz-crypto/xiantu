/* ================= 仙途行囊 V2 · core/store.js（Phase 2-A 试点） =================
 * 职责：数据状态访问边界（Store）。只做数据访问，不含业务逻辑 / UI / 云同步逻辑。
 * 边界（严格）：
 *   - Store → Storage Adapter（storage.js）→ localStorage → 原有 cloud hook（fbAutoUpload/cloudQueueSync 仍由 storage.js 负责）
 *   - 禁止直接访问 localStorage / sessionStorage
 *   - 禁止业务判断（自动卷/封卷/完成/奖励/晶核/任务链/标签继承/商店购买等）
 *   - 禁止 DOM / toast / modal / render / 事件
 *   - 禁止云同步调用（Firebase/Supabase/Notion）
 * 旧 API（getXxx/saveXxx）保持存在、可调用、行为不变——渐进迁移，不全局替换。
 * 加载顺序：ids.js → dates.js → storage.js → store.js → 主业务 JS（store 必须在使用前加载）。
 * 本阶段实际迁移的真实调用路径（仅 2 条纯读取，其余调用点不动）：
 *   renderDailyShelf() → XiantuStore.dailyScrolls.get() → getDailyScrolls()
 *   renderTrail()      → XiantuStore.trail.get()       → getTrail()
 */
window.XiantuStore = {
  /* 每日十课卷轴集（xiantu_daily_scroll） */
  dailyScrolls: {
    get() { return getDailyScrolls(); },
    save(data) { return saveDailyScrolls(data); }
  },
  /* 行迹（永久完成记录，xiantu_trail） */
  trail: {
    get() { return getTrail(); },
    save(data) { return saveTrail(data); }
  },
  /* 物品行囊（xiantu_bag_data，Phase 2-B 试点：纯 CRUD 写路径） */
  bag: {
    get() { return getBagData(); },
    save(data) { return saveBag(data); }
  },
  /* 被动功法（xiantu_passive，Phase 2-B 试点：纯 CRUD 写路径） */
  passive: {
    get() { return getPassive(); },
    save(data) { return savePassive(data); }
  }
};
