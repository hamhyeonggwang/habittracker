// OTD 최소 서비스워커 — 오프라인 셸 캐싱.
// 정책: 동일 출처 GET만 처리, 네트워크 우선(최신 우선) + 실패 시 캐시 폴백.
// Supabase/Google 등 외부 요청과 비-GET은 건드리지 않는다(인증·데이터 staleness 방지).
const CACHE = 'otd-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) =>
          cached || (req.mode === 'navigation' ? caches.match('/') : Response.error())
        )
      )
  );
});
