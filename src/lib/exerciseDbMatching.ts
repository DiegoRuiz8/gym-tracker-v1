// src/lib/exerciseDbMatching.ts
//
// Encuentra candidatos del catalogo de ExerciseDB (free-exercise-db) que
// probablemente correspondan a un Exercise local, basandose principalmente
// en similitud de nombre (incluyendo equipo, que SI importa para distinguir
// variantes como "Bench Press - Barbell" vs "- Dumbbell"), con musculos
// compartidos como desempate adicional.

import type { Exercise } from "../types/exercise";
import type { ExerciseDbEntry } from "./exerciseDbCache";

export type ExerciseDbCandidate = {
  entry: ExerciseDbEntry;
  score: number; // 0 a 1, mas alto = mas parecido
};

// Solo stopwords genericas sin significado -- el equipo (barbell, dumbbell,
// machine, etc.) se queda adentro del matching a proposito.
const NOISE_WORDS = new Set(["the", "a", "an", "with", "and", "or"]);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s]/g, " ") // guiones, parentesis, etc. -> espacio
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  return normalizeName(name)
    .split(" ")
    .filter((token) => token.length > 0 && !NOISE_WORDS.has(token));
}

// Distancia de Levenshtein simple, suficiente para nombres cortos de
// ejercicios (no necesitamos una libreria para esto).
function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitucion
          matrix[i][j - 1] + 1, // insercion
          matrix[i - 1][j] + 1, // eliminacion
        );
      }
    }
  }

  return matrix[rows - 1][cols - 1];
}

function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

// Compara dos nombres por tokens (bolsa de palabras) en vez de string
// completo: "Bench Press - Barbell, Gym A" vs "Barbell Bench Press" deben
// matchear alto aunque el orden de las palabras sea distinto.
function tokenOverlapScore(localTokens: string[], dbTokens: string[]): number {
  if (localTokens.length === 0 || dbTokens.length === 0) return 0;

  const dbSet = new Set(dbTokens);
  let matchedCount = 0;

  for (const token of localTokens) {
    if (dbSet.has(token)) {
      matchedCount += 1;
      continue;
    }
    // fuzzy: permite errores chicos de tipeo o variaciones (ej. "raise" vs "raises")
    const hasCloseMatch = dbTokens.some(
      (dbToken) => stringSimilarity(token, dbToken) >= 0.8,
    );
    if (hasCloseMatch) matchedCount += 0.7;
  }

  const unionSize = new Set([...localTokens, ...dbTokens]).size;
  return matchedCount / unionSize;
}

function muscleOverlapBonus(
  localExercise: Exercise,
  entry: ExerciseDbEntry,
): number {
  const localMuscles = [
  localExercise.primaryMuscle,
  ...(localExercise.secondaryMuscleGroups ?? []),
]
  .filter((m): m is string => Boolean(m))
  .map((m) => m.toLowerCase());
  if (localMuscles.length === 0) return 0;

  const dbMuscles = [...entry.primaryMuscles, ...entry.secondaryMuscles].map(
    (m) => m.toLowerCase(),
  );

  const overlap = localMuscles.filter((m) =>
    dbMuscles.some((dbM) => dbM.includes(m) || m.includes(dbM)),
  ).length;

  // bonus chico, nunca decide el match por si solo
  return Math.min(overlap * 0.05, 0.15);
}

export function findExerciseDbCandidates(
  localExercise: Exercise,
  catalog: ExerciseDbEntry[],
  maxResults: number = 5,
): ExerciseDbCandidate[] {
  const localTokens = tokenize(localExercise.name);

  const scored: ExerciseDbCandidate[] = catalog.map((entry) => {
    const dbTokens = tokenize(entry.name);
    const baseScore = tokenOverlapScore(localTokens, dbTokens);
    const bonus = muscleOverlapBonus(localExercise, entry);

    return {
      entry,
      score: Math.min(baseScore + bonus, 1),
    };
  });

  return scored
    .filter((candidate) => candidate.score > 0.2) // descarta ruido obvio
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// Atajo para la UI: ¿hay un candidato lo bastante bueno como para
// sugerirlo automaticamente sin que el usuario tenga que buscar?
export function getBestAutoSuggestion(
  candidates: ExerciseDbCandidate[],
): ExerciseDbCandidate | null {
  const [best] = candidates;
  if (!best) return null;
  return best.score >= 0.6 ? best : null;
}

// Busqueda libre por texto, para cuando ninguna sugerencia automatica
// convence y el usuario quiere escribir directamente.
export function searchExerciseDbByText(
  query: string,
  catalog: ExerciseDbEntry[],
  maxResults: number = 8,
): ExerciseDbEntry[] {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return [];

  return catalog
    .filter((entry) => normalizeName(entry.name).includes(normalizedQuery))
    .slice(0, maxResults);
}