self.addEventListener("push", (event) => {
  const payload = event.data?.json();

  if (!payload?.title) return;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pwa-192x192.png",
      badge: "/notification-badge.svg",
      tag: payload.tag ?? "active-workout",
      requireInteraction: true,
      renotify: true,
      vibrate: [250, 150, 250],
      data: payload.data ?? { path: "/active-workout" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const path = event.notification.data?.path ?? "/active-workout";
  const destination = new URL(path, self.location.origin).href;

  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windowClients) => {
        const existingClient = windowClients.find(
          (client) => client.url === destination,
        );

        if (existingClient) {
          return existingClient.focus();
        }

        return self.clients.openWindow(destination);
      },
    ),
  );
});
