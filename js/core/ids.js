/* ================= 仙途行囊 V2 · core/ids.js（Phase 1-D 试点迁移） =================
 * 原位置：index.html 工具区（uid）
 * 职责：唯一 ID 生成（纯函数，无 DOM / localStorage / 业务状态 / 事件依赖）
 * 兼容策略：保持全局函数名 window.uid，调用方零修改（Phase 1-D 目标：调用方不动，实现外移）
 * 加载顺序：必须在主业务 inline <script> 之前加载
 */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
window.uid = uid;
