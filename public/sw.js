const CACHE_NAME = "a-wee-adventure-v2-hasura";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/placeholder.svg",
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("❌ Failed to cache static assets:", error);
      }),
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log("🗑️ Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // For HTML pages, always try network first (cache second)
      if (event.request.headers.get("accept")?.includes("text/html")) {
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              return networkResponse;
            }
            return cachedResponse || networkResponse;
          })
          .catch(() => {
            return cachedResponse || new Response("Offline", { status: 503 });
          });
      }

      // For other resources, return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = response.clone();

          // Cache successful responses
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn("⚠️ Failed to cache response:", error);
            });

          return response;
        })
        .catch(() => {
          // Network failed, try to serve a fallback for HTML pages
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
          throw new Error("Network unavailable and no cache available");
        });
    }),
  );
});

// Background sync for when connectivity returns
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Sync any pending uploads, form submissions, etc.
      doBackgroundSync(),
    );
  }
});

async function doBackgroundSync() {
  try {
    console.log("🔄 Performing background sync...");
    // Add logic here to sync any pending data when connectivity returns
    // This could include uploading photos, syncing journal entries, etc.
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
}
