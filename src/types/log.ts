import type { ID } from "./common";

export type PerformedSet = {
  reps: number;
  weight: number;
  rir?: number | null;
};

export type WorkoutLog = {
  id: ID;
  date: string;
  routineId?: ID;
  exerciseId: ID;
  variantId: ID;
  performedSets: PerformedSet[];
  bodyweightKg?: number | null;
  notes?: string;
  createdAt: string;
};