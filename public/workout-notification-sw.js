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
  const shouldRestoreActiveWorkout = event.notification.tag === "active-workout";
  const notificationTitle = event.notification.title;

  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      async (windowClients) => {
        const existingClient = windowClients.find(
          (client) => client.url === destination,
        );

        const targetClient = existingClient
          ? await existingClient.focus()
          : await self.clients.openWindow(destination);

        if (!shouldRestoreActiveWorkout) return;

        await new Promise((resolve) => setTimeout(resolve, 300));
        await self.registration.showNotification("Workout active · LiftLog", {
          body: "Tap to return and finish your workout.",
          icon: "/pwa-192x192.png",
          badge: "/notification-badge.svg",
          tag: "active-workout",
          requireInteraction: true,
          renotify: false,
          silent: true,
          data: { path: "/active-workout" },
        });

        targetClient?.postMessage({
          type: "workout-notification-clicked",
          notificationTitle,
        });
      },
    ),
  );
});
