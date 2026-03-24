import { create } from "zustand";
import type { Exercise, ExerciseVariant } from "../types/exercise";
import type { Routine, RoutineExerciseRef } from "../types/routine";
import type { WorkoutLog } from "../types/log";
import { getInitialAppData } from "./initialData";
import { generateId } from "../utils/ids";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  CompletedSet,
} from "../types/session";
import { savePersistedAppData, type WeightUnit } from "./persistence";

type AddWorkoutLogInput = WorkoutLog;

type AppData = {
  exercises: Exercise[];
  exerciseVariants: ExerciseVariant[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  workoutSessions: WorkoutSession[];
  activeWorkoutSession: WorkoutSession | null;
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

function updateActiveSessionExerciseInList(
  exercises: WorkoutSessionExercise[],
  sessionExerciseId: string,
  updater: (exercise: WorkoutSessionExercise) => WorkoutSessionExercise,
): WorkoutSessionExercise[] {
  return exercises.map((exercise) =>
    exercise.id === sessionExerciseId ? updater(exercise) : exercise,
  );
}

function createCompletedSetsFromPrescription(setCount: number): CompletedSet[] {
  return Array.from({ length: setCount }, (_, index) => ({
    id: generateId(),
    setNumber: index + 1,
    reps: null,
    weight: null,
    rir: null,
    durationSeconds: null,
    completedAt: null,
    isCompleted: false,
  }));
}

function createSessionFromRoutine(
  routine: Routine,
  exerciseVariants: ExerciseVariant[],
): WorkoutSession {
  const now = new Date().toISOString();
  const sessionId = generateId();

  const sortedExerciseRefs = [...routine.exerciseRefs].sort(
    (a, b) => a.order - b.order,
  );

  const exercises: WorkoutSessionExercise[] = sortedExerciseRefs.map(
    (ref, index) => {
      const variant = exerciseVariants.find(
        (item) => item.id === ref.variantId,
      );

      return {
        id: generateId(),
        sessionId,
        exerciseId: ref.exerciseId,
        variantId: ref.variantId,
        order: index + 1,
        trackingType: variant?.trackingType ?? "weight_reps",
        sourceRoutineExerciseRefId: ref.id,
        prescription: ref.prescription,
        performedSets: createCompletedSetsFromPrescription(
          ref.prescription.sets,
        ),
        bodyweightKg: null,
        notes: undefined,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
    },
  );

  return {
    id: sessionId,
    date: now.slice(0, 10),
    routineId: routine.id,
    startedAt: now,
    endedAt: null,
    status: "in_progress",
    notes: undefined,
    exercises,
    createdAt: now,
    updatedAt: now,
  };
}

type AppState = {
  exercises: Exercise[];
  exerciseVariants: ExerciseVariant[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  workoutSessions: WorkoutSession[];
  activeWorkoutSession: WorkoutSession | null;
  preferredWeightUnit: WeightUnit;

  setActiveWorkoutSession: (session: WorkoutSession | null) => void;
  updateActiveWorkoutSession: (session: WorkoutSession) => void;
  startWorkoutSessionFromRoutine: (routineId: string) => void;
  completeActiveWorkoutSession: () => void;
  cancelActiveWorkoutSession: () => void;
  removeLastActiveSessionExerciseSet: (sessionExerciseId: string) => void;
  addExerciseToActiveWorkoutSession: (variantId: string) => void;

  updateActiveSessionSetReps: (
    sessionExerciseId: string,
    setId: string,
    reps: number | null,
  ) => void;

  updateActiveSessionSetWeight: (
    sessionExerciseId: string,
    setId: string,
    weight: number | null,
  ) => void;

  toggleActiveSessionSetCompleted: (
    sessionExerciseId: string,
    setId: string,
  ) => void;

  addActiveSessionExerciseSet: (sessionExerciseId: string) => void;

  updateActiveSessionExerciseNotes: (
    sessionExerciseId: string,
    notes: string,
  ) => void;

  swapActiveSessionExerciseVariant: (
    sessionExerciseId: string,
    nextVariantId: string,
  ) => void;

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
  workoutSessions: initialData.workoutSessions,
  activeWorkoutSession: initialData.activeWorkoutSession,
  preferredWeightUnit: initialData.preferredWeightUnit,

  setActiveWorkoutSession: (session) =>
    set({
      activeWorkoutSession: session,
    }),

  updateActiveWorkoutSession: (session) =>
    set({
      activeWorkoutSession: {
        ...session,
        updatedAt: new Date().toISOString(),
      },
    }),

  startWorkoutSessionFromRoutine: (routineId) =>
    set((state) => {
      if (state.activeWorkoutSession) {
        return state;
      }

      const routine = state.routines.find((item) => item.id === routineId);

      if (!routine) {
        return state;
      }

      const session = createSessionFromRoutine(
        routine,
        state.exerciseVariants,
      );

      return {
        activeWorkoutSession: session,
      };
    }),

  completeActiveWorkoutSession: () =>
    set((state) => {
      const session = state.activeWorkoutSession;

      if (!session) {
        return state;
      }

      const completedAt = new Date().toISOString();

      const completedSession: WorkoutSession = {
        ...session,
        status: "completed",
        endedAt: completedAt,
        updatedAt: completedAt,
        exercises: session.exercises.map((exercise) => ({
          ...exercise,
          updatedAt: completedAt,
        })),
      };

      return {
        workoutSessions: [completedSession, ...state.workoutSessions],
        activeWorkoutSession: null,
      };
    }),

  cancelActiveWorkoutSession: () =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      return {
        activeWorkoutSession: null,
      };
    }),

  updateActiveSessionSetReps: (sessionExerciseId, setId, reps) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const now = new Date().toISOString();

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => ({
              ...exercise,
              updatedAt: now,
              performedSets: exercise.performedSets.map((set) =>
                set.id === setId ? { ...set, reps } : set,
              ),
            }),
          ),
        },
      };
    }),

  updateActiveSessionSetWeight: (sessionExerciseId, setId, weight) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const now = new Date().toISOString();

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => ({
              ...exercise,
              updatedAt: now,
              performedSets: exercise.performedSets.map((set) =>
                set.id === setId ? { ...set, weight } : set,
              ),
            }),
          ),
        },
      };
    }),

  toggleActiveSessionSetCompleted: (sessionExerciseId, setId) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const now = new Date().toISOString();

      const updatedExercises = updateActiveSessionExerciseInList(
        state.activeWorkoutSession.exercises,
        sessionExerciseId,
        (exercise) => {
          const updatedSets = exercise.performedSets.map((set) => {
            if (set.id !== setId) {
              return set;
            }

            const nextCompleted = !set.isCompleted;

            return {
              ...set,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? now : null,
            };
          });

          const allSetsCompleted =
            updatedSets.length > 0 && updatedSets.every((set) => set.isCompleted);

          return {
            ...exercise,
            updatedAt: now,
            isCompleted: allSetsCompleted,
            performedSets: updatedSets,
          };
        },
      );

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updatedExercises,
        },
      };
    }),

  addActiveSessionExerciseSet: (sessionExerciseId) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const now = new Date().toISOString();

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => {
              const nextSetNumber = exercise.performedSets.length + 1;

              return {
                ...exercise,
                updatedAt: now,
                performedSets: [
                  ...exercise.performedSets,
                  {
                    id: generateId(),
                    setNumber: nextSetNumber,
                    reps: null,
                    weight: null,
                    rir: null,
                    durationSeconds: null,
                    completedAt: null,
                    isCompleted: false,
                  },
                ],
              };
            },
          ),
        },
      };
    }),

    addExerciseToActiveWorkoutSession: (variantId) =>
  set((state) => {
    if (!state.activeWorkoutSession) {
      return state;
    }

    const selectedVariant = state.exerciseVariants.find(
      (variant) => variant.id === variantId,
    );

    if (!selectedVariant || !selectedVariant.isActive) {
      return state;
    }

    const alreadyExists = state.activeWorkoutSession.exercises.some(
      (exercise) => exercise.variantId === variantId,
    );

    if (alreadyExists) {
      return state;
    }

    const now = new Date().toISOString();
    const nextOrder = state.activeWorkoutSession.exercises.length + 1;

    const newSessionExercise = {
      id: generateId(),
      sessionId: state.activeWorkoutSession.id,
      exerciseId: selectedVariant.exerciseId,
      variantId: selectedVariant.id,
      order: nextOrder,
      trackingType: selectedVariant.trackingType,
      sourceRoutineExerciseRefId: undefined,
      prescription: {
        sets: 3,
        repRange: {
          min: 8,
          max: 12,
        },
        targetRIR: 1,
        restSeconds: 90,
      },
      performedSets: createCompletedSetsFromPrescription(3),
      bodyweightKg: null,
      notes: undefined,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    return {
      activeWorkoutSession: {
        ...state.activeWorkoutSession,
        updatedAt: now,
        exercises: [
          ...state.activeWorkoutSession.exercises,
          newSessionExercise,
        ],
      },
    };
  }),

    removeLastActiveSessionExerciseSet: (sessionExerciseId) =>
  set((state) => {
    if (!state.activeWorkoutSession) {
      return state;
    }

    const targetExercise = state.activeWorkoutSession.exercises.find(
      (exercise) => exercise.id === sessionExerciseId,
    );

    if (!targetExercise) {
      return state;
    }

    const prescribedSetCount = targetExercise.prescription?.sets ?? 0;

    if (targetExercise.performedSets.length <= prescribedSetCount) {
      return state;
    }

    const now = new Date().toISOString();
    const nextPerformedSets = targetExercise.performedSets
      .slice(0, -1)
      .map((set, index) => ({
        ...set,
        setNumber: index + 1,
      }));

    return {
      activeWorkoutSession: {
        ...state.activeWorkoutSession,
        updatedAt: now,
        exercises: updateActiveSessionExerciseInList(
          state.activeWorkoutSession.exercises,
          sessionExerciseId,
          (exercise) => ({
            ...exercise,
            updatedAt: now,
            performedSets: nextPerformedSets,
            isCompleted:
              nextPerformedSets.length > 0 &&
              nextPerformedSets.every((set) => set.isCompleted),
          }),
        ),
      },
    };
  }),

  updateActiveSessionExerciseNotes: (sessionExerciseId, notes) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const now = new Date().toISOString();

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => ({
              ...exercise,
              updatedAt: now,
              notes,
            }),
          ),
        },
      };
    }),

  swapActiveSessionExerciseVariant: (sessionExerciseId, nextVariantId) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const nextVariant = state.exerciseVariants.find(
        (variant) => variant.id === nextVariantId,
      );

      if (!nextVariant) {
        return state;
      }

      const targetExercise = state.activeWorkoutSession.exercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!targetExercise) {
        return state;
      }

      if (targetExercise.variantId === nextVariantId) {
        return state;
      }

      if (targetExercise.exerciseId !== nextVariant.exerciseId) {
        return state;
      }

      const now = new Date().toISOString();

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => ({
              ...exercise,
              variantId: nextVariantId,
              trackingType: nextVariant.trackingType,
              updatedAt: now,
            }),
          ),
        },
      };
    }),

  replaceAppData: (data) =>
    set({
      exercises: data.exercises,
      exerciseVariants: data.exerciseVariants,
      routines: data.routines,
      workoutLogs: data.workoutLogs,
      workoutSessions: data.workoutSessions,
      activeWorkoutSession: data.activeWorkoutSession,
      preferredWeightUnit: data.preferredWeightUnit,
    }),

  resetAppData: () =>
    set({
      exercises: [],
      exerciseVariants: [],
      routines: [],
      workoutLogs: [],
      workoutSessions: [],
      activeWorkoutSession: null,
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

        const nextExerciseRefs =
          normalizeExerciseRefOrders(filteredExerciseRefs);

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
    version: 2,
    data: {
      exercises: state.exercises,
      exerciseVariants: state.exerciseVariants,
      routines: state.routines,
      workoutLogs: state.workoutLogs,
      workoutSessions: state.workoutSessions,
      activeWorkoutSession: state.activeWorkoutSession,
      preferredWeightUnit: state.preferredWeightUnit,
    },
  });
});