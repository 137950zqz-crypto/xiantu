/* ================= 仙途行囊 V2 · core/dates.js（Phase 1-D 试点迁移） =================
 * 原位置：index.html 工具区（pad/fmtDate/fmtTime/fmtDateTime/getTodayStr/yesterdayStr/
 *        __DATE_OVERRIDE/fmtShortDate/fmtScrollNo）
 * 职责：日期/时间工具（纯函数 + 测试钩子 __DATE_OVERRIDE）
 * 兼容策略：保持全局函数名 window.*，调用方零修改；模块内依赖（fmtDateTime→fmtDate+fmtTime、
 *        fmtScrollNo→fmtShortDate、getTodayStr/yesterdayStr→__DATE_OVERRIDE）同模块内闭环
 * __DATE_OVERRIDE：保留既有测试钩子语义；优先继承注入值（window.__DATE_OVERRIDE || ""），
 *       无注入时默认空串 → 行为与迁移前完全一致
 * 加载顺序：必须在主业务 inline <script> 之前加载
 */
function pad(n){return String(n).padStart(2,'0')}
function fmtDate(d){return d.getFullYear()+"·"+pad(d.getMonth()+1)+"·"+pad(d.getDate())}
function fmtTime(d){return pad(d.getHours())+":"+pad(d.getMinutes())}
function fmtDateTime(d){return fmtDate(d)+" "+fmtTime(d)}
/* 严格「昨天」（规则22：禁止跨多天追溯顺延；仅用于测试时通过 __DATE_OVERRIDE 覆盖） */
var __DATE_OVERRIDE = window.__DATE_OVERRIDE || "";
function getTodayStr(){if(__DATE_OVERRIDE)return __DATE_OVERRIDE;const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function yesterdayStr(){
  const d=new Date();
  if(__DATE_OVERRIDE){const p=__DATE_OVERRIDE.split("-");d.setFullYear(+p[0],+p[1]-1,+p[2])}
  d.setDate(d.getDate()-1);
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
}
/* 卷轴编号展示：2026-09-02 → "9.2" */
function fmtShortDate(date){const p=String(date||"").split("-");if(p.length<3)return date||"";return Number(p[1])+"."+Number(p[2])}
function fmtScrollNo(date,no){return fmtShortDate(date)+" 卷"+no}
window.pad=pad;window.fmtDate=fmtDate;window.fmtTime=fmtTime;window.fmtDateTime=fmtDateTime;
window.__DATE_OVERRIDE=__DATE_OVERRIDE;window.getTodayStr=getTodayStr;window.yesterdayStr=yesterdayStr;
window.fmtShortDate=fmtShortDate;window.fmtScrollNo=fmtScrollNo;
