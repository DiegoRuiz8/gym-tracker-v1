import { useState } from "react";
import {
  disableWorkoutReminders,
  enableWorkoutReminders,
  getWorkoutReminderPermission,
  getWorkoutReminderPreferenceStatus,
  requiresHomeScreenInstallForWorkoutReminders,
} from "../lib/workoutNotifications";
import { useTranslation } from "../i18n/useTranslation";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

export function WorkoutReminderPrompt() {
  const { t } = useTranslation();
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
  const requiresHomeScreenInstall =
    requiresHomeScreenInstallForWorkoutReminders();
  const shouldPrompt =
    !isLoading &&
    isAuthenticated &&
    activeWorkoutSessionId !== null &&
    dismissedSessionId !== activeWorkoutSessionId &&
    getWorkoutReminderPermission() === "default" &&
    getWorkoutReminderPreferenceStatus() === "unconfigured";

  async function handleEnable() {
    setDismissedSessionId(activeWorkoutSessionId);

    try {
      await enableWorkoutReminders();
    } catch (error) {
      console.error("Unable to enable workout reminders", error);
    }
  }

  function handleDefer() {
    setDismissedSessionId(activeWorkoutSessionId);

    void disableWorkoutReminders().catch((error: Error) => {
      console.error("Unable to disable workout reminders", error);
    });
  }

  function handleHomeScreenAcknowledgement() {
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
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 21h4" />
          </svg>
        </span>
        <p className="workout-reminder-prompt-eyebrow">{t("Active workout")}</p>
        {requiresHomeScreenInstall ? (
          <>
            <h2 id="workout-reminder-prompt-title">
              {t("Add LiftLog to your Home Screen")}
            </h2>
            <p>{t("On iPhone and iPad, active workout reminders work only in an installed web app.")}</p>
            <p className="workout-reminder-prompt-reassurance">
              {t("In Safari, tap Share, then choose Add to Home Screen.")}
            </p>
            <div className="workout-reminder-prompt-actions">
              <button
                className="button-primary"
                type="button"
                onClick={handleHomeScreenAcknowledgement}
              >
                {t("Got it")}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="workout-reminder-prompt-title">
              {t("Don’t lose your workout")}
            </h2>
            <p>
              {t("While a workout is in progress, LiftLog shows one notification so you can return and finish it.")}
            </p>
            <p className="workout-reminder-prompt-reassurance">
              {t("No promotions or content notifications.")}
            </p>
            <div className="workout-reminder-prompt-actions">
              <button className="button-primary" type="button" onClick={() => void handleEnable()}>
                {t("Enable reminder")}
              </button>
              <button className="button-secondary" type="button" onClick={() => void handleDefer()}>
                {t("Not now")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
