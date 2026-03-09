import { create } from "zustand";
import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { Routine } from "../types/routine";
import type { WorkoutLog } from "../types/log";
import { getInitialAppData } from "./initialData";
import { savePersistedAppData } from "./persistence";

type AddWorkoutLogInput = WorkoutLog;

type AppState = {
  exercises: Exercise[];
  exerciseVariants: ExerciseVariant[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: AddWorkoutLogInput) => void;
};

const initialData = getInitialAppData();

export const useAppStore = create<AppState>((set) => ({
  exercises: initialData.exercises,
  exerciseVariants: initialData.exerciseVariants,
  routines: initialData.routines,
  workoutLogs: initialData.workoutLogs,

  addWorkoutLog: (log) =>
    set((state) => ({
      workoutLogs: [log, ...state.workoutLogs],
    })),
}));

useAppStore.subscribe((state) => {
  savePersistedAppData({
    version: 1,
    data: {
      exercises: state.exercises,
      exerciseVariants: state.exerciseVariants,
      routines: state.routines,
      workoutLogs: state.workoutLogs,
    },
  });
});
