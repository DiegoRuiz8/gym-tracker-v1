import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";
import type { WeightUnit } from "../store/persistence";

export type AppImportPayload = {
  version: 2;
  data: {
    exercises: Exercise[];
    exerciseVariants: ExerciseVariant[];
    routines: Routine[];
    workoutLogs: WorkoutLog[];
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
    isString(value.updatedAt) &&
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
    isString(value.updatedAt) &&
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

  if (parsed.version !== 2) {
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
    version: 2,
    data: {
      exercises,
      exerciseVariants,
      routines,
      workoutLogs,
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
    version: 2,
    data: {
      preferredWeightUnit: "kg",
      exercises: [
        {
          id: "ex-bench-press",
          name: "Bench Press",
          category: "Push",
          muscleGroups: ["chest", "triceps", "shoulders"],
          notes: "Optional exercise notes",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      exerciseVariants: [
        {
          id: "var-bench-press-barbell",
          exerciseId: "ex-bench-press",
          name: "Barbell",
          equipment: "Barbell",
          gymLabel: "Flat bench",
          notes: "Optional variant notes",
          isActive: true,
          trackingType: "weight_reps",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      routines: [
        {
          id: "routine-push-a",
          name: "Push A",
          dayType: "Push",
          description: "Optional routine description",
          exerciseRefs: [
            {
              id: "ref-push-a-1",
              routineId: "routine-push-a",
              exerciseId: "ex-bench-press",
              variantId: "var-bench-press-barbell",
              order: 1,
              prescription: {
                sets: 4,
                repRange: {
                  min: 6,
                  max: 8,
                },
                targetRIR: 1,
                restSeconds: 180,
                notes: "Optional target notes",
              },
            },
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      workoutLogs: [
        {
          id: "log-bench-press-1",
          date: "2026-01-05",
          routineId: "routine-push-a",
          exerciseId: "ex-bench-press",
          variantId: "var-bench-press-barbell",
          performedSets: [
            { reps: 8, weight: 60 },
            { reps: 8, weight: 60 },
            { reps: 7, weight: 60 },
            { reps: 6, weight: 60 },
          ],
          notes: "Optional workout notes",
          createdAt: "2026-01-05T18:00:00.000Z",
        },
      ],
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