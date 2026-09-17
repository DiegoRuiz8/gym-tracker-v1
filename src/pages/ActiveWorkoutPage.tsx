// src/pages/ActiveWorkoutPage.tsx

import { Navigate, useNavigate } from "react-router-dom";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseDbCatalog,
  getImagesForExercise,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import ExercisePhotoToggle from "../components/exercise/ExercisePhotoToggle";
import { generateId } from "../utils/ids";
import "../styles/active-workout.css";
import type { Exercise } from "../types/exercise";
import type { RestTimer, WorkoutSessionExercise } from "../types/session";

function formatPrescriptionLabel(
  sets: number,
  repMin?: number,
  repMax?: number,
  targetRir?: number | null,
  restSeconds?: number | null,
) {
  const parts: string[] = [];

  if (repMin != null && repMax != null) {
    parts.push(`Target: ${sets} x ${repMin}-${repMax}`);
  } else {
    parts.push(`${sets} sets`);
  }

  if (targetRir != null) {
    parts.push(`RIR ${targetRir}`);
  }

  if (restSeconds != null) {
    parts.push(`Rest ${restSeconds}s`);
  }

  return parts.join(" · ");
}

function formatElapsedTime(startedAt: string, nowMs: number) {
  const startedMs = new Date(startedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatRestTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type NextPendingSet = {
  sessionExerciseId: string;
  setId: string;
};

function getNextPendingSet(
  sessionExercises: WorkoutSessionExercise[],
  restTimer: RestTimer,
): NextPendingSet | null {
  const orderedExercises = [...sessionExercises].sort(
    (a, b) => a.order - b.order,
  );
  const sourceIndex = orderedExercises.findIndex(
    (exercise) => exercise.id === restTimer.sourceSessionExerciseId,
  );

  if (sourceIndex === -1) return null;

  const sourceExercise = orderedExercises[sourceIndex];
  const nextSourceSet = sourceExercise.performedSets.find(
    (set) => !set.isCompleted,
  );
  if (nextSourceSet) {
    return {
      sessionExerciseId: sourceExercise.id,
      setId: nextSourceSet.id,
    };
  }

  const nextExercise = orderedExercises
    .slice(sourceIndex + 1)
    .find((exercise) => exercise.performedSets.some((set) => !set.isCompleted));

  const nextSet = nextExercise?.performedSets.find((set) => !set.isCompleted);
  if (!nextExercise || !nextSet) return null;

  return {
    sessionExerciseId: nextExercise.id,
    setId: nextSet.id,
  };
}

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();

  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );
  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);

  const updateActiveSessionSetWeight = useAppStore(
    (state) => state.updateActiveSessionSetWeight,
  );
  const propagateActiveSessionSetWeightFromFirstSet = useAppStore(
    (state) => state.propagateActiveSessionSetWeightFromFirstSet,
  );
  const updateActiveSessionSetReps = useAppStore(
    (state) => state.updateActiveSessionSetReps,
  );
  const toggleActiveSessionSetCompleted = useAppStore(
    (state) => state.toggleActiveSessionSetCompleted,
  );
  const extendActiveSessionRestTimer = useAppStore(
    (state) => state.extendActiveSessionRestTimer,
  );
  const finishActiveSessionRestTimer = useAppStore(
    (state) => state.finishActiveSessionRestTimer,
  );
  const addActiveSessionExerciseSet = useAppStore(
    (state) => state.addActiveSessionExerciseSet,
  );
  const removeLastActiveSessionExerciseSet = useAppStore(
    (state) => state.removeLastActiveSessionExerciseSet,
  );
  const removeExerciseFromActiveWorkoutSession = useAppStore(
    (state) => state.removeExerciseFromActiveWorkoutSession,
  );
  const addExercise = useAppStore((state) => state.addExercise);
  const updateExercise = useAppStore((state) => state.updateExercise);
  const completeActiveWorkoutSession = useAppStore(
    (state) => state.completeActiveWorkoutSession,
  );
  const cancelActiveWorkoutSession = useAppStore(
    (state) => state.cancelActiveWorkoutSession,
  );
  const swapActiveSessionExercise = useAppStore(
    (state) => state.swapActiveSessionExercise,
  );
  const addExerciseToActiveWorkoutSession = useAppStore(
    (state) => state.addExerciseToActiveWorkoutSession,
  );
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [swapOpen, setSwapOpen] = useState<Record<string, boolean>>({});
  const [swapSearch, setSwapSearch] = useState<Record<string, string>>({});
  const [variantFormOpen, setVariantFormOpen] = useState<Record<string, boolean>>({});
  const [variantName, setVariantName] = useState<Record<string, string>>({});
  const [variantError, setVariantError] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<
    Record<string, boolean>
  >({});
  const [firstSetWeightBeforeEdit, setFirstSetWeightBeforeEdit] = useState<
    Record<string, number | null>
  >({});
  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);
  const [swapExpanded, setSwapExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const elapsedLabel = useMemo(() => {
    if (!activeWorkoutSession) {
      return "0s";
    }

    return formatElapsedTime(activeWorkoutSession.startedAt, nowMs);
  }, [activeWorkoutSession, nowMs]);

  const restTimer = activeWorkoutSession?.restTimer ?? null;
  const remainingRestSeconds =
    restTimer?.status === "running"
      ? Math.max(
          0,
          Math.ceil(
            (new Date(restTimer.startedAt).getTime() +
              restTimer.durationSeconds * 1000 -
              nowMs) /
              1000,
          ),
        )
      : 0;

  useEffect(() => {
    if (!restTimer || restTimer.status !== "running") return;

    const remainingMs = Math.max(
      0,
      new Date(restTimer.startedAt).getTime() +
        restTimer.durationSeconds * 1000 -
        Date.now(),
    );
    const timeout = window.setTimeout(
      finishActiveSessionRestTimer,
      remainingMs,
    );

    return () => window.clearTimeout(timeout);
  }, [finishActiveSessionRestTimer, restTimer]);

  if (!activeWorkoutSession) {
    return <Navigate to="/routines" replace />;
  }

  const routine = routines.find(
    (item) => item.id === activeWorkoutSession.routineId,
  );
  const nextPendingSet =
    restTimer?.status === "finished"
      ? getNextPendingSet(activeWorkoutSession.exercises, restTimer)
      : null;
  const restProgress = restTimer
    ? Math.max(
        0,
        Math.min(
          100,
          (remainingRestSeconds / restTimer.durationSeconds) * 100,
        ),
      )
    : 0;

  // Ejercicios elegibles para agregar (o intercambiar): activos y que todavia
  // no esten en la sesion. Reusado tanto por el panel "Add exercise" como por
  // cada panel de swap individual.
  const availableExercisesToAdd = exercises.filter((exercise) => {
    const alreadyInSession = activeWorkoutSession.exercises.some(
      (sessionExercise) => sessionExercise.exerciseId === exercise.id,
    );

    return exercise.isActive && !alreadyInSession;
  });

  function filterExercisesBySearch(search: string) {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableExercisesToAdd;
    }

    return availableExercisesToAdd.filter((exercise) => {
      const name = exercise.name.toLowerCase();
      const equipment = exercise.equipment?.toLowerCase() ?? "";
      const gymLabel = exercise.gymLabel?.toLowerCase() ?? "";

      return (
        name.includes(normalizedSearch) ||
        equipment.includes(normalizedSearch) ||
        gymLabel.includes(normalizedSearch)
      );
    });
  }

  const filteredExercisesToAdd = filterExercisesBySearch(exerciseSearch);

  function formatPreviousSetLabel(
    set: {
      previousWeight?: number | null;
      previousReps?: number | null;
      previousDurationSeconds?: number | null;
    },
    preferredWeightUnit: "kg" | "lb",
  ): string {
    const previousWeight = convertWeightFromKg(
      set.previousWeight,
      preferredWeightUnit,
    );

    const hasWeight = previousWeight != null;
    const hasReps = set.previousReps != null;
    const hasDuration = set.previousDurationSeconds != null;

    if (hasWeight && hasReps) {
      return `${previousWeight} ${preferredWeightUnit} × ${set.previousReps}`;
    }

    if (hasWeight) {
      return `${previousWeight} ${preferredWeightUnit}`;
    }

    if (hasReps) {
      return `${set.previousReps} reps`;
    }

    if (hasDuration) {
      const totalSeconds = set.previousDurationSeconds ?? 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      }

      return `${seconds}s`;
    }

    return "—";
  }

  const KG_TO_LB = 2.2046226218;

  function roundDisplayWeight(value: number): number {
    return Math.round(value * 10) / 10;
  }

  function convertWeightFromKg(
    weightKg: number | null | undefined,
    preferredWeightUnit: "kg" | "lb",
  ): number | null {
    if (weightKg == null) {
      return null;
    }

    if (preferredWeightUnit === "lb") {
      return roundDisplayWeight(weightKg * KG_TO_LB);
    }

    return roundDisplayWeight(weightKg);
  }

  function convertWeightToKg(
    displayWeight: number | null,
    preferredWeightUnit: "kg" | "lb",
  ): number | null {
    if (displayWeight == null) {
      return null;
    }

    if (preferredWeightUnit === "lb") {
      return displayWeight / KG_TO_LB;
    }

    return displayWeight;
  }

  function formatDisplayWeightValue(
    weightKg: number | null | undefined,
    preferredWeightUnit: "kg" | "lb",
  ): string {
    const converted = convertWeightFromKg(weightKg, preferredWeightUnit);

    if (converted == null) {
      return "";
    }

    return Number.isInteger(converted) ? String(converted) : String(converted);
  }

  function formatWeightUnitLabel(unit: "kg" | "lb") {
    return unit.toUpperCase();
  }

  const completedExercisesCount = activeWorkoutSession.exercises.filter(
    (exercise) => exercise.isCompleted,
  ).length;

  const totalExercisesCount = activeWorkoutSession.exercises.length;
  const incompleteExercisesCount =
    totalExercisesCount - completedExercisesCount;

  const exercisesWithIncompleteSetsCount =
    activeWorkoutSession.exercises.filter((exercise) => {
      const hasAnyIncompleteSet = exercise.performedSets.some(
        (set) => !set.isCompleted,
      );

      return hasAnyIncompleteSet;
    }).length;

  function handleRequestDeleteExercise(sessionExerciseId: string) {
    setDeleteConfirmOpen((prev) => ({
      ...prev,
      [sessionExerciseId]: true,
    }));
  }

  function handleCancelDeleteExercise(sessionExerciseId: string) {
    setDeleteConfirmOpen((prev) => ({
      ...prev,
      [sessionExerciseId]: false,
    }));
  }

  function handleConfirmDeleteExercise(sessionExerciseId: string) {
    removeExerciseFromActiveWorkoutSession(sessionExerciseId);

    setDeleteConfirmOpen((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setNotesOpen((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setSwapOpen((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setSwapSearch((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setSwapExpanded((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setVariantFormOpen((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setVariantName((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    setVariantError((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });
  }

  function handleToggleSwap(sessionExerciseId: string) {
    setSwapOpen((prev) => ({
      ...prev,
      [sessionExerciseId]: !prev[sessionExerciseId],
    }));
    // Al cerrar el swap, resetear también el estado expanded
    setSwapExpanded((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });
    setVariantFormOpen((prev) => ({ ...prev, [sessionExerciseId]: false }));
    setVariantName((prev) => ({ ...prev, [sessionExerciseId]: "" }));
    setVariantError((prev) => ({ ...prev, [sessionExerciseId]: "" }));
  }

  function handleCreateVariant(
    sessionExerciseId: string,
    sourceExercise: Exercise,
  ) {
    const name = (variantName[sessionExerciseId] ?? "").trim();

    if (!name) {
      setVariantError((prev) => ({
        ...prev,
        [sessionExerciseId]: "Give the new variant a name.",
      }));
      return;
    }

    const existingExercise = exercises.find(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (existingExercise) {
      setVariantError((prev) => ({
        ...prev,
        [sessionExerciseId]: "An exercise with this name already exists. Select it above instead.",
      }));
      return;
    }

    const now = new Date().toISOString();
    const newVariant: Exercise = {
      id: generateId(),
      name,
      category: sourceExercise.category,
      primaryMuscle: sourceExercise.primaryMuscle,
      secondaryMuscleGroups: sourceExercise.secondaryMuscleGroups,
      equipment: sourceExercise.equipment,
      gymLabel: sourceExercise.gymLabel,
      notes: undefined,
      isActive: true,
      trackingType: sourceExercise.trackingType,
      createdAt: now,
      updatedAt: now,
    };

    addExercise(newVariant);
    handleSelectSwapExercise(sessionExerciseId, newVariant.id);
    setVariantFormOpen((prev) => ({ ...prev, [sessionExerciseId]: false }));
    setVariantName((prev) => ({ ...prev, [sessionExerciseId]: "" }));
    setVariantError((prev) => ({ ...prev, [sessionExerciseId]: "" }));
  }

  function handleSelectSwapExercise(
    sessionExerciseId: string,
    nextExerciseId: string,
  ) {
    swapActiveSessionExercise(sessionExerciseId, nextExerciseId);

    setSwapOpen((prev) => ({ ...prev, [sessionExerciseId]: false }));
    setSwapSearch((prev) => ({ ...prev, [sessionExerciseId]: "" }));
    setSwapExpanded((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });
  }

  function hasSharedMuscle(a: Exercise, b: Exercise): boolean {
    const aPrimary = a.primaryMuscle?.toLowerCase();
    const bPrimary = b.primaryMuscle?.toLowerCase();

    if (!aPrimary || !bPrimary) return false;

    return aPrimary === bPrimary;
  }
  return (
    <div className="active-workout-page">
      <header className="active-workout-header">
        <div className="active-workout-header-inner active-workout-header-compact">
          <button
            type="button"
            className="active-workout-back-btn"
            aria-label="Go back"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }

              navigate("/routines", { replace: true });
            }}
          >
            ←
          </button>

          <div className="active-workout-header-main">
            <h1 className="active-workout-title">
              {routine?.name ?? "Active Workout"}
            </h1>
            <p className="active-workout-timer">{elapsedLabel}</p>
          </div>

          <button
            type="button"
            className="button-primary active-workout-finish-btn"
            onClick={() => setShowFinishConfirm(true)}
          >
            Finish
          </button>
        </div>
      </header>

      <main className="active-workout-container">
        <section className="active-workout-list">
          {activeWorkoutSession.exercises.length === 0 ? (
            <div className="surface-card active-workout-empty">
              No exercises in this session.
            </div>
          ) : (
            activeWorkoutSession.exercises.map((sessionExercise) => {
              const exercise = exercises.find(
                (item) => item.id === sessionExercise.exerciseId,
              );

              const prescription = sessionExercise.prescription;
              const prescribedSetCount = prescription?.sets ?? 0;
              const canRemoveLastSet =
                sessionExercise.performedSets.length > prescribedSetCount;

              const isNotesOpen =
                notesOpen[sessionExercise.id] ||
                Boolean(exercise?.notes?.trim()) ||
                Boolean(sessionExercise.notes?.trim());

              const isSwapOpen = Boolean(swapOpen[sessionExercise.id]);
              const isVariantFormOpen = Boolean(
                variantFormOpen[sessionExercise.id],
              );
              const currentSwapSearch = swapSearch[sessionExercise.id] ?? "";
              const unsortedSwapResults =
                filterExercisesBySearch(currentSwapSearch);
              const swapResults = exercise
                ? [...unsortedSwapResults].sort((a, b) => {
                    const aShares = hasSharedMuscle(exercise, a) ? 0 : 1;
                    const bShares = hasSharedMuscle(exercise, b) ? 0 : 1;
                    return aShares - bShares;
                  })
                : unsortedSwapResults;

              return (
                <Fragment key={sessionExercise.id}>
                  <article className="surface-card active-workout-card">
                  <button
                    type="button"
                    className="active-workout-card-delete-badge"
                    aria-label="Remove exercise"
                    title="Remove exercise"
                    onClick={() =>
                      handleRequestDeleteExercise(sessionExercise.id)
                    }
                  >
                    ✕
                  </button>
                  <div className="active-workout-card-inner">
                    <div className="active-workout-card-top">
                      <div className="active-workout-card-heading-row">
                        <div className="active-workout-card-heading-main">
                          <div className="active-workout-title-row">
                            <h2 className="active-workout-exercise-title">
                              {exercise?.name ?? "Unknown exercise"}
                            </h2>

                            <button
                              type="button"
                              className="active-workout-swap-btn"
                              onClick={() =>
                                handleToggleSwap(sessionExercise.id)
                              }
                              aria-label={`Swap exercise for ${
                                exercise?.name ?? "exercise"
                              }`}
                              aria-expanded={isSwapOpen}
                              title="Swap exercise"
                            >
                              ⇄
                            </button>
                          </div>

                          <p className="active-workout-prescription">
                            {formatPrescriptionLabel(
                              prescription?.sets ??
                                sessionExercise.performedSets.length,
                              prescription?.repRange?.min,
                              prescription?.repRange?.max,
                              prescription?.targetRIR,
                              prescription?.restSeconds,
                            )}
                          </p>

                          <button
                            type="button"
                            className="active-workout-notes-toggle"
                            onClick={() =>
                              setNotesOpen((prev) => ({
                                ...prev,
                                [sessionExercise.id]: !prev[sessionExercise.id],
                              }))
                            }
                          >
                            {isNotesOpen
                              ? "Hide exercise notes"
                              : exercise?.notes?.trim()
                                ? "Show exercise notes"
                                : "Add exercise notes"}
                          </button>
                        </div>

                        <div className="active-workout-exercise-photo-wrap">
                          <ExercisePhotoToggle
                            images={getImagesForExercise(
                              exercise?.exerciseDbId,
                              catalog,
                            )}
                            alt={exercise?.name ?? "Unknown exercise"}
                            mode="compact"
                          />
                        </div>
                      </div>

                      {deleteConfirmOpen[sessionExercise.id] ? (
                        <div className="active-workout-delete-confirm">
                          <p className="active-workout-delete-text">
                            Remove exercise?
                          </p>
                          <p className="active-workout-delete-subtext">
                            This exercise will be removed from the active
                            session.
                          </p>

                          <div className="active-workout-delete-actions">
                            <button
                              type="button"
                              className="active-workout-btn active-workout-btn-danger"
                              onClick={() =>
                                handleConfirmDeleteExercise(sessionExercise.id)
                              }
                            >
                              Remove
                            </button>

                            <button
                              type="button"
                              className="active-workout-btn active-workout-btn-secondary"
                              onClick={() =>
                                handleCancelDeleteExercise(sessionExercise.id)
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {isSwapOpen
                        ? (() => {
                            // Cuando NO hay búsqueda: solo mostrar Same muscle + botón "Show all".
                            // Cuando SÍ hay búsqueda: mostrar todos los resultados filtrados
                            // (con Same muscle arriba, ya viene ordenado desde swapResults).
                            const isSearching =
                              currentSwapSearch.trim().length > 0;
                            const isExpanded = Boolean(
                              swapExpanded[sessionExercise.id],
                            );

                            const sameMuscleResults = exercise
                              ? swapResults.filter((item) =>
                                  hasSharedMuscle(exercise, item),
                                )
                              : [];
                            const otherResults = exercise
                              ? swapResults.filter(
                                  (item) => !hasSharedMuscle(exercise, item),
                                )
                              : swapResults;

                            // Sin búsqueda: default a mostrar solo same muscle, con opción de expandir.
                            // Con búsqueda: mostrar todos los que matchean (same muscle primero).
                            const visibleResults = isSearching
                              ? swapResults
                              : isExpanded
                                ? swapResults
                                : sameMuscleResults;

                            const hasHiddenOthers =
                              !isSearching &&
                              !isExpanded &&
                              otherResults.length > 0;

                            return (
                              <div className="active-workout-swap-panel">
                                <p className="active-workout-swap-label">
                                  Swap for today
                                </p>

                                <div className="active-workout-add-exercise-input-wrap">
                                  <input
                                    className="input active-workout-add-exercise-input"
                                    type="text"
                                    placeholder="Search exercise"
                                    value={currentSwapSearch}
                                    onChange={(event) =>
                                      setSwapSearch((prev) => ({
                                        ...prev,
                                        [sessionExercise.id]:
                                          event.target.value,
                                      }))
                                    }
                                  />

                                  {currentSwapSearch.trim() ? (
                                    <button
                                      type="button"
                                      className="active-workout-add-exercise-clear-btn"
                                      aria-label="Clear search"
                                      onClick={() =>
                                        setSwapSearch((prev) => ({
                                          ...prev,
                                          [sessionExercise.id]: "",
                                        }))
                                      }
                                    >
                                      ×
                                    </button>
                                  ) : null}
                                </div>

                                {visibleResults.length > 0 ? (
                                  <div className="active-workout-swap-results-scroll">
                                    <div className="active-workout-add-exercise-results">
                                      {visibleResults
                                        .slice(0, 20)
                                        .map((item) => {
                                          const sharesMuscle = exercise
                                            ? hasSharedMuscle(exercise, item)
                                            : false;

                                          return (
                                            <button
                                              key={item.id}
                                              type="button"
                                              className="active-workout-add-exercise-result"
                                              onClick={() =>
                                                handleSelectSwapExercise(
                                                  sessionExercise.id,
                                                  item.id,
                                                )
                                              }
                                            >
                                              <span>{item.name}</span>
                                              {sharesMuscle && (
                                                <span className="active-workout-swap-same-muscle-tag">
                                                  Same muscle
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="active-workout-add-exercise-empty">
                                    {isSearching
                                      ? "No available exercises match your search."
                                      : "No exercises with the same primary muscle. Show all to browse other options."}
                                  </p>
                                )}

                                {hasHiddenOthers ? (
                                  <button
                                    type="button"
                                    className="active-workout-swap-show-all-btn"
                                    onClick={() =>
                                      setSwapExpanded((prev) => ({
                                        ...prev,
                                        [sessionExercise.id]: true,
                                      }))
                                    }
                                  >
                                    Show all exercises ({otherResults.length}{" "}
                                    more)
                                  </button>
                                ) : null}

                                {!isSearching && isExpanded ? (
                                  <button
                                    type="button"
                                    className="active-workout-swap-show-all-btn"
                                    onClick={() =>
                                      setSwapExpanded((prev) => ({
                                        ...prev,
                                        [sessionExercise.id]: false,
                                      }))
                                    }
                                  >
                                    Show only same muscle
                                  </button>
                                ) : null}

                                {exercise ? (
                                  <div className="active-workout-variant-create">
                                    <button
                                      type="button"
                                      className="active-workout-swap-show-all-btn"
                                      aria-expanded={isVariantFormOpen}
                                      onClick={() => {
                                        setVariantFormOpen((prev) => ({
                                          ...prev,
                                          [sessionExercise.id]: !prev[sessionExercise.id],
                                        }));
                                        setVariantError((prev) => ({
                                          ...prev,
                                          [sessionExercise.id]: "",
                                        }));
                                      }}
                                    >
                                      + Create a new variant
                                    </button>

                                    {isVariantFormOpen ? (
                                      <div className="active-workout-variant-form">
                                        <label
                                          className="active-workout-add-exercise-label"
                                          htmlFor={`variant-name-${sessionExercise.id}`}
                                        >
                                          Variant name
                                        </label>
                                        <input
                                          id={`variant-name-${sessionExercise.id}`}
                                          className="input active-workout-add-exercise-input"
                                          type="text"
                                          placeholder={`e.g. ${exercise.name} - machine`}
                                          value={variantName[sessionExercise.id] ?? ""}
                                          onChange={(event) => {
                                            setVariantName((prev) => ({
                                              ...prev,
                                              [sessionExercise.id]: event.target.value,
                                            }));
                                            setVariantError((prev) => ({
                                              ...prev,
                                              [sessionExercise.id]: "",
                                            }));
                                          }}
                                        />
                                        <p className="active-workout-variant-help">
                                          It will inherit this exercise’s setup and muscle data.
                                        </p>
                                        {variantError[sessionExercise.id] ? (
                                          <p className="active-workout-variant-error" role="alert">
                                            {variantError[sessionExercise.id]}
                                          </p>
                                        ) : null}
                                        <div className="active-workout-variant-actions">
                                          <button
                                            type="button"
                                            className="button-primary"
                                            onClick={() =>
                                              handleCreateVariant(
                                                sessionExercise.id,
                                                exercise,
                                              )
                                            }
                                          >
                                            Create and swap
                                          </button>
                                          <button
                                            type="button"
                                            className="button-secondary"
                                            onClick={() =>
                                              setVariantFormOpen((prev) => ({
                                                ...prev,
                                                [sessionExercise.id]: false,
                                              }))
                                            }
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()
                        : null}

                      {isNotesOpen ? (
                        <div className="active-workout-notes">
                          <textarea
                            className="textarea"
                            placeholder="Cues for next time..."
                            value={exercise?.notes ?? sessionExercise.notes ?? ""}
                            aria-label={`Persistent notes for ${
                              exercise?.name ?? "this exercise"
                            }`}
                            onChange={(e) => {
                              if (exercise) {
                                updateExercise({
                                  ...exercise,
                                  notes: e.target.value || undefined,
                                  updatedAt: new Date().toISOString(),
                                });
                              }

                              e.target.style.height = "42px";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onInput={(e) => {
                              const target = e.currentTarget;
                              target.style.height = "42px";
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="active-workout-table-wrap">
                      <table className="active-workout-table">
                        <colgroup>
                          <col className="active-workout-col-set" />
                          <col className="active-workout-col-previous" />
                          <col className="active-workout-col-weight" />
                          <col className="active-workout-col-reps" />
                          <col className="active-workout-col-check" />
                        </colgroup>

                        <thead>
                          <tr>
                            <th>Set</th>
                            <th>Previous</th>
                            <th>
                              {formatWeightUnitLabel(preferredWeightUnit)}
                            </th>
                            <th>Reps</th>
                            <th
                              className="active-workout-check-header"
                              aria-label="Completed"
                            >
                              <span aria-hidden="true">✓</span>
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {sessionExercise.performedSets.map(
                            (set, setIndex) => (
                              <Fragment key={set.id}>
                              <tr
                                className={
                                  `active-workout-set-row${
                                    set.isCompleted ? " is-completed" : ""
                                  }${
                                    nextPendingSet?.setId === set.id
                                      ? " is-next-up"
                                      : ""
                                  }`
                                }
                              >
                                <td className="active-workout-set-number">
                                  {set.setNumber}
                                </td>

                                <td className="active-workout-previous-cell">
                                  {formatPreviousSetLabel(
                                    set,
                                    preferredWeightUnit,
                                  )}
                                </td>

                                <td className="active-workout-cell-input">
                                  <input
                                    className="input"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={formatDisplayWeightValue(
                                      set.weight,
                                      preferredWeightUnit,
                                    )}
                                    onFocus={() => {
                                      if (setIndex !== 0) {
                                        return;
                                      }

                                      setFirstSetWeightBeforeEdit((prev) => ({
                                        ...prev,
                                        [sessionExercise.id]:
                                          set.weight ?? null,
                                      }));
                                    }}
                                    onChange={(e) =>
                                      updateActiveSessionSetWeight(
                                        sessionExercise.id,
                                        set.id,
                                        e.target.value === ""
                                          ? null
                                          : convertWeightToKg(
                                              Number(e.target.value),
                                              preferredWeightUnit,
                                            ),
                                      )
                                    }
                                    onBlur={(e) => {
                                      if (setIndex !== 0) {
                                        return;
                                      }

                                      const originalWeight =
                                        firstSetWeightBeforeEdit[
                                          sessionExercise.id
                                        ] ?? null;

                                      const finalWeight =
                                        e.target.value === ""
                                          ? null
                                          : convertWeightToKg(
                                              Number(e.target.value),
                                              preferredWeightUnit,
                                            );

                                      propagateActiveSessionSetWeightFromFirstSet(
                                        sessionExercise.id,
                                        originalWeight,
                                        finalWeight,
                                      );

                                      setFirstSetWeightBeforeEdit((prev) => {
                                        const next = { ...prev };
                                        delete next[sessionExercise.id];
                                        return next;
                                      });
                                    }}
                                  />
                                </td>

                                <td className="active-workout-cell-input">
                                  <input
                                    className="input"
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={set.reps ?? ""}
                                    onChange={(e) =>
                                      updateActiveSessionSetReps(
                                        sessionExercise.id,
                                        set.id,
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                      )
                                    }
                                  />
                                </td>

                                <td className="active-workout-check-cell">
                                  <button
                                    type="button"
                                    aria-label={
                                      set.isCompleted
                                        ? "Mark set as incomplete"
                                        : "Mark set as complete"
                                    }
                                    className={`active-workout-check-btn ${
                                      set.isCompleted ? "is-completed" : ""
                                    }`}
                                    onClick={() =>
                                      toggleActiveSessionSetCompleted(
                                        sessionExercise.id,
                                        set.id,
                                      )
                                    }
                                  >
                                    ✓
                                  </button>
                                </td>
                              </tr>
                              {restTimer?.status === "running" &&
                              restTimer.sourceSessionExerciseId ===
                                sessionExercise.id &&
                              restTimer.sourceSetId === set.id &&
                              remainingRestSeconds > 0 ? (
                                <tr className="active-workout-rest-timer-row">
                                  <td colSpan={5}>
                                    <section
                                      className="active-workout-rest-timer"
                                      aria-label={`Rest timer: ${formatRestTime(remainingRestSeconds)} remaining`}
                                    >
                                      <div className="active-workout-rest-timer-heading">
                                        <span>Rest</span>
                                        <strong>
                                          {formatRestTime(remainingRestSeconds)}
                                        </strong>
                                      </div>
                                      <div
                                        className="active-workout-rest-timer-track"
                                        aria-hidden="true"
                                      >
                                        <span style={{ width: `${restProgress}%` }} />
                                      </div>
                                      <div className="active-workout-rest-timer-actions">
                                        <button
                                          type="button"
                                          className="button-secondary"
                                          onClick={() =>
                                            extendActiveSessionRestTimer(30)
                                          }
                                        >
                                          +30 s
                                        </button>
                                        <button
                                          type="button"
                                          className="button-secondary"
                                          onClick={finishActiveSessionRestTimer}
                                        >
                                          End rest
                                        </button>
                                      </div>
                                    </section>
                                  </td>
                                </tr>
                              ) : null}
                              </Fragment>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div
                      className={`active-workout-card-footer ${
                        canRemoveLastSet
                          ? "active-workout-card-footer-with-secondary"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="button-secondary active-workout-add-set-btn"
                        onClick={() =>
                          addActiveSessionExerciseSet(sessionExercise.id)
                        }
                      >
                        + Add set
                      </button>

                      {canRemoveLastSet ? (
                        <button
                          type="button"
                          className="active-workout-remove-set-btn"
                          onClick={() =>
                            removeLastActiveSessionExerciseSet(
                              sessionExercise.id,
                            )
                          }
                        >
                          Undo add set
                        </button>
                      ) : null}
                    </div>
                  </div>
                  </article>
                </Fragment>
              );
            })
          )}
        </section>

        <section className="active-workout-global-actions">
          <button
            type="button"
            className="button-primary active-workout-add-exercise-btn"
            onClick={() => setShowAddExercisePicker((prev) => !prev)}
          >
            + Add exercise
          </button>
          {showAddExercisePicker ? (
            <div className="active-workout-add-exercise-panel">
              <label
                className="active-workout-add-exercise-label"
                htmlFor="active-workout-exercise-search"
              >
                Search exercise
              </label>

              <div className="active-workout-add-exercise-input-wrap">
                <input
                  id="active-workout-exercise-search"
                  className="input active-workout-add-exercise-input"
                  type="text"
                  placeholder="Search exercise"
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                />

                {exerciseSearch.trim() ? (
                  <button
                    type="button"
                    className="active-workout-add-exercise-clear-btn"
                    aria-label="Clear search"
                    onClick={() => setExerciseSearch("")}
                  >
                    ×
                  </button>
                ) : null}
              </div>

              {filteredExercisesToAdd.length > 0 ? (
                <div className="active-workout-add-exercise-results">
                  {filteredExercisesToAdd.slice(0, 8).map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      className="active-workout-add-exercise-result"
                      onClick={() => {
                        addExerciseToActiveWorkoutSession(exercise.id);
                        setExerciseSearch("");
                        setShowAddExercisePicker(false);
                      }}
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="active-workout-add-exercise-empty">
                  {exerciseSearch.trim()
                    ? "No available exercises match your search."
                    : "Start typing to search available exercises."}
                </p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="active-workout-discard-btn"
            onClick={() => setShowDiscardConfirm(true)}
          >
            Discard workout
          </button>
        </section>
      </main>
      {showFinishConfirm ? (
        <div
          className="active-workout-finish-overlay"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div
            className="active-workout-finish-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="active-workout-finish-sheet-eyebrow">
              Finish workout
            </p>

            <h2 className="active-workout-finish-sheet-title">
              {routine?.name ?? "Active Workout"}
            </h2>

            <div className="active-workout-finish-sheet-stats">
              <span className="active-workout-finish-stat-chip">
                {elapsedLabel}
              </span>
              <span className="active-workout-finish-stat-chip">
                {totalExercisesCount} exercise
                {totalExercisesCount === 1 ? "" : "s"}
              </span>
              <span className="active-workout-finish-stat-chip">
                {completedExercisesCount}/{totalExercisesCount} completed
              </span>
            </div>

            <p className="active-workout-finish-sheet-text">
              This will save the workout to your history and close the active
              session.
            </p>

            {incompleteExercisesCount > 0 ||
            exercisesWithIncompleteSetsCount > 0 ? (
              <div className="active-workout-finish-warning">
                <p className="active-workout-finish-warning-title">
                  Before you finish
                </p>

                <div className="active-workout-finish-warning-list">
                  {incompleteExercisesCount > 0 &&
                  incompleteExercisesCount ===
                    exercisesWithIncompleteSetsCount ? (
                    <p className="active-workout-finish-warning-item">
                      {incompleteExercisesCount} exercise
                      {incompleteExercisesCount === 1 ? "" : "s"}{" "}
                      {incompleteExercisesCount === 1 ? "is" : "are"} still
                      incomplete.
                    </p>
                  ) : (
                    <>
                      {incompleteExercisesCount > 0 ? (
                        <p className="active-workout-finish-warning-item">
                          {incompleteExercisesCount} exercise
                          {incompleteExercisesCount === 1 ? "" : "s"}{" "}
                          {incompleteExercisesCount === 1 ? "is" : "are"} still
                          incomplete.
                        </p>
                      ) : null}

                      {exercisesWithIncompleteSetsCount > 0 ? (
                        <p className="active-workout-finish-warning-item">
                          {exercisesWithIncompleteSetsCount} exercise
                          {exercisesWithIncompleteSetsCount === 1
                            ? ""
                            : "s"}{" "}
                          {exercisesWithIncompleteSetsCount === 1
                            ? "still has"
                            : "still have"}{" "}
                          unfinished sets.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="active-workout-finish-ok">
                Everything looks good to save this session.
              </div>
            )}

            <div className="active-workout-finish-sheet-actions">
              <button
                type="button"
                className="button-primary active-workout-finish-confirm-btn"
                onClick={() => {
                  completeActiveWorkoutSession();
                  navigate("/history");
                }}
              >
                Finish workout
              </button>

              <button
                type="button"
                className="button-secondary active-workout-finish-cancel-btn"
                onClick={() => setShowFinishConfirm(false)}
              >
                Keep training
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showDiscardConfirm ? (
        <div
          className="active-workout-finish-overlay"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="active-workout-finish-sheet active-workout-discard-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="active-workout-discard-sheet-eyebrow">
              Discard workout
            </p>

            <h2 className="active-workout-finish-sheet-title">
              {routine?.name ?? "Active Workout"}
            </h2>

            <div className="active-workout-finish-sheet-stats">
              <span className="active-workout-finish-stat-chip">
                {elapsedLabel}
              </span>
              <span className="active-workout-finish-stat-chip">
                {totalExercisesCount} exercise
                {totalExercisesCount === 1 ? "" : "s"}
              </span>
            </div>

            <p className="active-workout-finish-sheet-text">
              This will remove the active session and all current progress.
            </p>

            <p className="active-workout-discard-note">
              This action can’t be undone.
            </p>

            <div className="active-workout-finish-sheet-actions">
              <button
                type="button"
                className="active-workout-discard-confirm-btn"
                onClick={() => {
                  cancelActiveWorkoutSession();
                  navigate("/routines");
                }}
              >
                Discard workout
              </button>

              <button
                type="button"
                className="button-secondary active-workout-finish-cancel-btn"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep training
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
