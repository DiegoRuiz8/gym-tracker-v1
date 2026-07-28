// src/store/seedData.ts

import type { Exercise } from "../types/exercise";
import type { WorkoutLog } from "../types/log";
import type { Routine } from "../types/routine";
import type { WorkoutSession } from "../types/session";
import type { WeightUnit } from "./persistence";
import { getLocalDateKey } from "../utils/format";

const now = new Date().toISOString();

export const seedExercises: Exercise[] = [
  {
    id: "ex-bench-barbell",
    name: "Bench Press - Barbell",
    category: "Push",
    primaryMuscle: "chest",
    secondaryMuscleGroups: ["triceps", "front-delts"],
    equipment: "barbell",
    gymLabel: "Flat bench",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-bench-smith",
    name: "Bench Press - Smith",
    category: "Push",
    primaryMuscle: "chest",
    secondaryMuscleGroups: ["triceps", "front-delts"],
    equipment: "smith",
    gymLabel: "Smith machine",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-incline-smith",
    name: "Incline Press - Smith",
    category: "Push",
    primaryMuscle: "chest",
    secondaryMuscleGroups: ["triceps", "front-delts"],
    equipment: "smith",
    gymLabel: "Incline smith",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-lateral-cable",
    name: "Lateral Raise - Cable",
    category: "Push",
    primaryMuscle: "shoulders",
    equipment: "cable",
    gymLabel: "Cable station",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-pushdown-rope",
    name: "Triceps Pushdown - Rope",
    category: "Push",
    primaryMuscle: "triceps",
    equipment: "cable",
    gymLabel: "High pulley rope",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-lat-pulldown-wide",
    name: "Lat Pulldown - Wide Grip",
    category: "Pull",
    primaryMuscle: "lats",
    secondaryMuscleGroups: ["back", "biceps"],
    equipment: "machine",
    gymLabel: "Lat pulldown machine",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ex-row-chest-supported",
    name: "Row - Chest Supported",
    category: "Pull",
    primaryMuscle: "back",
    secondaryMuscleGroups: ["lats", "biceps"],
    equipment: "machine",
    gymLabel: "Chest supported row",
    isActive: true,
    trackingType: "weight_reps",
    createdAt: now,
    updatedAt: now,
  },
];

export const seedRoutines: Routine[] = [
  {
    id: "routine-push-a",
    name: "Push A",
    dayType: "Push",
    description: "Heavy push day",
    createdAt: now,
    updatedAt: now,
    exerciseRefs: [
      {
        id: "ref-push-a-1",
        routineId: "routine-push-a",
        exerciseId: "ex-bench-barbell",
        order: 1,
        prescription: {
          sets: 4,
          repRange: { min: 6, max: 8 },
          targetRIR: 1,
          restSeconds: 180,
          notes: "Main compound",
        },
      },
      {
        id: "ref-push-a-2",
        routineId: "routine-push-a",
        exerciseId: "ex-incline-smith",
        order: 2,
        prescription: {
          sets: 3,
          repRange: { min: 8, max: 12 },
          targetRIR: 1,
          restSeconds: 120,
        },
      },
      {
        id: "ref-push-a-3",
        routineId: "routine-push-a",
        exerciseId: "ex-lateral-cable",
        order: 3,
        prescription: {
          sets: 3,
          repRange: { min: 12, max: 15 },
          targetRIR: 1,
          restSeconds: 60,
        },
      },
      {
        id: "ref-push-a-4",
        routineId: "routine-push-a",
        exerciseId: "ex-pushdown-rope",
        order: 4,
        prescription: {
          sets: 3,
          repRange: { min: 10, max: 15 },
          targetRIR: 1,
          restSeconds: 60,
        },
      },
    ],
  },
  {
    id: "routine-push-b",
    name: "Push B",
    dayType: "Push",
    description: "Secondary push day",
    createdAt: now,
    updatedAt: now,
    exerciseRefs: [
      {
        id: "ref-push-b-1",
        routineId: "routine-push-b",
        exerciseId: "ex-bench-barbell",
        order: 1,
        prescription: {
          sets: 3,
          repRange: { min: 8, max: 10 },
          targetRIR: 1,
          restSeconds: 150,
        },
      },
      {
        id: "ref-push-b-2",
        routineId: "routine-push-b",
        exerciseId: "ex-lateral-cable",
        order: 2,
        prescription: {
          sets: 4,
          repRange: { min: 12, max: 15 },
          targetRIR: 1,
          restSeconds: 60,
        },
      },
      {
        id: "ref-push-b-3",
        routineId: "routine-push-b",
        exerciseId: "ex-pushdown-rope",
        order: 3,
        prescription: {
          sets: 3,
          repRange: { min: 12, max: 15 },
          targetRIR: 1,
          restSeconds: 60,
        },
      },
    ],
  },
];

export const seedWorkoutLogs: WorkoutLog[] = [
  {
    id: "log-1",
    date: "2026-03-01",
    routineId: "routine-push-a",
    exerciseId: "ex-bench-barbell",
    performedSets: [
      { reps: 8, weight: 25, rir: 1 },
      { reps: 7, weight: 25, rir: 1 },
      { reps: 6, weight: 25, rir: 2 },
      { reps: 6, weight: 25, rir: 2 },
    ],
    notes: "Solid but hard",
    createdAt: now,
  },
  {
    id: "log-2",
    date: "2026-03-03",
    routineId: "routine-push-a",
    exerciseId: "ex-incline-smith",
    performedSets: [
      { reps: 12, weight: 20, rir: 1 },
      { reps: 11, weight: 20, rir: 1 },
      { reps: 10, weight: 20, rir: 2 },
    ],
    createdAt: now,
  },
  {
    id: "log-3",
    date: "2026-03-05",
    routineId: "routine-push-b",
    exerciseId: "ex-bench-barbell",
    performedSets: [
      { reps: 10, weight: 25, rir: 1 },
      { reps: 9, weight: 25, rir: 1 },
      { reps: 8, weight: 25, rir: 2 },
    ],
    notes: "Could probably push 26 next time",
    createdAt: now,
  },
  {
    id: "log-4",
    date: "2026-03-06",
    routineId: "routine-push-b",
    exerciseId: "ex-lateral-cable",
    performedSets: [
      { reps: 15, weight: 7.5, rir: 1 },
      { reps: 14, weight: 7.5, rir: 1 },
      { reps: 13, weight: 7.5, rir: 1 },
      { reps: 12, weight: 7.5, rir: 2 },
    ],
    createdAt: now,
  },
];

type DemoAppData = {
  exercises: Exercise[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  workoutSessions: WorkoutSession[];
  activeWorkoutSession: WorkoutSession | null;
  preferredWeightUnit: WeightUnit;
};

function getDemoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function createDemoSets(
  sessionId: string,
  count: number,
  weight: number,
  reps: number,
  completedAt: string,
) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${sessionId}-set-${index + 1}`,
    setNumber: index + 1,
    weight,
    reps: reps - (index === count - 1 ? 1 : 0),
    rir: index === count - 1 ? 1 : 2,
    previousWeight: weight - 2.5,
    previousReps: reps - 1,
    previousDurationSeconds: null,
    durationSeconds: null,
    completedAt,
    isCompleted: true,
  }));
}

export function getDemoAppData(): DemoAppData {
  const createdAt = getDemoDate(28);
  const upperRoutineId = "demo-routine-upper";
  const lowerRoutineId = "demo-routine-lower";
  const exercises: Exercise[] = [
    { id: "demo-bench", name: "Barbell Bench Press", category: "Upper", primaryMuscle: "chest", secondaryMuscleGroups: ["triceps", "shoulders"], equipment: "Barbell", gymLabel: "Flat bench", isActive: true, trackingType: "weight_reps", exerciseDbId: "Barbell_Bench_Press_-_Medium_Grip", exerciseDbLinkStatus: "manual", createdAt, updatedAt: createdAt },
    { id: "demo-row", name: "Seated Cable Row", category: "Upper", primaryMuscle: "back", secondaryMuscleGroups: ["biceps"], equipment: "Cable", gymLabel: "Cable station", isActive: true, trackingType: "weight_reps", exerciseDbId: "Seated_Cable_Rows", exerciseDbLinkStatus: "manual", createdAt, updatedAt: createdAt },
    { id: "demo-squat", name: "Back Squat", category: "Lower", primaryMuscle: "quads", secondaryMuscleGroups: ["glutes"], equipment: "Barbell", gymLabel: "Squat rack", isActive: true, trackingType: "weight_reps", exerciseDbId: "Barbell_Full_Squat", exerciseDbLinkStatus: "manual", createdAt, updatedAt: createdAt },
    { id: "demo-rdl", name: "Romanian Deadlift", category: "Lower", primaryMuscle: "hamstrings", secondaryMuscleGroups: ["glutes", "lower-back"], equipment: "Barbell", gymLabel: "Platform", isActive: true, trackingType: "weight_reps", exerciseDbId: "Romanian_Deadlift", exerciseDbLinkStatus: "manual", createdAt, updatedAt: createdAt },
  ];
  const routines: Routine[] = [
    {
      id: upperRoutineId,
      name: "Upper Strength",
      dayType: "Upper",
      description: "Press and pull strength focus.",
      createdAt,
      updatedAt: createdAt,
      exerciseRefs: [
        { id: "demo-upper-bench", routineId: upperRoutineId, exerciseId: "demo-bench", order: 1, prescription: { sets: 4, repRange: { min: 6, max: 8 }, targetRIR: 2, restSeconds: 150 } },
        { id: "demo-upper-row", routineId: upperRoutineId, exerciseId: "demo-row", order: 2, prescription: { sets: 3, repRange: { min: 8, max: 12 }, targetRIR: 2, restSeconds: 90 } },
      ],
    },
    {
      id: lowerRoutineId,
      name: "Lower Strength",
      dayType: "Lower",
      description: "Squat and hinge progression.",
      createdAt,
      updatedAt: createdAt,
      exerciseRefs: [
        { id: "demo-lower-squat", routineId: lowerRoutineId, exerciseId: "demo-squat", order: 1, prescription: { sets: 4, repRange: { min: 5, max: 8 }, targetRIR: 2, restSeconds: 180 } },
        { id: "demo-lower-rdl", routineId: lowerRoutineId, exerciseId: "demo-rdl", order: 2, prescription: { sets: 3, repRange: { min: 8, max: 10 }, targetRIR: 2, restSeconds: 120 } },
      ],
    },
  ];

  const createSession = (
    id: string,
    routineId: string,
    daysAgo: number,
    details: Array<{ exerciseId: string; sets: number; weight: number; reps: number }>,
  ): WorkoutSession => {
    const startedAt = getDemoDate(daysAgo);
    const endedAt = new Date(new Date(startedAt).getTime() + 55 * 60 * 1000).toISOString();
    return {
      id,
      date: getLocalDateKey(endedAt),
      routineId,
      startedAt,
      endedAt,
      status: "completed",
      notes: "Fictional demo workout — strong, consistent progress.",
      createdAt: startedAt,
      updatedAt: endedAt,
      exercises: details.map((detail, index) => ({
        id: `${id}-${detail.exerciseId}`,
        sessionId: id,
        exerciseId: detail.exerciseId,
        order: index + 1,
        trackingType: "weight_reps",
        performedSets: createDemoSets(`${id}-${detail.exerciseId}`, detail.sets, detail.weight, detail.reps, endedAt),
        isCompleted: true,
        createdAt: startedAt,
        updatedAt: endedAt,
      })),
    };
  };

  return {
    exercises,
    routines,
    workoutLogs: [],
    workoutSessions: [
      createSession("demo-upper-1", upperRoutineId, 12, [{ exerciseId: "demo-bench", sets: 4, weight: 57.5, reps: 7 }, { exerciseId: "demo-row", sets: 3, weight: 45, reps: 10 }]),
      createSession("demo-lower-1", lowerRoutineId, 7, [{ exerciseId: "demo-squat", sets: 4, weight: 75, reps: 6 }, { exerciseId: "demo-rdl", sets: 3, weight: 60, reps: 9 }]),
      createSession("demo-upper-2", upperRoutineId, 2, [{ exerciseId: "demo-bench", sets: 4, weight: 60, reps: 7 }, { exerciseId: "demo-row", sets: 3, weight: 47.5, reps: 10 }]),
    ],
    activeWorkoutSession: null,
    preferredWeightUnit: "kg",
  };
}
