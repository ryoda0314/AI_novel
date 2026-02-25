// AI小説広場 Service Worker
const CACHE_NAME = "ai-novel-v1";
const STATIC_CACHE = "ai-novel-static-v1";
const DYNAMIC_CACHE = "ai-novel-dynamic-v1";

// プリキャッシュするリソース
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/icon.svg",
  "/manifest.webmanifest",
];

// キャッシュするパターン
const CACHEABLE_PATTERNS = [
  /\/_next\/static\/.*/,  // Next.js 静的アセット
  /\.(?:js|css|woff2?|ttf|otf)$/,  // フォント・スタイル
];

// API リクエストのキャッシュ対象
const API_CACHE_PATTERNS = [
  /\/api\/novels\?/,      // 小説一覧
  /\/api\/ranking/,        // ランキング
  /\/api\/contests$/,      // コンテスト一覧
];

// インストール
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// アクティベーション（古いキャッシュを削除）
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// フェッチ
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのみ
  if (url.origin !== location.origin) return;

  // POST リクエストはキャッシュしない
  if (request.method !== "GET") return;

  // API リクエスト: Network First + キャッシュ
  if (url.pathname.startsWith("/api/")) {
    const shouldCache = API_CACHE_PATTERNS.some((p) => p.test(url.pathname + url.search));
    if (shouldCache) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // 静的アセット: Cache First
  if (CACHEABLE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ページナビゲーション: Network First + オフラインフォールバック
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request).catch(() => {
        return caches.match("/offline") || new Response("オフラインです", {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })
    );
    return;
  }
});

// Cache First 戦略
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 408 });
  }
}

// Network First 戦略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("No network and no cache");
  }
}
