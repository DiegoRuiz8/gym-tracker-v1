import { create } from "zustand";
import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { Routine, RoutineExerciseRef } from "../types/routine";
import type { WorkoutLog } from "../types/log";
import { getInitialAppData } from "./initialData";
import {
  savePersistedAppData,
  type WeightUnit,
} from "./persistence";

type AddWorkoutLogInput = WorkoutLog;

type AppData = {
  exercises: Exercise[];
  exerciseVariants: ExerciseVariant[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  preferredWeightUnit: WeightUnit;
};

function normalizeExerciseRefOrders(
  exerciseRefs: RoutineExerciseRef[],
): RoutineExerciseRef[] {
  return exerciseRefs.map((exerciseRef, index) => ({
    ...exerciseRef,
    order: index + 1,
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];

  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem == null) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

type AppState = {
  exercises: Exercise[];
  exerciseVariants: ExerciseVariant[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  preferredWeightUnit: WeightUnit;

  replaceAppData: (data: AppData) => void;
  resetAppData: () => void;
  setPreferredWeightUnit: (unit: WeightUnit) => void;

  addExercise: (exercise: Exercise) => void;
  updateExercise: (updatedExercise: Exercise) => void;
  addExerciseVariant: (variant: ExerciseVariant) => void;
  updateExerciseVariant: (updatedVariant: ExerciseVariant) => void;

  addWorkoutLog: (log: AddWorkoutLogInput) => void;
  updateWorkoutLog: (updatedLog: WorkoutLog) => void;
  deleteWorkoutLog: (logId: string) => void;

  addRoutine: (routine: Routine) => void;
  updateRoutine: (updatedRoutine: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  moveRoutine: (fromIndex: number, toIndex: number) => void;

  addExerciseRefToRoutine: (
    routineId: string,
    exerciseRef: RoutineExerciseRef,
  ) => void;

  removeExerciseRefFromRoutine: (
    routineId: string,
    exerciseRefId: string,
  ) => void;

  updateRoutineExerciseRef: (
    routineId: string,
    updatedExerciseRef: RoutineExerciseRef,
  ) => void;

  moveExerciseRefInRoutine: (
    routineId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
};

const initialData = getInitialAppData();

export const useAppStore = create<AppState>((set) => ({
  exercises: initialData.exercises,
  exerciseVariants: initialData.exerciseVariants,
  routines: initialData.routines,
  workoutLogs: initialData.workoutLogs,
  preferredWeightUnit: initialData.preferredWeightUnit,

  replaceAppData: (data) =>
    set({
      exercises: data.exercises,
      exerciseVariants: data.exerciseVariants,
      routines: data.routines,
      workoutLogs: data.workoutLogs,
      preferredWeightUnit: data.preferredWeightUnit,
    }),

  resetAppData: () =>
    set({
      exercises: [],
      exerciseVariants: [],
      routines: [],
      workoutLogs: [],
      preferredWeightUnit: "kg",
    }),

  setPreferredWeightUnit: (unit) =>
    set({
      preferredWeightUnit: unit,
    }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [...state.exercises, exercise],
    })),

  updateExercise: (updatedExercise) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.id === updatedExercise.id ? updatedExercise : exercise,
      ),
    })),

  addExerciseVariant: (variant) =>
    set((state) => ({
      exerciseVariants: [...state.exerciseVariants, variant],
    })),

  updateExerciseVariant: (updatedVariant) =>
    set((state) => ({
      exerciseVariants: state.exerciseVariants.map((variant) =>
        variant.id === updatedVariant.id ? updatedVariant : variant,
      ),
    })),

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

  addRoutine: (routine) =>
    set((state) => ({
      routines: [routine, ...state.routines],
    })),

  updateRoutine: (updatedRoutine) =>
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id === updatedRoutine.id ? updatedRoutine : routine,
      ),
    })),

  deleteRoutine: (routineId) =>
    set((state) => ({
      routines: state.routines.filter((routine) => routine.id !== routineId),
    })),

  moveRoutine: (fromIndex, toIndex) =>
    set((state) => {
      const total = state.routines.length;

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= total ||
        toIndex >= total ||
        fromIndex === toIndex
      ) {
        return state;
      }

      return {
        routines: moveItem(state.routines, fromIndex, toIndex),
      };
    }),

  addExerciseRefToRoutine: (routineId, exerciseRef) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) {
          return routine;
        }

        const nextExerciseRefs = normalizeExerciseRefOrders([
          ...routine.exerciseRefs,
          exerciseRef,
        ]);

        return {
          ...routine,
          exerciseRefs: nextExerciseRefs,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  removeExerciseRefFromRoutine: (routineId, exerciseRefId) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) {
          return routine;
        }

        const filteredExerciseRefs = routine.exerciseRefs.filter(
          (ref) => ref.id !== exerciseRefId,
        );

        const nextExerciseRefs = normalizeExerciseRefOrders(
          filteredExerciseRefs,
        );

        return {
          ...routine,
          exerciseRefs: nextExerciseRefs,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  updateRoutineExerciseRef: (routineId, updatedExerciseRef) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) {
          return routine;
        }

        const nextExerciseRefs = normalizeExerciseRefOrders(
          routine.exerciseRefs.map((ref) =>
            ref.id === updatedExerciseRef.id ? updatedExerciseRef : ref,
          ),
        );

        return {
          ...routine,
          exerciseRefs: nextExerciseRefs,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  moveExerciseRefInRoutine: (routineId, fromIndex, toIndex) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) {
          return routine;
        }

        const total = routine.exerciseRefs.length;

        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= total ||
          toIndex >= total ||
          fromIndex === toIndex
        ) {
          return routine;
        }

        const sortedExerciseRefs = [...routine.exerciseRefs].sort(
          (a, b) => a.order - b.order,
        );

        const movedExerciseRefs = moveItem(
          sortedExerciseRefs,
          fromIndex,
          toIndex,
        );

        const nextExerciseRefs = normalizeExerciseRefOrders(movedExerciseRefs);

        return {
          ...routine,
          exerciseRefs: nextExerciseRefs,
          updatedAt: new Date().toISOString(),
        };
      }),
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
      preferredWeightUnit: state.preferredWeightUnit,
    },
  });
});