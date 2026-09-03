/* 仙途行囊 Service Worker
 * 版本 v4：核心页面离线缓存 + CDN 网络优先回退缓存（v4 书架统一时间倒序 / 卷轴可重新封印）
 */
const CACHE = 'xiantu-v4';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

/* 安装：预缓存核心资源 */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

/* 激活：清理旧缓存 */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* 请求拦截 */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;

  // 同源资源：HTML 页面网络优先（保证每次打开拿到最新内容），静态资源缓存优先（离线可用）
  if (url.origin === self.location.origin) {
    const isDoc = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
    if (isDoc) {
      e.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => caches.match(req))
      );
      return;
    }
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // 跨域 CDN（firebase / supabase 等）：网络优先，失败回退缓存
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
