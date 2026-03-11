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
  updateWorkoutLog: (updatedLog: WorkoutLog) => void;
  deleteWorkoutLog: (logId: string) => void;
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

    updateWorkoutLog: (updatedLog) =>
    set((state) => ({
      workoutLogs: state.workoutLogs.map((log) =>
        log.id === updatedLog.id ? updatedLog : log,
      ),
    })),

  deleteWorkoutLog: (logId) =>
    set((state) => ({
      workoutLogs: state.workoutLogs.filter((log) => log.id !== logId),
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
