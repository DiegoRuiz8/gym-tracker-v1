import { loadPersistedAppData } from "./persistence";

export function getInitialAppData() {
  const persisted = loadPersistedAppData();

  if (persisted) {
    return persisted.data;
  }

  return {
    exercises: [],
    exerciseVariants: [],
    routines: [],
    workoutLogs: [],
    preferredWeightUnit: "kg" as const,
  };
}