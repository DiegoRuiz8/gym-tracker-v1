import type { RestTimer } from "../types/session";
import {
  registerRestTimerPushSubscription,
  unregisterRestTimerPushSubscription,
} from "./restTimerPush";

const PREFERENCE_KEY = "gym-tracker-v1:workout-reminders-enabled";
const PREFERENCE_CHANGE_EVENT = "gym-tracker-v1:workout-reminders-changed";
const ACTIVE_WORKOUT_NOTIFICATION_TAG = "active-workout";

export type WorkoutReminderPermission =
  | "default"
  | "denied"
  | "granted"
  | "unsupported";

export type WorkoutReminderPreference = "enabled" | "disabled" | "unconfigured";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function supportsWorkoutNotifications(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

function isAppleMobileDevice(): boolean {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function formatRestTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getRemainingRestSeconds(restTimer: RestTimer, nowMs: number): number {
  const startedAtMs = new Date(restTimer.startedAt).getTime();
  const endsAt = startedAtMs + restTimer.durationSeconds * 1000;

  return Math.max(0, Math.ceil((endsAt - Math.max(nowMs, startedAtMs)) / 1000));
}

export function requiresHomeScreenInstallForWorkoutReminders(): boolean {
  if (!isAppleMobileDevice()) return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true;

  return !isStandalone;
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

    try {
      await registerRestTimerPushSubscription();
    } catch (error) {
      console.error("Unable to register rest timer push notifications", error);
    }
  }

  return permission;
}

export async function disableWorkoutReminders(): Promise<void> {
  localStorage.setItem(PREFERENCE_KEY, "false");
  await closeActiveWorkoutNotification();
  dispatchPreferenceChange();

  try {
    await unregisterRestTimerPushSubscription();
  } catch (error) {
    console.error("Unable to remove rest timer push notifications", error);
  }
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
  restTimer,
  nextExerciseName,
  nowMs,
}: {
  hasActiveWorkout: boolean;
  routineName: string | undefined;
  isAuthenticated: boolean;
  restTimer: RestTimer | null;
  nextExerciseName: string | undefined;
  nowMs: number;
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
  const isRestRunning = restTimer?.status === "running";
  const remainingRestSeconds = isRestRunning && restTimer
    ? getRemainingRestSeconds(restTimer, nowMs)
    : 0;
  const title = isRestRunning
    ? `Rest · ${formatRestTime(remainingRestSeconds)}`
    : `Workout active · ${routineName ?? "Lift Log"}`;
  const body = isRestRunning
    ? nextExerciseName
      ? `Next: ${nextExerciseName}`
      : "Your rest timer is running."
    : "Tap to return and finish your workout.";

  const options: NotificationOptions & { renotify: boolean } = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/notification-badge.svg",
    tag: ACTIVE_WORKOUT_NOTIFICATION_TAG,
    requireInteraction: true,
    renotify: false,
    silent: true,
    data: { path: "/active-workout" },
  };

  await registration.showNotification(title, options);
}
