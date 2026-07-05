// src/store/initialData.ts

import { loadPersistedAppData } from "./persistence";

export function getInitialAppData() {
  const persisted = loadPersistedAppData();

  if (!persisted) {
    return {
      exercises: [],
      routines: [],
      workoutLogs: [],
      workoutSessions: [],
      activeWorkoutSession: null,
      preferredWeightUnit: "kg" as const,
    };
  }

  return persisted.data;
}