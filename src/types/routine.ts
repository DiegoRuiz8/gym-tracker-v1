import type { ID } from "./common";

export type Prescription = {
  sets: number;
  repRange?: {
    min: number;
    max: number;
  };
  targetRIR?: number | null;
  restSeconds?: number | null;
  notes?: string;
};

export type RoutineExerciseRef = {
  id: ID;
  routineId: ID;
  exerciseId: ID;
  variantId: ID;
  order: number;
  prescription: Prescription;
};

export type Routine = {
  id: ID;
  name: string;
  dayType?: string;
  description?: string;
  exerciseRefs: RoutineExerciseRef[];
  createdAt: string;
  updatedAt: string;
};