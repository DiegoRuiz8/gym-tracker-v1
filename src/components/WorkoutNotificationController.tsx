import { useEffect, useMemo, useState } from "react";
import {
  getWorkoutReminderPreference,
  subscribeToWorkoutReminderPreference,
  syncActiveWorkoutNotification,
} from "../lib/workoutNotifications";
import {
  cancelRestTimerPush,
  syncRestTimerPush,
} from "../lib/restTimerPush";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

export function WorkoutNotificationController() {
  const activeWorkoutSession = useAppStore((state) => state.activeWorkoutSession);
  const routine = useAppStore((state) =>
    state.routines.find(
      (item) => item.id === state.activeWorkoutSession?.routineId,
    ),
  );
  const exercises = useAppStore((state) => state.exercises);
  const finishActiveSessionRestTimer = useAppStore(
    (state) => state.finishActiveSessionRestTimer,
  );
  const isLoading = useAuthStore((state) => state.isLoading);
  const isDemo = useAuthStore((state) => state.isDemo);
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.user) || state.isDemo,
  );
  const [isReminderEnabled, setIsReminderEnabled] = useState(
    getWorkoutReminderPreference,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isAppVisible, setIsAppVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const restTimer = activeWorkoutSession?.restTimer ?? null;
  const notificationRestTimer =
    isAppVisible && restTimer?.status === "finished" ? null : restTimer;
  const nextExerciseName = useMemo(() => {
    if (!restTimer || !activeWorkoutSession) return undefined;

    const sessionExercise = activeWorkoutSession.exercises.find(
      (exercise) => exercise.id === restTimer.sourceSessionExerciseId,
    );

    return exercises.find((exercise) => exercise.id === sessionExercise?.exerciseId)
      ?.name;
  }, [activeWorkoutSession, exercises, restTimer]);

  useEffect(
    () => subscribeToWorkoutReminderPreference(() => {
      setIsReminderEnabled(getWorkoutReminderPreference());
    }),
    [],
  );

  useEffect(() => {
    const refreshAppVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      setIsAppVisible(isVisible);

      if (isVisible) setNowMs(Date.now());
    };

    refreshAppVisibility();
    window.addEventListener("focus", refreshAppVisibility);
    window.addEventListener("visibilitychange", refreshAppVisibility);

    return () => {
      window.removeEventListener("focus", refreshAppVisibility);
      window.removeEventListener("visibilitychange", refreshAppVisibility);
    };
  }, []);

  useEffect(() => {
    if (restTimer?.status !== "running") return;

    const updateNow = () => setNowMs(Date.now());
    const startedAtMs = new Date(restTimer.startedAt).getTime();
    let timeout: number | undefined;

    const scheduleNextTick = () => {
      const elapsedMs = Math.max(0, Date.now() - startedAtMs);
      const delayMs = 1000 - (elapsedMs % 1000) + 20;

      timeout = window.setTimeout(() => {
        updateNow();
        scheduleNextTick();
      }, delayMs);
    };

    updateNow();
    scheduleNextTick();
    return () => {
      if (timeout != null) window.clearTimeout(timeout);
    };
  }, [restTimer]);

  useEffect(() => {
    if (restTimer?.status !== "running") return;

    const endsAt =
      new Date(restTimer.startedAt).getTime() + restTimer.durationSeconds * 1000;
    const finishIfElapsed = () => {
      if (Date.now() >= endsAt) {
        finishActiveSessionRestTimer("elapsed");
      }
    };

    finishIfElapsed();

    const timeout = window.setTimeout(
      () => finishActiveSessionRestTimer("elapsed"),
      Math.max(0, endsAt - Date.now()),
    );
    window.addEventListener("visibilitychange", finishIfElapsed);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("visibilitychange", finishIfElapsed);
    };
  }, [finishActiveSessionRestTimer, restTimer]);

  useEffect(() => {
    if (isLoading) return;

    void syncActiveWorkoutNotification({
      hasActiveWorkout: activeWorkoutSession !== null,
      routineName: routine?.name,
      isAuthenticated,
      restTimer: notificationRestTimer,
      nextExerciseName,
      nowMs,
    });
  }, [
    activeWorkoutSession,
    isAuthenticated,
    isAppVisible,
    isLoading,
    isReminderEnabled,
    nextExerciseName,
    nowMs,
    notificationRestTimer,
    restTimer,
    routine?.name,
  ]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || isDemo || !isReminderEnabled) return;

    if (activeWorkoutSession && restTimer?.status === "running") {
      void syncRestTimerPush({
        sessionId: activeWorkoutSession.id,
        restTimer,
        nextExerciseName,
      }).catch((error: Error) => {
        console.error("Unable to schedule the rest timer notification", error);
      });
      return;
    }

    if (
      !activeWorkoutSession ||
      !restTimer ||
      restTimer.completion === "dismissed"
    ) {
      void cancelRestTimerPush(activeWorkoutSession?.id ?? "").catch(
        (error: Error) => {
          console.error("Unable to cancel the rest timer notification", error);
        },
      );
    }
  }, [
    activeWorkoutSession,
    isAuthenticated,
    isDemo,
    isLoading,
    isReminderEnabled,
    nextExerciseName,
    restTimer,
  ]);

  return null;
}
