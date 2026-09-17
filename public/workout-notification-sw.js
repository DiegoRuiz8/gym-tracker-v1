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
