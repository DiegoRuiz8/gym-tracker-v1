import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";

export type AppImportPayload = {
  version: 1;
  data: {
    exercises: Exercise[];
    exerciseVariants: ExerciseVariant[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isPerformedSet(value: unknown): boolean {
  if (!isObject(value)) return false;
  return isNumber(value.reps) && isNumber(value.weight);
}

function isWorkoutLog(value: unknown): value is WorkoutLog {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.date) &&
    isString(value.exerciseId) &&
    isString(value.variantId) &&
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
    isString(value.createdAt) &&
    (value.category === undefined || isString(value.category)) &&
    (value.notes === undefined || isString(value.notes)) &&
    (value.muscleGroups === undefined || isStringArray(value.muscleGroups))
  );
}

function isExerciseVariant(value: unknown): value is ExerciseVariant {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.exerciseId) &&
    isString(value.name) &&
    typeof value.isActive === "boolean" &&
    isString(value.trackingType) &&
    isString(value.createdAt) &&
    (value.equipment === undefined || isString(value.equipment)) &&
    (value.gymLabel === undefined || isString(value.gymLabel)) &&
    (value.notes === undefined || isString(value.notes))
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
    isString(value.variantId) &&
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

export function parseAppImportPayload(raw: string): AppImportPayload {
  const parsed: unknown = JSON.parse(raw);

  if (!isObject(parsed)) {
    throw new Error("Invalid JSON payload.");
  }

  if (parsed.version !== 1) {
    throw new Error("Unsupported import version.");
  }

  if (!isObject(parsed.data)) {
    throw new Error("Missing data object.");
  }

  const { exercises, exerciseVariants, routines, workoutLogs } = parsed.data;

  if (!Array.isArray(exercises) || !exercises.every(isExercise)) {
    throw new Error("Invalid exercises array.");
  }

  if (
    !Array.isArray(exerciseVariants) ||
    !exerciseVariants.every(isExerciseVariant)
  ) {
    throw new Error("Invalid exerciseVariants array.");
  }

  if (!Array.isArray(routines) || !routines.every(isRoutine)) {
    throw new Error("Invalid routines array.");
  }

  if (!Array.isArray(workoutLogs) || !workoutLogs.every(isWorkoutLog)) {
    throw new Error("Invalid workoutLogs array.");
  }

  return {
    version: 1,
    data: {
      exercises,
      exerciseVariants,
      routines,
      workoutLogs,
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