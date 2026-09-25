function isAppleMobileDevice() {
  return (
    /iPhone|iPad|iPod/.test(self.navigator.userAgent) ||
    (self.navigator.platform === "MacIntel" &&
      self.navigator.maxTouchPoints > 1)
  );
}

async function showWorkoutNotification(title, options) {
  if (isAppleMobileDevice()) {
    const notifications = await self.registration.getNotifications();
    notifications
      .filter((notification) => notification.tag === options.tag)
      .forEach((notification) => notification.close());
  }

  await self.registration.showNotification(title, options);
}

function getNotificationCopy(language) {
  if (language === "es") {
    return {
      activeTitle: "Entrenamiento activo · LiftLog",
      activeBody: "Toca para volver y terminar tu entrenamiento.",
    };
  }

  return {
    activeTitle: "Workout active · LiftLog",
    activeBody: "Tap to return and finish your workout.",
  };
}

self.addEventListener("push", (event) => {
  const payload = event.data?.json();

  if (!payload?.title) return;

  event.waitUntil(
    showWorkoutNotification(payload.title, {
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
  const notificationData = event.notification.data ?? {};
  const path = notificationData.path ?? "/active-workout";
  const destination = new URL(path, self.location.origin).href;
  const shouldRestoreActiveWorkout = event.notification.tag === "active-workout";
  const language = notificationData.language === "es" ? "es" : "en";
  const notificationType = notificationData.notificationType;

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
        const copy = getNotificationCopy(language);
        await showWorkoutNotification(copy.activeTitle, {
          body: copy.activeBody,
          icon: "/pwa-192x192.png",
          badge: "/notification-badge.svg",
          tag: "active-workout",
          requireInteraction: true,
          renotify: false,
          silent: true,
          data: {
            path: "/active-workout",
            language,
            notificationType: "workout-active",
          },
        });

        targetClient?.postMessage({
          type: "workout-notification-clicked",
          notificationType,
        });
      },
    ),
  );
});
