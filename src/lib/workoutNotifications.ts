const PREFERENCE_KEY = "gym-tracker-v1:workout-reminders-enabled";
const PREFERENCE_CHANGE_EVENT = "gym-tracker-v1:workout-reminders-changed";
const ACTIVE_WORKOUT_NOTIFICATION_TAG = "active-workout";

export type WorkoutReminderPermission =
  | "default"
  | "denied"
  | "granted"
  | "unsupported";

export type WorkoutReminderPreference = "enabled" | "disabled" | "unconfigured";

function supportsWorkoutNotifications(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

function dispatchPreferenceChange(): void {
  window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
}

async function closeActiveWorkoutNotification(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const notifications = await registration.getNotifications({
    tag: ACTIVE_WORKOUT_NOTIFICATION_TAG,
  });
  notifications.forEach((notification) => notification.close());
}

export function getWorkoutReminderPermission(): WorkoutReminderPermission {
  if (!supportsWorkoutNotifications()) return "unsupported";
  return Notification.permission;
}

export function getWorkoutReminderPreference(): boolean {
  return getWorkoutReminderPreferenceStatus() === "enabled";
}

export function getWorkoutReminderPreferenceStatus(): WorkoutReminderPreference {
  const preference = localStorage.getItem(PREFERENCE_KEY);

  if (preference === "true") return "enabled";
  if (preference === "false") return "disabled";
  return "unconfigured";
}

export async function enableWorkoutReminders(): Promise<WorkoutReminderPermission> {
  const currentPermission = getWorkoutReminderPermission();
  if (currentPermission === "unsupported") return currentPermission;

  const permission =
    currentPermission === "granted"
      ? currentPermission
      : await Notification.requestPermission();

  if (permission === "granted") {
    localStorage.setItem(PREFERENCE_KEY, "true");
    dispatchPreferenceChange();
  }

  return permission;
}

export async function disableWorkoutReminders(): Promise<void> {
  localStorage.setItem(PREFERENCE_KEY, "false");
  await closeActiveWorkoutNotification();
  dispatchPreferenceChange();
}

export function subscribeToWorkoutReminderPreference(
  listener: () => void,
): () => void {
  window.addEventListener(PREFERENCE_CHANGE_EVENT, listener);
  return () => window.removeEventListener(PREFERENCE_CHANGE_EVENT, listener);
}

export async function syncActiveWorkoutNotification({
  hasActiveWorkout,
  routineName,
  isAuthenticated,
}: {
  hasActiveWorkout: boolean;
  routineName: string | undefined;
  isAuthenticated: boolean;
}): Promise<void> {
  if (
    !isAuthenticated ||
    !hasActiveWorkout ||
    !getWorkoutReminderPreference() ||
    getWorkoutReminderPermission() !== "granted"
  ) {
    await closeActiveWorkoutNotification();
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(`Workout active · ${routineName ?? "Lift Log"}`, {
    body: "Tap to return and finish your workout.",
    icon: "/pwa-192x192.png",
    badge: "/notification-badge.svg",
    tag: ACTIVE_WORKOUT_NOTIFICATION_TAG,
    requireInteraction: true,
    data: { path: "/active-workout" },
  });
}
