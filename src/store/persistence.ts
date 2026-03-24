import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";
import type { WorkoutSession } from "../types/session";

const STORAGE_KEY = "gym-tracker-v1";

export type WeightUnit = "kg" | "lb";

export type PersistedAppData = {
  version: number;
  data: {
    exercises: Exercise[];
    exerciseVariants: ExerciseVariant[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
    workoutSessions: WorkoutSession[];
    activeWorkoutSession: WorkoutSession | null;
    preferredWeightUnit: WeightUnit;
  };
};

export function loadPersistedAppData(): PersistedAppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
  version?: number;
  data?: {
    exercises?: Exercise[];
    exerciseVariants?: ExerciseVariant[];
    routines?: Routine[];
    workoutLogs?: WorkoutLog[];
    workoutSessions?: WorkoutSession[];
    activeWorkoutSession?: WorkoutSession | null;
    preferredWeightUnit?: WeightUnit;
  };
};
    if (!parsed.version || !parsed.data) {
      return null;
    }

    return {
      version: parsed.version,
      data: {
        exercises: parsed.data.exercises ?? [],
        exerciseVariants: parsed.data.exerciseVariants ?? [],
        routines: parsed.data.routines ?? [],
        workoutLogs: parsed.data.workoutLogs ?? [],
        workoutSessions: parsed.data.workoutSessions ?? [],
        activeWorkoutSession: parsed.data.activeWorkoutSession ?? null,
        preferredWeightUnit: parsed.data.preferredWeightUnit ?? "kg",
      },
    };
  } catch (error) {
    console.error("Failed to load app data from localStorage", error);
    return null;
  }
}

export function savePersistedAppData(payload: PersistedAppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save app data to localStorage", error);
  }
}
