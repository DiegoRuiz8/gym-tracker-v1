import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";

const STORAGE_KEY = "gym-tracker-v1";

export type PersistedAppData = {
  version: number;
  data: {
    exercises: Exercise[];
    exerciseVariants: ExerciseVariant[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
  };
};

export function loadPersistedAppData(): PersistedAppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedAppData;

    if (!parsed.version || !parsed.data) {
      return null;
    }

    return parsed;
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
