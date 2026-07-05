// src/types/session.ts

import type { ID } from "./common";
import type { TrackingType } from "./exercise";
import type { Prescription } from "./routine";

export type SessionStatus = "in_progress" | "completed" | "cancelled";

export type CompletedSet = {
  id: ID;
  setNumber: number;
  reps?: number | null;
  weight?: number | null;
  rir?: number | null;
  durationSeconds?: number | null;

  previousReps?: number | null;
  previousWeight?: number | null;
  previousDurationSeconds?: number | null;

  completedAt?: string | null;
  isCompleted: boolean;
};

export type WorkoutSessionExercise = {
  id: ID;
  sessionId: ID;
  exerciseId: ID;
  order: number;
  trackingType: TrackingType;
  sourceRoutineExerciseRefId?: ID;
  prescription?: Prescription;
  performedSets: CompletedSet[];
  bodyweightKg?: number | null;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSession = {
  id: ID;
  date: string;
  routineId?: ID;
  startedAt: string;
  endedAt?: string | null;
  status: SessionStatus;
  notes?: string;
  exercises: WorkoutSessionExercise[];
  createdAt: string;
  updatedAt: string;
};