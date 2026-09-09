/* ================= 仙途行囊 V2 · core/storage.js（Phase 1-E 试点迁移） =================
 * 原位置：index.html 存储区（STORAGE_KEY_* 业务 key 常量 + 数据层 getXxx/saveXxx）
 * 职责：持久化边界（读取/解析/写入/序列化 + 触发既有云同步钩子），不含业务逻辑
 * 兼容策略（Phase 1-E 核心原则：移动"实现位置"，不改变"行为"）：
 *   - 函数体与迁移前逐字符一致；JSON.stringify/JSON.parse/默认值/异常处理/写入时机逐字保留
 *   - 云同步钩子原样保留：saveXxx() → localStorage.setItem → fbAutoUpload(模块) → cloudQueueSync()
 *     （saveRewards 迁移前即无云钩子，逐字保留；不合并/不新建抽象）
 *   - window 显式暴露全部函数，调用方零修改；const 常量位于全局词法作用域，后续脚本可直接引用
 *   - 加载顺序：必须在主业务 inline <script> 之前加载（位于 ids.js / dates.js 之后）
 * 未迁移（保留于 index.html）：addLedger（账本记录创建，Domain 职责）、hasReward/addReward（领域查询/写入）、
 *   云端配置 key（NOTION/FB/CLOUD_CFG/CLOUD_META）、备份 key（BACKUP）、迁移/备份/恢复/导入/导出/重置逻辑
 */
/* —— 业务数据 key 常量（与迁移前逐字符一致；云端配置 key 与备份 key 保留于 index.html） —— */
const STORAGE_KEY_BAG="xiantu_bag_data", STORAGE_KEY_PASSIVE="xiantu_passive",
      STORAGE_KEY_DAILY="xiantu_daily_scroll", STORAGE_KEY_FAIL="xiantu_fail",
      STORAGE_KEY_INSIGHT="xiantu_insight",
      STORAGE_KEY_CRYSTAL="xiantu_crystal", STORAGE_KEY_AURA="xiantu_aura", STORAGE_KEY_SHOP="xiantu_shop_items", STORAGE_KEY_LEDGER="xiantu_ledger",
      STORAGE_KEY_TRAIL="xiantu_trail",
      STORAGE_KEY_SCHEMA="xiantu_data_schema_version", STORAGE_KEY_REWARDS="xiantu_rewards";

/* ================= 数据层 ================= */
function getBagData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_BAG))||[]}catch(e){return []}}
function saveBag(a){localStorage.setItem(STORAGE_KEY_BAG,JSON.stringify(a));fbAutoUpload("bag");cloudQueueSync();}
function getPassive(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_PASSIVE))||[]}catch(e){return []}}
function savePassive(a){localStorage.setItem(STORAGE_KEY_PASSIVE,JSON.stringify(a));fbAutoUpload("passive");cloudQueueSync();}
function getDailyScrolls(){try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY_DAILY))||[];if(d.length>1){const order=new Map(d.map((s,i)=>[s,i]));d.sort((a,b)=>{if(a.date!==b.date)return a.date<b.date?1:-1;return order.get(a)-order.get(b)});}return d}catch(e){return []}}
function saveDailyScrolls(a){localStorage.setItem(STORAGE_KEY_DAILY,JSON.stringify(a));fbAutoUpload("daily");cloudQueueSync();}
function getFail(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_FAIL))||[]}catch(e){return []}}
function saveFail(a){localStorage.setItem(STORAGE_KEY_FAIL,JSON.stringify(a));fbAutoUpload("fail");cloudQueueSync();}
function getInsight(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_INSIGHT))||[]}catch(e){return []}}
function saveInsight(a){localStorage.setItem(STORAGE_KEY_INSIGHT,JSON.stringify(a));fbAutoUpload("insight");cloudQueueSync();}
/* 行迹（永久完成记录） */
function getTrail(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_TRAIL))||[]}catch(e){return []}}
function saveTrail(a){localStorage.setItem(STORAGE_KEY_TRAIL,JSON.stringify(a));fbAutoUpload("trail");cloudQueueSync();}
/* 晶核 / 灵气 / 万宝阁 */
function getCrystal(){const v=parseInt(localStorage.getItem(STORAGE_KEY_CRYSTAL),10);return isNaN(v)?0:v}
function setCrystal(n){n=Math.max(0,Math.floor(n||0));localStorage.setItem(STORAGE_KEY_CRYSTAL,String(n));fbAutoUpload("crystal");cloudQueueSync();}
function getAura(){const v=parseInt(localStorage.getItem(STORAGE_KEY_AURA),10);return isNaN(v)?0:v}
function setAura(n){n=Math.max(0,Math.floor(n||0));localStorage.setItem(STORAGE_KEY_AURA,String(n));fbAutoUpload("aura");cloudQueueSync();}
function getShopItems(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_SHOP))||[]}catch(e){return []}}
function saveShopItems(a){localStorage.setItem(STORAGE_KEY_SHOP,JSON.stringify(a));fbAutoUpload("shop");cloudQueueSync();}
function getLedger(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_LEDGER))||[]}catch(e){return []}}
/* 数据 schema 版本（纯读写 Adapter；迁移/备份/校验逻辑仍在 index.html） */
function getSchemaVersion(){try{return parseInt(localStorage.getItem(STORAGE_KEY_SCHEMA),10)||0}catch(e){return 0}}
function setSchemaVersion(v){localStorage.setItem(STORAGE_KEY_SCHEMA,String(v))}
/* 奖励账（迁移前即无云钩子，逐字保留） */
function getRewards(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY_REWARDS))||[]}catch(e){return []}}
function saveRewards(a){localStorage.setItem(STORAGE_KEY_REWARDS,JSON.stringify(a))}
/* —— 全局可见性（调用方零修改；与迁移前 window 全局等价） —— */
window.getBagData=getBagData;window.saveBag=saveBag;window.getPassive=getPassive;window.savePassive=savePassive;
window.getDailyScrolls=getDailyScrolls;window.saveDailyScrolls=saveDailyScrolls;window.getFail=getFail;window.saveFail=saveFail;
window.getInsight=getInsight;window.saveInsight=saveInsight;window.getTrail=getTrail;window.saveTrail=saveTrail;
window.getCrystal=getCrystal;window.setCrystal=setCrystal;window.getAura=getAura;window.setAura=setAura;
window.getShopItems=getShopItems;window.saveShopItems=saveShopItems;window.getLedger=getLedger;
window.getSchemaVersion=getSchemaVersion;window.setSchemaVersion=setSchemaVersion;
window.getRewards=getRewards;window.saveRewards=saveRewards;
