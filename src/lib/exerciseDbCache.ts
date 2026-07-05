// src/lib/exerciseDbCache.ts
//
// Cache local del catalogo de free-exercise-db (yuhonas/free-exercise-db,
// dominio publico). A diferencia del intento anterior con oss.exercisedb.dev,
// esto NO es una API paginada — es un solo archivo JSON estatico con todo
// el catalogo, asi que no hay logica de cursor/paginacion que mantener.
//
// Vive separado de useAppStore / persistence.ts / syncService.ts: es un
// recurso estatico compartido, no datos del usuario.

const CATALOG_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const STORAGE_KEY = "gym-tracker-v1:exercisedb-catalog";
const CACHE_VERSION = 2;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export type ExerciseDbEntry = {
  id: string;
  name: string;
  category?: string;
  equipment?: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  // URLs completas, ya listas para usar en un <img src="...">
  images: string[];
};

type FreeExerciseDbApiItem = {
  id: string;
  name: string;
  category?: string;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
};

type CachedCatalog = {
  version: number;
  fetchedAt: string;
  exercises: ExerciseDbEntry[];
};

function normalizeApiItem(item: FreeExerciseDbApiItem): ExerciseDbEntry {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    equipment: item.equipment ?? null,
    primaryMuscles: item.primaryMuscles ?? [],
    secondaryMuscles: item.secondaryMuscles ?? [],
    instructions: item.instructions ?? [],
    images: (item.images ?? []).map(
      (imagePath) => `${IMAGE_BASE_URL}${imagePath}`,
    ),
  };
}

function loadCachedCatalog(): CachedCatalog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedCatalog>;
    if (
      parsed.version !== CACHE_VERSION ||
      !parsed.fetchedAt ||
      !Array.isArray(parsed.exercises)
    ) {
      return null;
    }

    return parsed as CachedCatalog;
  } catch (error) {
    console.error("Failed to load ExerciseDB cache from localStorage", error);
    return null;
  }
}

function saveCachedCatalog(exercises: ExerciseDbEntry[]): void {
  try {
    const payload: CachedCatalog = {
      version: CACHE_VERSION,
      fetchedAt: new Date().toISOString(),
      exercises,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save ExerciseDB cache to localStorage", error);
  }
}

function isCacheStale(cache: CachedCatalog): boolean {
  const fetchedAtMs = new Date(cache.fetchedAt).getTime();
  if (Number.isNaN(fetchedAtMs)) return true;
  return Date.now() - fetchedAtMs > CACHE_MAX_AGE_MS;
}

// Una sola llamada, trae los ~800 ejercicios completos. Sin paginacion,
// sin cursor, sin limites raros que adivinar.
async function fetchCatalogFromSource(): Promise<ExerciseDbEntry[]> {
  const response = await fetch(CATALOG_URL);

  if (!response.ok) {
    throw new Error(`free-exercise-db respondio ${response.status}`);
  }

  const data = (await response.json()) as FreeExerciseDbApiItem[];

  if (!Array.isArray(data)) {
    throw new Error("free-exercise-db no devolvio un array de ejercicios");
  }

  return data.map(normalizeApiItem);
}

export type ExerciseDbCatalogResult = {
  exercises: ExerciseDbEntry[];
  isStale: boolean;
  isFromCache: boolean;
};

// Punto de entrada principal. offline-first: si hay cache, lo devuelve de
// inmediato (aunque este vencido). Si esta vencido o no existe, intenta
// refrescar contra la red; si la red falla, se queda con lo que haya.
export async function getExerciseDbCatalog(): Promise<ExerciseDbCatalogResult> {
  const cached = loadCachedCatalog();
  const stale = cached ? isCacheStale(cached) : true;

  if (cached && !stale) {
    return { exercises: cached.exercises, isStale: false, isFromCache: true };
  }

  try {
    const fresh = await fetchCatalogFromSource();
    if (fresh.length > 0) {
      saveCachedCatalog(fresh);
      return { exercises: fresh, isStale: false, isFromCache: false };
    }
    throw new Error("free-exercise-db devolvio 0 ejercicios");
  } catch (error) {
    console.error(
      "No se pudo refrescar el catalogo de free-exercise-db",
      error,
    );

    if (cached) {
      return { exercises: cached.exercises, isStale: true, isFromCache: true };
    }

    return { exercises: [], isStale: true, isFromCache: false };
  }
}

export function clearExerciseDbCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear ExerciseDB cache", error);
  }
}


export function getImagesForExercise(
  exerciseDbId: string | null | undefined,
  catalog: ExerciseDbEntry[],
): string[] {
  if (!exerciseDbId) return [];
  const entry = catalog.find((item) => item.id === exerciseDbId);
  return entry?.images ?? [];
}