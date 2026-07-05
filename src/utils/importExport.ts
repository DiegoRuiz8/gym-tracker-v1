// src/utils/importExport.ts

import type { Exercise } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  CompletedSet,
} from "../types/session";
import type { WeightUnit } from "../store/persistence";

export type AppImportPayload = {
  version: 4;
  data: {
    exercises: Exercise[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
    workoutSessions: WorkoutSession[];
    activeWorkoutSession: WorkoutSession | null;
    preferredWeightUnit?: WeightUnit;
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isPerformedSet(value: unknown): boolean {
  if (!isObject(value)) return false;

  return (
    isNumber(value.reps) &&
    isNumber(value.weight) &&
    (value.rir === undefined || value.rir === null || isNumber(value.rir))
  );
}

function isWorkoutLog(value: unknown): value is WorkoutLog {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.date) &&
    isString(value.exerciseId) &&
    Array.isArray(value.performedSets) &&
    value.performedSets.every(isPerformedSet) &&
    isString(value.createdAt) &&
    (value.routineId === undefined || isString(value.routineId)) &&
    (value.bodyweightKg === undefined ||
      value.bodyweightKg === null ||
      isNumber(value.bodyweightKg)) &&
    (value.notes === undefined || isString(value.notes))
  );
}

function isExercise(value: unknown): value is Exercise {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isBoolean(value.isActive) &&
    isString(value.trackingType) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.category === undefined || isString(value.category)) &&
    (value.notes === undefined || isString(value.notes)) &&
    // version 4: primaryMuscle reemplaza a muscleGroups
    (value.primaryMuscle === undefined || isString(value.primaryMuscle)) &&
    (value.secondaryMuscleGroups === undefined ||
      isStringArray(value.secondaryMuscleGroups)) &&
    (value.equipment === undefined || isString(value.equipment)) &&
    (value.gymLabel === undefined || isString(value.gymLabel)) &&
    (value.exerciseDbId === undefined ||
      value.exerciseDbId === null ||
      isString(value.exerciseDbId)) &&
    (value.exerciseDbLinkStatus === undefined ||
      isString(value.exerciseDbLinkStatus))
  );
}

function isPrescription(value: unknown): boolean {
  if (!isObject(value)) return false;

  const repRange = value.repRange;
  const repRangeIsValid =
    repRange === undefined ||
    (isObject(repRange) && isNumber(repRange.min) && isNumber(repRange.max));

  return (
    isNumber(value.sets) &&
    repRangeIsValid &&
    (value.targetRIR === undefined ||
      value.targetRIR === null ||
      isNumber(value.targetRIR)) &&
    (value.restSeconds === undefined ||
      value.restSeconds === null ||
      isNumber(value.restSeconds)) &&
    (value.notes === undefined || isString(value.notes))
  );
}

function isRoutineExerciseRef(value: unknown): boolean {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.routineId) &&
    isString(value.exerciseId) &&
    isNumber(value.order) &&
    isPrescription(value.prescription)
  );
}

function isRoutine(value: unknown): value is Routine {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    Array.isArray(value.exerciseRefs) &&
    value.exerciseRefs.every(isRoutineExerciseRef) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.dayType === undefined || isString(value.dayType)) &&
    (value.description === undefined || isString(value.description))
  );
}

function isCompletedSet(value: unknown): value is CompletedSet {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isNumber(value.setNumber) &&
    isBoolean(value.isCompleted) &&
    (value.reps === undefined || value.reps === null || isNumber(value.reps)) &&
    (value.weight === undefined ||
      value.weight === null ||
      isNumber(value.weight)) &&
    (value.rir === undefined || value.rir === null || isNumber(value.rir)) &&
    (value.durationSeconds === undefined ||
      value.durationSeconds === null ||
      isNumber(value.durationSeconds)) &&
    (value.previousReps === undefined ||
      value.previousReps === null ||
      isNumber(value.previousReps)) &&
    (value.previousWeight === undefined ||
      value.previousWeight === null ||
      isNumber(value.previousWeight)) &&
    (value.previousDurationSeconds === undefined ||
      value.previousDurationSeconds === null ||
      isNumber(value.previousDurationSeconds)) &&
    (value.completedAt === undefined ||
      value.completedAt === null ||
      isString(value.completedAt))
  );
}

function isWorkoutSessionExercise(
  value: unknown,
): value is WorkoutSessionExercise {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.sessionId) &&
    isString(value.exerciseId) &&
    isNumber(value.order) &&
    isString(value.trackingType) &&
    Array.isArray(value.performedSets) &&
    value.performedSets.every(isCompletedSet) &&
    isBoolean(value.isCompleted) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.sourceRoutineExerciseRefId === undefined ||
      isString(value.sourceRoutineExerciseRefId)) &&
    (value.prescription === undefined || isPrescription(value.prescription)) &&
    (value.bodyweightKg === undefined ||
      value.bodyweightKg === null ||
      isNumber(value.bodyweightKg)) &&
    (value.notes === undefined || isString(value.notes))
  );
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.date) &&
    isString(value.startedAt) &&
    isString(value.status) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutSessionExercise) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.routineId === undefined || isString(value.routineId)) &&
    (value.endedAt === undefined ||
      value.endedAt === null ||
      isString(value.endedAt)) &&
    (value.notes === undefined || isString(value.notes))
  );
}

export function parseAppImportPayload(raw: string): AppImportPayload {
  const parsed: unknown = JSON.parse(raw);

  if (!isObject(parsed)) {
    throw new Error("Invalid JSON payload.");
  }

  if (parsed.version === 3) {
    throw new Error(
      "This file uses the old format (version 3). Run node migration/migrate-muscles.cjs to convert it to version 4 before importing.",
    );
  }

  if (parsed.version !== 4) {
    throw new Error(
      "Unsupported import version. Expected version 4.",
    );
  }

  if (!isObject(parsed.data)) {
    throw new Error("Missing data object.");
  }

  const { exercises, routines, workoutLogs } = parsed.data;

  if (!Array.isArray(exercises) || !exercises.every(isExercise)) {
    throw new Error("Invalid exercises array.");
  }

  if (!Array.isArray(routines) || !routines.every(isRoutine)) {
    throw new Error("Invalid routines array.");
  }

  if (!Array.isArray(workoutLogs) || !workoutLogs.every(isWorkoutLog)) {
    throw new Error("Invalid workoutLogs array.");
  }

  if (
    !Array.isArray(parsed.data.workoutSessions) ||
    !parsed.data.workoutSessions.every(isWorkoutSession)
  ) {
    throw new Error("Invalid workoutSessions array.");
  }

  const activeWorkoutSession =
    parsed.data.activeWorkoutSession === undefined ||
    parsed.data.activeWorkoutSession === null
      ? null
      : isWorkoutSession(parsed.data.activeWorkoutSession)
        ? (parsed.data.activeWorkoutSession as WorkoutSession)
        : null;

  return {
    version: 4,
    data: {
      exercises,
      routines,
      workoutLogs,
      workoutSessions: parsed.data.workoutSessions as WorkoutSession[],
      activeWorkoutSession,
      preferredWeightUnit:
        parsed.data.preferredWeightUnit === "lb" ? "lb" : "kg",
    },
  };
}

export function downloadAppDataAsJson(payload: AppImportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "gym-tracker-export.json";
  anchor.click();

  URL.revokeObjectURL(url);
}

export function downloadImportTemplateJson(): void {
  const template: AppImportPayload = {
    version: 4,
    data: {
      preferredWeightUnit: "kg",
      exercises: [
        {
          id: "ex-row-seated-cable",
          name: "Row - Seated Cable",
          category: "Pull",
          primaryMuscle: "back",
          secondaryMuscleGroups: ["biceps"],
          equipment: "Cable",
          gymLabel: "",
          notes: "",
          isActive: true,
          trackingType: "weight_reps",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "ex-bench-press-barbell",
          name: "Bench Press - Barbell",
          category: "Push",
          primaryMuscle: "chest",
          secondaryMuscleGroups: ["triceps", "shoulders"],
          equipment: "Barbell",
          gymLabel: "",
          notes: "",
          isActive: true,
          trackingType: "weight_reps",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      routines: [
        {
          id: "routine-upper-a",
          name: "Upper A",
          dayType: "Upper",
          description: "",
          exerciseRefs: [
            {
              id: "ref-upper-a-1",
              routineId: "routine-upper-a",
              exerciseId: "ex-bench-press-barbell",
              order: 1,
              prescription: {
                sets: 4,
                repRange: { min: 6, max: 8 },
                targetRIR: 1,
                restSeconds: 180,
                notes: "",
              },
            },
            {
              id: "ref-upper-a-2",
              routineId: "routine-upper-a",
              exerciseId: "ex-row-seated-cable",
              order: 2,
              prescription: {
                sets: 3,
                repRange: { min: 8, max: 12 },
                targetRIR: 1,
                restSeconds: 120,
                notes: "",
              },
            },
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      workoutLogs: [],
      workoutSessions: [],
      activeWorkoutSession: null,
    },
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "gym-tracker-import-template.json";
  anchor.click();

  URL.revokeObjectURL(url);
}