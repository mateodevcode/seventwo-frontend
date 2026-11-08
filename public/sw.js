// public/sw.js — service worker de Seventwo: notificaciones Web Push.
// El backend envía { title, body, url, tag } (src/lib/webpush.js del backend).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }
  const title = data.title || "Seventwo";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/badge.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [100, 50, 100],
    data: { url: data.url || "/area-cliente" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // La URL viaja en notification.data (antes se leía de event.data, que no existe aquí).
  const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const propia = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
      if (propia) {
        return propia.navigate(destino).then((v) => (v ?? propia).focus());
      }
      return self.clients.openWindow(destino);
    }),
  );
});
