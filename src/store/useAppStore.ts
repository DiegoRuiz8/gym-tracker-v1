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
import { pushDataToSupabase } from "../lib/syncService";
import { useAuthStore } from "./useAuthStore";

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
  if (movedItem == null) return items;
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
      const variant = exerciseVariants.find((item) => item.id === ref.variantId);
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
        performedSets: createCompletedSetsFromLatest(ref.prescription.sets, latestSets),
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

  propagateActiveSessionSetWeightFromFirstSet: (
    sessionExerciseId: string,
    originalWeight: number | null,
    newWeight: number | null,
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
          (set.reps != null || set.weight != null || set.durationSeconds != null),
      ),
    );

  if (latestSessionExercise) {
    return latestSessionExercise.performedSets
      .filter(
        (set) =>
          set.isCompleted &&
          (set.reps != null || set.weight != null || set.durationSeconds != null),
      )
      .map((set) => ({
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        rir: set.rir ?? null,
        durationSeconds: set.durationSeconds ?? null,
      }));
  }

  const latestLog = [...workoutLogs]
    .filter((log) => log.variantId === variantId && log.performedSets.length > 0)
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

  setActiveWorkoutSession: (session) => set({ activeWorkoutSession: session }),

  updateActiveWorkoutSession: (session) =>
    set({ activeWorkoutSession: { ...session, updatedAt: new Date().toISOString() } }),

  startWorkoutSessionFromRoutine: (routineId) =>
    set((state) => {
      if (state.activeWorkoutSession) return state;
      const routine = state.routines.find((item) => item.id === routineId);
      if (!routine) return state;
      const session = createSessionFromRoutine(
        routine,
        state.exerciseVariants,
        state.workoutSessions,
        state.workoutLogs,
      );
      return { activeWorkoutSession: session };
    }),

  completeActiveWorkoutSession: () =>
    set((state) => {
      const session = state.activeWorkoutSession;
      if (!session) return state;
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
      if (!state.activeWorkoutSession) return state;
      return { activeWorkoutSession: null };
    }),

  deleteWorkoutSession: (sessionId) =>
    set((state) => ({
      workoutSessions: state.workoutSessions.filter((s) => s.id !== sessionId),
    })),

  removeExerciseFromWorkoutSession: (sessionId, sessionExerciseId) =>
    set((state) => {
      const targetSession = state.workoutSessions.find((s) => s.id === sessionId);
      if (!targetSession) return state;

      const nextExercises = targetSession.exercises
        .filter((e) => e.id !== sessionExerciseId)
        .map((e, index) => ({ ...e, order: index + 1 }));

      if (nextExercises.length === 0) {
        return {
          workoutSessions: state.workoutSessions.filter((s) => s.id !== sessionId),
        };
      }

      const now = new Date().toISOString();
      return {
        workoutSessions: state.workoutSessions.map((s) =>
          s.id === sessionId ? { ...s, exercises: nextExercises, updatedAt: now } : s,
        ),
      };
    }),

  updateActiveSessionSetReps: (sessionExerciseId, setId, reps) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;
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
      if (!state.activeWorkoutSession) return state;
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

  propagateActiveSessionSetWeightFromFirstSet: (sessionExerciseId, originalWeight, newWeight) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;
      if (newWeight == null) return state;
      if (originalWeight === newWeight) return state;

      const now = new Date().toISOString();
      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => {
              if (exercise.performedSets.length === 0) return exercise;
              const firstSet = exercise.performedSets[0];
              if (!firstSet || firstSet.weight !== newWeight) return exercise;

              const updatedPerformedSets = exercise.performedSets.map((set, index) => {
                if (index === 0) return set;
                if (set.weight === originalWeight || set.weight == null || set.weight === 0) {
                  return { ...set, weight: newWeight };
                }
                return set;
              });

              return { ...exercise, updatedAt: now, performedSets: updatedPerformedSets };
            },
          ),
        },
      };
    }),

  toggleActiveSessionSetCompleted: (sessionExerciseId, setId) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;
      const now = new Date().toISOString();

      const updatedExercises = updateActiveSessionExerciseInList(
        state.activeWorkoutSession.exercises,
        sessionExerciseId,
        (exercise) => {
          const updatedSets = exercise.performedSets.map((set) => {
            if (set.id !== setId) return set;
            const nextCompleted = !set.isCompleted;
            return { ...set, isCompleted: nextCompleted, completedAt: nextCompleted ? now : null };
          });
          const allSetsCompleted = updatedSets.length > 0 && updatedSets.every((s) => s.isCompleted);
          return { ...exercise, updatedAt: now, isCompleted: allSetsCompleted, performedSets: updatedSets };
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
      if (!state.activeWorkoutSession) return state;
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
              const previousSet = exercise.performedSets[exercise.performedSets.length - 1];
              return {
                ...exercise,
                updatedAt: now,
                performedSets: [
                  ...exercise.performedSets,
                  {
                    id: generateId(),
                    setNumber: nextSetNumber,
                    reps: previousSet?.previousReps ?? previousSet?.reps ?? null,
                    weight: previousSet?.previousWeight ?? previousSet?.weight ?? null,
                    rir: null,
                    durationSeconds: previousSet?.previousDurationSeconds ?? null,
                    previousReps: previousSet?.previousReps ?? previousSet?.reps ?? null,
                    previousWeight: previousSet?.previousWeight ?? previousSet?.weight ?? null,
                    previousDurationSeconds: previousSet?.previousDurationSeconds ?? null,
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
      if (!state.activeWorkoutSession) return state;

      const selectedVariant = state.exerciseVariants.find((v) => v.id === variantId);
      if (!selectedVariant || !selectedVariant.isActive) return state;

      const alreadyExists = state.activeWorkoutSession.exercises.some((e) => e.variantId === variantId);
      if (alreadyExists) return state;

      const now = new Date().toISOString();
      const nextOrder = state.activeWorkoutSession.exercises.length + 1;
      const latestSets = getLatestPerformanceForVariant(state.workoutSessions, state.workoutLogs, selectedVariant.id);

      const newSessionExercise = {
        id: generateId(),
        sessionId: state.activeWorkoutSession.id,
        exerciseId: selectedVariant.exerciseId,
        variantId: selectedVariant.id,
        order: nextOrder,
        trackingType: selectedVariant.trackingType,
        sourceRoutineExerciseRefId: undefined,
        prescription: { sets: 3, repRange: { min: 8, max: 12 }, targetRIR: 1, restSeconds: 90 },
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
          exercises: [...state.activeWorkoutSession.exercises, newSessionExercise],
        },
      };
    }),

  removeExerciseFromActiveWorkoutSession: (sessionExerciseId) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;

      const targetExists = state.activeWorkoutSession.exercises.some((e) => e.id === sessionExerciseId);
      if (!targetExists) return state;

      const now = new Date().toISOString();
      const nextExercises = state.activeWorkoutSession.exercises
        .filter((e) => e.id !== sessionExerciseId)
        .map((e, index) => ({ ...e, order: index + 1, updatedAt: now }));

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
      if (!state.activeWorkoutSession) return state;

      const targetExercise = state.activeWorkoutSession.exercises.find((e) => e.id === sessionExerciseId);
      if (!targetExercise) return state;

      const prescribedSetCount = targetExercise.prescription?.sets ?? 0;
      if (targetExercise.performedSets.length <= prescribedSetCount) return state;

      const now = new Date().toISOString();
      const nextPerformedSets = targetExercise.performedSets
        .slice(0, -1)
        .map((set, index) => ({ ...set, setNumber: index + 1 }));

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
              isCompleted: nextPerformedSets.length > 0 && nextPerformedSets.every((s) => s.isCompleted),
            }),
          ),
        },
      };
    }),

  updateActiveSessionExerciseNotes: (sessionExerciseId, notes) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;
      const now = new Date().toISOString();
      return {
        activeWorkoutSession: {
          ...state.activeWorkoutSession,
          updatedAt: now,
          exercises: updateActiveSessionExerciseInList(
            state.activeWorkoutSession.exercises,
            sessionExerciseId,
            (exercise) => ({ ...exercise, updatedAt: now, notes }),
          ),
        },
      };
    }),

  swapActiveSessionExerciseVariant: (sessionExerciseId, nextVariantId) =>
    set((state) => {
      if (!state.activeWorkoutSession) return state;

      const nextVariant = state.exerciseVariants.find((v) => v.id === nextVariantId);
      if (!nextVariant) return state;

      const targetExercise = state.activeWorkoutSession.exercises.find((e) => e.id === sessionExerciseId);
      if (!targetExercise) return state;
      if (targetExercise.variantId === nextVariantId) return state;
      if (targetExercise.exerciseId !== nextVariant.exerciseId) return state;

      const now = new Date().toISOString();
      const setCount = targetExercise.performedSets.length;
      const latestSets = getLatestPerformanceForVariant(state.workoutSessions, state.workoutLogs, nextVariantId);

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
              performedSets: createCompletedSetsFromLatest(setCount, latestSets),
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

  setPreferredWeightUnit: (unit) => set({ preferredWeightUnit: unit }),

  addExercise: (exercise) =>
    set((state) => ({ exercises: [...state.exercises, exercise] })),

  updateExercise: (updatedExercise) =>
    set((state) => ({
      exercises: state.exercises.map((e) => e.id === updatedExercise.id ? updatedExercise : e),
    })),

  addExerciseVariant: (variant) =>
    set((state) => ({ exerciseVariants: [...state.exerciseVariants, variant] })),

  updateExerciseVariant: (updatedVariant) =>
    set((state) => ({
      exerciseVariants: state.exerciseVariants.map((v) => v.id === updatedVariant.id ? updatedVariant : v),
    })),

  addRoutine: (routine) =>
    set((state) => ({ routines: [routine, ...state.routines] })),

  updateRoutine: (updatedRoutine) =>
    set((state) => ({
      routines: state.routines.map((r) => r.id === updatedRoutine.id ? updatedRoutine : r),
    })),

  deleteRoutine: (routineId) =>
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== routineId),
    })),

  moveRoutine: (fromIndex, toIndex) =>
    set((state) => {
      const total = state.routines.length;
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= total || toIndex >= total || fromIndex === toIndex) {
        return state;
      }
      return { routines: moveItem(state.routines, fromIndex, toIndex) };
    }),

  addExerciseRefToRoutine: (routineId, exerciseRef) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) return routine;
        return {
          ...routine,
          exerciseRefs: normalizeExerciseRefOrders([...routine.exerciseRefs, exerciseRef]),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  removeExerciseRefFromRoutine: (routineId, exerciseRefId) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) return routine;
        return {
          ...routine,
          exerciseRefs: normalizeExerciseRefOrders(routine.exerciseRefs.filter((ref) => ref.id !== exerciseRefId)),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  updateRoutineExerciseRef: (routineId, updatedExerciseRef) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) return routine;
        return {
          ...routine,
          exerciseRefs: normalizeExerciseRefOrders(
            routine.exerciseRefs.map((ref) => ref.id === updatedExerciseRef.id ? updatedExerciseRef : ref),
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  moveExerciseRefInRoutine: (routineId, fromIndex, toIndex) =>
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id !== routineId) return routine;
        const total = routine.exerciseRefs.length;
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= total || toIndex >= total || fromIndex === toIndex) {
          return routine;
        }
        const sortedExerciseRefs = [...routine.exerciseRefs].sort((a, b) => a.order - b.order);
        return {
          ...routine,
          exerciseRefs: normalizeExerciseRefOrders(moveItem(sortedExerciseRefs, fromIndex, toIndex)),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),
}));

// Persistencia local + sync a Supabase con debounce
let syncTimeout: ReturnType<typeof setTimeout> | null = null

useAppStore.subscribe((state) => {
  const appData = {
    exercises: state.exercises,
    exerciseVariants: state.exerciseVariants,
    routines: state.routines,
    workoutLogs: state.workoutLogs,
    workoutSessions: state.workoutSessions,
    activeWorkoutSession: state.activeWorkoutSession,
    preferredWeightUnit: state.preferredWeightUnit,
  }

  savePersistedAppData({ version: 2, data: appData })

  const userId = useAuthStore.getState().user?.id
  if (!userId) return

  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    pushDataToSupabase(userId, appData)
  }, 2000)
})