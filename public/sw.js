// service worker بسيط — موجود عشان المتصفح يسمح بتنصيب التطبيق (PWA)
// مفيش كاش هنا: البث والبيانات بتعيش لوحدها
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
