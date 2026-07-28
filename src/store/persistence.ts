// src/store/persistence.ts

import type { Exercise } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";
import type { WorkoutSession } from "../types/session";

const STORAGE_KEY = "gym-tracker-v1";
const DEMO_STORAGE_KEY = "gym-tracker-v1-demo";

export type WeightUnit = "kg" | "lb";

export type PersistedAppData = {
  version: number;
  data: {
    exercises: Exercise[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
    workoutSessions: WorkoutSession[];
    activeWorkoutSession: WorkoutSession | null;
    preferredWeightUnit: WeightUnit;
  };
};

function loadPersistedData(storageKey: string): PersistedAppData | null {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      version?: number;
      data?: {
        exercises?: Exercise[];
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

function savePersistedData(storageKey: string, payload: PersistedAppData): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save app data to localStorage", error);
  }
}

export function loadPersistedAppData(): PersistedAppData | null {
  return loadPersistedData(STORAGE_KEY);
}

export function loadPersistedDemoData(): PersistedAppData | null {
  return loadPersistedData(DEMO_STORAGE_KEY);
}

export function savePersistedAppData(payload: PersistedAppData): void {
  savePersistedData(STORAGE_KEY, payload);
}

export function savePersistedDemoData(payload: PersistedAppData): void {
  savePersistedData(DEMO_STORAGE_KEY, payload);
}
