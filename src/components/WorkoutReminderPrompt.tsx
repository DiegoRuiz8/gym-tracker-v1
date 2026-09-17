import { useState } from "react";
import {
  disableWorkoutReminders,
  enableWorkoutReminders,
  getWorkoutReminderPermission,
  getWorkoutReminderPreferenceStatus,
} from "../lib/workoutNotifications";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

export function WorkoutReminderPrompt() {
  const activeWorkoutSessionId = useAppStore(
    (state) => state.activeWorkoutSession?.id ?? null,
  );
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.user) || state.isDemo,
  );
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(
    null,
  );
  const shouldPrompt =
    !isLoading &&
    isAuthenticated &&
    activeWorkoutSessionId !== null &&
    dismissedSessionId !== activeWorkoutSessionId &&
    getWorkoutReminderPermission() === "default" &&
    getWorkoutReminderPreferenceStatus() === "unconfigured";

  async function handleEnable() {
    await enableWorkoutReminders();
    setDismissedSessionId(activeWorkoutSessionId);
  }

  async function handleDefer() {
    await disableWorkoutReminders();
    setDismissedSessionId(activeWorkoutSessionId);
  }

  if (!shouldPrompt) return null;

  return (
    <div className="workout-reminder-prompt-backdrop">
      <section
        aria-labelledby="workout-reminder-prompt-title"
        aria-modal="true"
        className="workout-reminder-prompt"
        role="dialog"
      >
        <span className="workout-reminder-prompt-icon" aria-hidden="true">
          ↗
        </span>
        <p className="workout-reminder-prompt-eyebrow">Active workout</p>
        <h2 id="workout-reminder-prompt-title">Don’t lose your workout</h2>
        <p>
          While a workout is in progress, LiftLog shows one notification so you
          can return and finish it.
        </p>
        <p className="workout-reminder-prompt-reassurance">
          No promotions or content notifications.
        </p>
        <div className="workout-reminder-prompt-actions">
          <button className="button-primary" type="button" onClick={() => void handleEnable()}>
            Enable reminder
          </button>
          <button className="button-secondary" type="button" onClick={() => void handleDefer()}>
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}
