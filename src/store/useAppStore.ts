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

function createSessionFromRoutine(
  routine: Routine,
  exerciseVariants: ExerciseVariant[],
  workoutSessions: WorkoutSession[],
  workoutLogs: WorkoutLog[],
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

      const latestSets = getLatestPerformanceForVariant(
        workoutSessions,
        workoutLogs,
        ref.variantId,
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
        performedSets: createCompletedSetsFromLatest(
          ref.prescription.sets,
          latestSets,
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
  deleteWorkoutSession: (sessionId: string) => void;

  removeExerciseFromActiveWorkoutSession: (sessionExerciseId: string) => void;
  removeExerciseFromWorkoutSession: (
    sessionId: string,
    sessionExerciseId: string,
  ) => void;

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

type LatestSetLike = {
  reps?: number | null;
  weight?: number | null;
  rir?: number | null;
  durationSeconds?: number | null;
};

function getLatestPerformanceForVariant(
  workoutSessions: WorkoutSession[],
  workoutLogs: WorkoutLog[],
  variantId: string,
): LatestSetLike[] {
  const latestSessionExercise = [...workoutSessions]
    .sort((a, b) => {
      const aTime = a.endedAt ?? a.startedAt;
      const bTime = b.endedAt ?? b.startedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })
    .flatMap((session) =>
      [...session.exercises]
        .sort((a, b) => a.order - b.order)
        .filter((exercise) => exercise.variantId === variantId),
    )
    .find((exercise) =>
      exercise.performedSets.some(
        (set) =>
          set.isCompleted &&
          (set.reps != null ||
            set.weight != null ||
            set.durationSeconds != null),
      ),
    );

  if (latestSessionExercise) {
    return latestSessionExercise.performedSets
      .filter(
        (set) =>
          set.isCompleted &&
          (set.reps != null ||
            set.weight != null ||
            set.durationSeconds != null),
      )
      .map((set) => ({
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        rir: set.rir ?? null,
        durationSeconds: set.durationSeconds ?? null,
      }));
  }

  const latestLog = [...workoutLogs]
    .filter(
      (log) => log.variantId === variantId && log.performedSets.length > 0,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (latestLog) {
    return latestLog.performedSets.map((set) => ({
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      rir: set.rir ?? null,
      durationSeconds: null,
    }));
  }

  return [];
}

function createCompletedSetsFromLatest(
  totalSets: number,
  latestSets: LatestSetLike[],
): CompletedSet[] {
  return Array.from({ length: totalSets }, (_, index) => {
    const latestSet = latestSets[index] ?? latestSets[latestSets.length - 1];

    return {
      id: generateId(),
      setNumber: index + 1,

      reps: latestSet?.reps ?? null,
      weight: latestSet?.weight ?? null,
      rir: latestSet?.rir ?? null,
      durationSeconds: latestSet?.durationSeconds ?? null,

      previousReps: latestSet?.reps ?? null,
      previousWeight: latestSet?.weight ?? null,
      previousDurationSeconds: latestSet?.durationSeconds ?? null,

      completedAt: null,
      isCompleted: false,
    };
  });
}

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
        state.workoutSessions,
        state.workoutLogs,
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

  deleteWorkoutSession: (sessionId) =>
    set((state) => ({
      workoutSessions: state.workoutSessions.filter(
        (session) => session.id !== sessionId,
      ),
    })),

  removeExerciseFromWorkoutSession: (sessionId, sessionExerciseId) =>
    set((state) => {
      const targetSession = state.workoutSessions.find(
        (session) => session.id === sessionId,
      );

      if (!targetSession) {
        return state;
      }

      const nextExercises = targetSession.exercises
        .filter((exercise) => exercise.id !== sessionExerciseId)
        .map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        }));

      if (nextExercises.length === 0) {
        return {
          workoutSessions: state.workoutSessions.filter(
            (session) => session.id !== sessionId,
          ),
        };
      }

      const now = new Date().toISOString();

      return {
        workoutSessions: state.workoutSessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                exercises: nextExercises,
                updatedAt: now,
              }
            : session,
        ),
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
            updatedSets.length > 0 &&
            updatedSets.every((set) => set.isCompleted);

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
              const previousSet =
                exercise.performedSets[exercise.performedSets.length - 1];

              return {
                ...exercise,
                updatedAt: now,
                performedSets: [
                  ...exercise.performedSets,
                  {
                    id: generateId(),
                    setNumber: nextSetNumber,
                    reps:
                      previousSet?.previousReps ?? previousSet?.reps ?? null,
                    weight:
                      previousSet?.previousWeight ??
                      previousSet?.weight ??
                      null,
                    rir: null,
                    durationSeconds:
                      previousSet?.previousDurationSeconds ?? null,
                    previousReps:
                      previousSet?.previousReps ?? previousSet?.reps ?? null,
                    previousWeight:
                      previousSet?.previousWeight ??
                      previousSet?.weight ??
                      null,
                    previousDurationSeconds:
                      previousSet?.previousDurationSeconds ?? null,
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

      const latestSets = getLatestPerformanceForVariant(
        state.workoutSessions,
        state.workoutLogs,
        selectedVariant.id,
      );
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
        performedSets: createCompletedSetsFromLatest(3, latestSets),
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

  removeExerciseFromActiveWorkoutSession: (sessionExerciseId) =>
    set((state) => {
      if (!state.activeWorkoutSession) {
        return state;
      }

      const targetExists = state.activeWorkoutSession.exercises.some(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!targetExists) {
        return state;
      }

      const now = new Date().toISOString();

      const nextExercises = state.activeWorkoutSession.exercises
        .filter((exercise) => exercise.id !== sessionExerciseId)
        .map((exercise, index) => ({
          ...exercise,
          order: index + 1,
          updatedAt: now,
        }));

      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: nextExercises,
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
      const setCount = targetExercise.performedSets.length;

      const latestSets = getLatestPerformanceForVariant(
        state.workoutSessions,
        state.workoutLogs,
        nextVariantId,
      );

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
              performedSets: createCompletedSetsFromLatest(
                setCount,
                latestSets,
              ),
              isCompleted: false,
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
