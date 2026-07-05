// src/types/exercise.ts

import type { ID } from "./common";
import type { PrimaryMuscle } from "../utils/primaryMuscles";

export type TrackingType =
  | "weight_reps"
  | "bodyweight_reps"
  | "weighted_bodyweight_reps"
  | "assisted_bodyweight_reps"
  | "duration"
  | "duration_weight";

export type ExerciseDbLinkStatus = "auto" | "manual" | "none";

export type Exercise = {
  id: ID;
  name: string;
  category?: string;

  // Músculo principal (select fijo de PRIMARY_MUSCLE_OPTIONS).
  // Reemplaza muscleGroups — usado para el swap por músculo y para mostrar
  // el músculo principal en la UI de forma consistente.
  primaryMuscle?: PrimaryMuscle;

  // Músculos secundarios opcionales (texto libre separado por comas).
  // Solo informativo — no se usa en lógica de swap ni filtros.
  secondaryMuscleGroups?: string[];

  equipment?: string;
  gymLabel?: string;
  notes?: string;
  isActive: boolean;
  trackingType: TrackingType;

  // Vinculo opcional al catalogo de ExerciseDB (ver lib/exerciseDbCache.ts)
  exerciseDbId?: string | null;
  exerciseDbLinkStatus?: ExerciseDbLinkStatus;

  createdAt: string;
  updatedAt: string;
};