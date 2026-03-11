import type { ID } from "./common";

export type TrackingType =
  | "weight_reps"
  | "bodyweight_reps"
  | "weighted_bodyweight_reps"
  | "assisted_bodyweight_reps"
  | "duration"
  | "duration_weight";

export type Exercise = {
  id: ID;
  name: string;
  category?: string;
  muscleGroups?: string[];
  notes?: string;
  createdAt: string;
};

export type ExerciseVariant = {
  id: ID;
  exerciseId: ID;
  name: string;
  equipment?: string;
  gymLabel?: string;
  notes?: string;
  isActive: boolean;
  trackingType: TrackingType;
  createdAt: string;
};