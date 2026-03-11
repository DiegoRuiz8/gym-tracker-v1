import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";

export function getExerciseById(
  exercises: Exercise[],
  exerciseId: string
): Exercise | undefined {
  return exercises.find((exercise) => exercise.id === exerciseId);
}

export function getVariantById(
  variants: ExerciseVariant[],
  variantId: string
): ExerciseVariant | undefined {
  return variants.find((variant) => variant.id === variantId);
}

export function getLogsForVariant(
  logs: WorkoutLog[],
  variantId: string
): WorkoutLog[] {
  return logs
    .filter((log) => log.variantId === variantId)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function getLastLogForVariant(
  logs: WorkoutLog[],
  variantId: string
): WorkoutLog | undefined {
  const variantLogs = getLogsForVariant(logs, variantId);
  return variantLogs[0];
}

export function getWorkoutLogById(
  logs: WorkoutLog[],
  logId: string,
): WorkoutLog | undefined {
  return logs.find((log) => log.id === logId);
}

