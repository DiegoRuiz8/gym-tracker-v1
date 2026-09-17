import { useEffect, useState } from "react";
import {
  getWorkoutReminderPreference,
  subscribeToWorkoutReminderPreference,
  syncActiveWorkoutNotification,
} from "../lib/workoutNotifications";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

export function WorkoutNotificationController() {
  const activeWorkoutSessionId = useAppStore(
    (state) => state.activeWorkoutSession?.id ?? null,
  );
  const routine = useAppStore((state) =>
    state.routines.find(
      (item) => item.id === state.activeWorkoutSession?.routineId,
    ),
  );
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.user) || state.isDemo,
  );
  const [isReminderEnabled, setIsReminderEnabled] = useState(
    getWorkoutReminderPreference,
  );

  useEffect(
    () => subscribeToWorkoutReminderPreference(() => {
      setIsReminderEnabled(getWorkoutReminderPreference());
    }),
    [],
  );

  useEffect(() => {
    if (isLoading) return;

    void syncActiveWorkoutNotification({
      hasActiveWorkout: activeWorkoutSessionId !== null,
      routineName: routine?.name,
      isAuthenticated,
    });
  }, [
    activeWorkoutSessionId,
    isAuthenticated,
    isLoading,
    isReminderEnabled,
    routine?.name,
  ]);

  return null;
}
