import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
} from "../types/session";
import type { Routine } from "../types/routine";

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

export type ResolvedWorkoutSessionExercise = {
  sessionExercise: WorkoutSessionExercise;
  exercise?: Exercise;
  variant?: ExerciseVariant;
};

export type ResolvedWorkoutSession = {
  session: WorkoutSession;
  routine?: Routine;
  dateKey: string;
  exercises: ResolvedWorkoutSessionExercise[];
};

export function buildResolvedWorkoutSessions(
  workoutSessions: WorkoutSession[],
  routines: Routine[],
  exerciseVariants: ExerciseVariant[],
  exercises: Exercise[],
): ResolvedWorkoutSession[] {
  return workoutSessions.map((session) => {
    const routine = routines.find((item) => item.id === session.routineId);

    const resolvedExercises = [...session.exercises]
      .sort((a, b) => a.order - b.order)
      .map((sessionExercise) => {
        const variant = getVariantById(exerciseVariants, sessionExercise.variantId);
        const exercise = variant
          ? getExerciseById(exercises, variant.exerciseId)
          : getExerciseById(exercises, sessionExercise.exerciseId);

        return {
          sessionExercise,
          exercise,
          variant,
        };
      });

    return {
      session,
      routine,
      dateKey: session.date,
      exercises: resolvedExercises,
    };
  });
}