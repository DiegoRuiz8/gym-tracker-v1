import {
  seedExercises,
  seedExerciseVariants,
  seedRoutines,
  seedWorkoutLogs,
} from "./seedData";
import { loadPersistedAppData } from "./persistence";

export function getInitialAppData() {
  const persisted = loadPersistedAppData();

  if (persisted) {
    return persisted.data;
  }

  return {
    exercises: seedExercises,
    exerciseVariants: seedExerciseVariants,
    routines: seedRoutines,
    workoutLogs: seedWorkoutLogs,
  };
}