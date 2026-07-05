// src/utils/primaryMuscles.ts
//
// Lista fija de músculos primarios usada en el select de NewExercisePage
// y EditExercisePage. Tener una lista cerrada evita inconsistencias de texto
// libre (ej. "chest" vs "pecho" vs "pectorals") y permite que el swap por
// músculo principal sea confiable.
//
// "other" existe para cardio, mobility, warm-ups, o cualquier ejercicio que
// no encaje en un grupo muscular específico. Estos no participan en swap
// (dos ejercicios "other" no se consideran de músculo compartido).

export const PRIMARY_MUSCLE_OPTIONS = [
  "abs",
  "adductors",
  "abductors",
  "back",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower-back",
  "obliques",
  "quads",
  "rear-delts",
  "shoulders",
  "traps",
  "triceps",
  "other",
] as const;

export type PrimaryMuscle = (typeof PRIMARY_MUSCLE_OPTIONS)[number];

const EXERCISE_DB_MUSCLE_MAP: Record<string, PrimaryMuscle> = {
  abdominals: "abs",
  abs: "abs",
  adductors: "adductors",
  abductors: "abductors",
  back: "back",
  "middle back": "back",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "lats",
  "lower back": "lower-back",
  "lower-back": "lower-back",
  obliques: "obliques",
  quadriceps: "quads",
  quads: "quads",
  "rear delts": "rear-delts",
  "rear-delts": "rear-delts",
  shoulders: "shoulders",
  traps: "traps",
  triceps: "triceps",
};

export function normalizeExerciseDbMuscle(
  muscle: string,
): PrimaryMuscle | undefined {
  return EXERCISE_DB_MUSCLE_MAP[muscle.toLowerCase().trim()];
}