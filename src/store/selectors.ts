// src/store/selectors.ts

import type { Exercise } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
} from "../types/session";
import type { Routine } from "../types/routine";
import { getLocalDateKey, parseLocalDateKey } from "../utils/format";

export function getExerciseById(
  exercises: Exercise[],
  exerciseId: string,
): Exercise | undefined {
  return exercises.find((exercise) => exercise.id === exerciseId);
}

export function getLogsForExercise(
  logs: WorkoutLog[],
  exerciseId: string,
): WorkoutLog[] {
  return logs
    .filter((log) => log.exerciseId === exerciseId)
    .sort((a, b) => {
      return parseLocalDateKey(b.date).getTime() - parseLocalDateKey(a.date).getTime();
    });
}

export function getLastLogForExercise(
  logs: WorkoutLog[],
  exerciseId: string,
): WorkoutLog | undefined {
  const exerciseLogs = getLogsForExercise(logs, exerciseId);
  return exerciseLogs[0];
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
  exercises: Exercise[],
): ResolvedWorkoutSession[] {
  return workoutSessions.map((session) => {
    const routine = routines.find((item) => item.id === session.routineId);

    const resolvedExercises = [...session.exercises]
      .sort((a, b) => a.order - b.order)
      .map((sessionExercise) => ({
        sessionExercise,
        exercise: getExerciseById(exercises, sessionExercise.exerciseId),
      }));

    return {
      session,
      routine,
      dateKey: getLocalDateKey(session.endedAt ?? session.startedAt),
      exercises: resolvedExercises,
    };
  });
}

export type ExerciseSessionHistoryItem = {
  sessionId: string;
  date: string;
  routineId?: string;
  startedAt: string;
  endedAt?: string | null;
  sessionNotes?: string;
  sessionExercise: WorkoutSessionExercise;
};

export function getSessionHistoryForExercise(
  workoutSessions: WorkoutSession[],
  exerciseId: string,
): ExerciseSessionHistoryItem[] {
  return [...workoutSessions]
    .sort((a, b) => {
      const aTime = a.endedAt ?? a.startedAt;
      const bTime = b.endedAt ?? b.startedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })
    .flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .map((sessionExercise) => ({
          sessionId: session.id,
          date: getLocalDateKey(session.endedAt ?? session.startedAt),
          routineId: session.routineId,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          sessionNotes: session.notes,
          sessionExercise,
        })),
    );
}
