import { generateId } from "./ids";
import type { ExerciseVariant } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  CompletedSet,
} from "../types/session";

export function migrateLegacyLogsToSessions(
  workoutLogs: WorkoutLog[],
  exerciseVariants: ExerciseVariant[],
): WorkoutSession[] {
  return workoutLogs.map((log) => {
    const timestamp = log.createdAt;
    const variant = exerciseVariants.find((v) => v.id === log.variantId);

    const sessionId = generateId();
    const sessionExerciseId = generateId();

    const performedSets: CompletedSet[] = log.performedSets.map((set, index) => ({
      id: generateId(),
      setNumber: index + 1,
      reps: set.reps,
      weight: set.weight,
      rir: set.rir ?? null,
      durationSeconds: null,
      completedAt: timestamp,
      isCompleted: true,
    }));

    const sessionExercise: WorkoutSessionExercise = {
      id: sessionExerciseId,
      sessionId,
      exerciseId: log.exerciseId,
      variantId: log.variantId,
      order: 0,
      trackingType: variant?.trackingType ?? "weight_reps",
      performedSets,
      bodyweightKg: log.bodyweightKg ?? null,
      notes: log.notes,
      isCompleted: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const session: WorkoutSession = {
      id: sessionId,
      date: log.date,
      routineId: log.routineId,
      startedAt: timestamp,
      endedAt: timestamp,
      status: "completed",
      notes: "Migrated from legacy workout log",
      exercises: [sessionExercise],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return session;
  });
}