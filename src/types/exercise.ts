import type { ID } from "./common";

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
  createdAt: string;
};