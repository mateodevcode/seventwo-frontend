// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || "/icon-72x72.png",
    badge: data.badge || "/badge.png",
    vibrate: [100, 50, 100],
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const focused = windows.find((win) => win.focused);
        const visible = windows.find(
          (win) => win.visibilityState === "visible"
        );

        if (focused) {
          focused.navigate(urlToOpen);
          focused.focus();
        } else if (visible) {
          visible.navigate(urlToOpen);
          visible.focus();
        } else {
          clients.openWindow(urlToOpen);
        }
      })
  );
});
