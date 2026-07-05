// src/pages/EditRoutinePage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RoutineExerciseEditorCard from "../components/routine/RoutineExerciseEditorCard";
import { useAppStore } from "../store/useAppStore";
import { getExerciseById } from "../store/selectors";
import { generateId } from "../utils/ids";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import {
  getExerciseDbCatalog,
  getImagesForExercise,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import { searchExerciseDbByText } from "../lib/exerciseDbMatching";
import ExercisePhotoToggle from "../components/exercise/ExercisePhotoToggle";
import PageBackButton from "../components/navigation/PageBackButton";
import { normalizeExerciseDbMuscle } from "../utils/primaryMuscles";
import "../styles/routine-form.css";

type PrescriptionDraft = {
  sets: string;
  repMin: string;
  repMax: string;
  targetRIR: string;
  restSeconds: string;
  notes: string;
};

function buildPrescriptionDraft(exerciseRef: {
  prescription: {
    sets: number;
    repRange?: { min: number; max: number };
    targetRIR?: number | null;
    restSeconds?: number | null;
    notes?: string;
  };
}): PrescriptionDraft {
  return {
    sets: String(exerciseRef.prescription.sets),
    repMin: String(exerciseRef.prescription.repRange?.min ?? ""),
    repMax: String(exerciseRef.prescription.repRange?.max ?? ""),
    targetRIR:
      exerciseRef.prescription.targetRIR == null
        ? ""
        : String(exerciseRef.prescription.targetRIR),
    restSeconds:
      exerciseRef.prescription.restSeconds == null
        ? ""
        : String(exerciseRef.prescription.restSeconds),
    notes: exerciseRef.prescription.notes ?? "",
  };
}

export default function EditRoutinePage() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const addExercise = useAppStore((state) => state.addExercise);
  const updateRoutine = useAppStore((state) => state.updateRoutine);
  const deleteRoutine = useAppStore((state) => state.deleteRoutine);
  const addExerciseRefToRoutine = useAppStore(
    (state) => state.addExerciseRefToRoutine,
  );
  const removeExerciseRefFromRoutine = useAppStore(
    (state) => state.removeExerciseRefFromRoutine,
  );
  const updateRoutineExerciseRef = useAppStore(
    (state) => state.updateRoutineExerciseRef,
  );
  const moveExerciseRefInRoutine = useAppStore(
    (state) => state.moveExerciseRefInRoutine,
  );

  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  const routine = useMemo(
    () => routines.find((item) => item.id === routineId),
    [routines, routineId],
  );

  const [name, setName] = useState(routine?.name ?? "");
  const [dayType, setDayType] = useState(routine?.dayType ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const addExerciseSectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightAddExercise, setHighlightAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [routineError, setRoutineError] = useState("");

  const pageState =
    (location.state as {
      returnTo?: string;
      restoreDetailScroll?: boolean;
      scrollToAddExercise?: boolean;
    } | null) ?? null;

  const returnTo = pageState?.returnTo ?? "/routines";
  const restoreDetailScroll = pageState?.restoreDetailScroll ?? false;

  useEffect(() => {
    if (!pageState?.scrollToAddExercise) return;

    const scrollTimer = window.setTimeout(() => {
      addExerciseSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setHighlightAddExercise(true);

      const highlightTimer = window.setTimeout(() => {
        setHighlightAddExercise(false);
      }, 1400);

      return () => window.clearTimeout(highlightTimer);
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [pageState?.scrollToAddExercise]);

  const [prescriptionDrafts, setPrescriptionDrafts] = useState<Record<string, PrescriptionDraft>>(() => {
    if (!routine) return {};
    return Object.fromEntries(
      routine.exerciseRefs.map((exerciseRef) => [
        exerciseRef.id,
        buildPrescriptionDraft(exerciseRef),
      ]),
    );
  });

  const [prescriptionErrors, setPrescriptionErrors] = useState<Record<string, string | undefined>>({});
  const [prescriptionSuccess, setPrescriptionSuccess] = useState<Record<string, boolean | undefined>>({});

  if (!routine) {
    return (
      <div className="routine-form-page">
        <div className="routine-form-container">
          <div className="routine-form-card">
            <div className="routine-form-back-row">
              <PageBackButton fallbackTo={returnTo} />
            </div>
            <p className="routine-form-routine-error">Routine not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const safeRoutine = routine;

  const sortedExerciseRefs = [...safeRoutine.exerciseRefs].sort(
    (a, b) => a.order - b.order,
  );

  // Ejercicios propios disponibles (activos, no ya en la rutina)
  const availableExercises = exercises.filter((exercise) => {
    const alreadyInRoutine = safeRoutine.exerciseRefs.some(
      (ref) => ref.exerciseId === exercise.id,
    );
    return exercise.isActive && !alreadyInRoutine;
  });

  const normalizedSearch = exerciseSearch.trim().toLowerCase();

  // Resultados de tu librería personal
  const myExerciseResults = availableExercises.filter((exercise) => {
    if (!normalizedSearch) return true;
    const name = exercise.name.toLowerCase();
    const equipment = exercise.equipment?.toLowerCase() ?? "";
    const gymLabel = exercise.gymLabel?.toLowerCase() ?? "";
    return (
      name.includes(normalizedSearch) ||
      equipment.includes(normalizedSearch) ||
      gymLabel.includes(normalizedSearch)
    );
  });

  // IDs de ejercicios ya en tu librería (para excluir del catálogo)
  const myExerciseDbIds = new Set(
    exercises.map((e) => e.exerciseDbId).filter(Boolean),
  );

  // Resultados del catálogo de ExerciseDB (excluye los que ya están en tu librería)
  const catalogResults = normalizedSearch
    ? searchExerciseDbByText(normalizedSearch, catalog, 6).filter(
        (entry) => !myExerciseDbIds.has(entry.id),
      )
    : [];

  function getExerciseDisplayLabel(exerciseId: string): string {
    const exercise = getExerciseById(exercises, exerciseId);
    return exercise?.name ?? "Unknown exercise";
  }

  function handleSaveRoutine() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setRoutineError("Routine name is required.");
      return;
    }
    setRoutineError("");
    updateRoutine({
      ...safeRoutine,
      name: trimmedName,
      dayType: dayType || undefined,
      description: description.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    navigate(returnTo, {
      state: restoreDetailScroll ? { restoreDetailScroll: true } : undefined,
    });
  }

  function handleRequestDelete() {
    setShowDeleteConfirm(true);
  }

  function handleCancelDelete() {
    setShowDeleteConfirm(false);
  }

  function handleConfirmDelete() {
    deleteRoutine(safeRoutine.id);
    navigate("/routines");
  }

  function handleAddExerciseRef(exerciseId: string) {
    const selectedExercise = getExerciseById(exercises, exerciseId);
    if (!selectedExercise) return;

    const nextOrder = safeRoutine.exerciseRefs.length + 1;
    const newExerciseRef = {
      id: generateId(),
      routineId: safeRoutine.id,
      exerciseId: selectedExercise.id,
      order: nextOrder,
      prescription: {
        sets: 3,
        repRange: { min: 8, max: 12 },
        targetRIR: 1,
        restSeconds: 90,
      },
    };

    addExerciseRefToRoutine(safeRoutine.id, newExerciseRef);
    setPrescriptionDrafts((current) => ({
      ...current,
      [newExerciseRef.id]: buildPrescriptionDraft(newExerciseRef),
    }));
    setPrescriptionErrors((current) => ({ ...current, [newExerciseRef.id]: undefined }));
    setPrescriptionSuccess((current) => ({ ...current, [newExerciseRef.id]: undefined }));
    setExerciseSearch("");
  }

  // Crea el ejercicio desde el catálogo y lo agrega a la rutina en un solo paso
  function handleAddFromCatalog(entry: ExerciseDbEntry) {
    const now = new Date().toISOString();

// Toma el primer músculo del catálogo y lo normaliza a nuestra lista fija.
// El resto queda como secundarios en texto libre.
const primaryFromCatalog = entry.primaryMuscles[0];
const primaryMuscle = primaryFromCatalog
  ? normalizeExerciseDbMuscle(primaryFromCatalog)
  : undefined;
const secondary = entry.primaryMuscles.slice(1);

const newExercise = {
  id: generateId(),
  name: entry.name,
  category: undefined,
  primaryMuscle,
  secondaryMuscleGroups: secondary.length > 0 ? secondary : undefined,
  equipment: entry.equipment ?? undefined,
  gymLabel: undefined,
  notes: undefined,
  isActive: true,
  trackingType: "weight_reps" as const,
  exerciseDbId: entry.id,
  exerciseDbLinkStatus: "auto" as const,
  createdAt: now,
  updatedAt: now,
};

    addExercise(newExercise);

    const nextOrder = safeRoutine.exerciseRefs.length + 1;
    const newExerciseRef = {
      id: generateId(),
      routineId: safeRoutine.id,
      exerciseId: newExercise.id,
      order: nextOrder,
      prescription: {
        sets: 3,
        repRange: { min: 8, max: 12 },
        targetRIR: 1,
        restSeconds: 90,
      },
    };

    addExerciseRefToRoutine(safeRoutine.id, newExerciseRef);
    setPrescriptionDrafts((current) => ({
      ...current,
      [newExerciseRef.id]: buildPrescriptionDraft(newExerciseRef),
    }));
    setPrescriptionErrors((current) => ({ ...current, [newExerciseRef.id]: undefined }));
    setPrescriptionSuccess((current) => ({ ...current, [newExerciseRef.id]: undefined }));
    setExerciseSearch("");
  }

  function handleRemoveExerciseRef(exerciseRefId: string) {
    removeExerciseRefFromRoutine(safeRoutine.id, exerciseRefId);
    setPrescriptionDrafts((current) => {
      const next = { ...current };
      delete next[exerciseRefId];
      return next;
    });
    setPrescriptionErrors((current) => {
      const next = { ...current };
      delete next[exerciseRefId];
      return next;
    });
    setPrescriptionSuccess((current) => {
      const next = { ...current };
      delete next[exerciseRefId];
      return next;
    });
  }

  function handleMoveExerciseRefUp(exerciseRefId: string) {
    const currentIndex = sortedExerciseRefs.findIndex(
      (ref) => ref.id === exerciseRefId,
    );
    if (currentIndex <= 0) return;
    moveExerciseRefInRoutine(safeRoutine.id, currentIndex, currentIndex - 1);
  }

  function handleMoveExerciseRefDown(exerciseRefId: string) {
    const currentIndex = sortedExerciseRefs.findIndex(
      (ref) => ref.id === exerciseRefId,
    );
    if (currentIndex < 0 || currentIndex >= sortedExerciseRefs.length - 1) return;
    moveExerciseRefInRoutine(safeRoutine.id, currentIndex, currentIndex + 1);
  }

  function handlePrescriptionDraftChange(
    exerciseRefId: string,
    field: keyof PrescriptionDraft,
    value: string,
  ) {
    setPrescriptionDrafts((current) => ({
      ...current,
      [exerciseRefId]: { ...current[exerciseRefId], [field]: value },
    }));
    setPrescriptionErrors((current) => ({ ...current, [exerciseRefId]: undefined }));
    setPrescriptionSuccess((current) => ({ ...current, [exerciseRefId]: undefined }));
  }

  function handleSaveExerciseRefPrescription(exerciseRefId: string) {
    const currentRef = safeRoutine.exerciseRefs.find(
      (ref) => ref.id === exerciseRefId,
    );
    const draft = prescriptionDrafts[exerciseRefId];
    if (!currentRef || !draft) return;

    const trimmedSets = draft.sets.trim();
    const trimmedRepMin = draft.repMin.trim();
    const trimmedRepMax = draft.repMax.trim();

    if (!trimmedSets || !trimmedRepMin || !trimmedRepMax) {
      setPrescriptionErrors((current) => ({
        ...current,
        [exerciseRefId]: "Sets, rep min, and rep max are required.",
      }));
      return;
    }

    const sets = Number(trimmedSets);
    const repMin = Number(trimmedRepMin);
    const repMax = Number(trimmedRepMax);

    if (
      Number.isNaN(sets) || Number.isNaN(repMin) || Number.isNaN(repMax) ||
      sets <= 0 || repMin <= 0 || repMax <= 0
    ) {
      setPrescriptionErrors((current) => ({
        ...current,
        [exerciseRefId]: "Sets and reps must be numbers greater than 0.",
      }));
      return;
    }

    if (repMin > repMax) {
      setPrescriptionErrors((current) => ({
        ...current,
        [exerciseRefId]: "Rep min cannot be greater than rep max.",
      }));
      return;
    }

    const targetRIR =
      draft.targetRIR.trim() === "" ? undefined : Number(draft.targetRIR.trim());

    if (targetRIR != null && (Number.isNaN(targetRIR) || targetRIR < 0)) {
      setPrescriptionErrors((current) => ({
        ...current,
        [exerciseRefId]: "RIR must be 0 or greater.",
      }));
      return;
    }

    const restSeconds =
      draft.restSeconds.trim() === "" ? undefined : Number(draft.restSeconds.trim());

    if (restSeconds != null && (Number.isNaN(restSeconds) || restSeconds < 0)) {
      setPrescriptionErrors((current) => ({
        ...current,
        [exerciseRefId]: "Rest must be 0 or greater.",
      }));
      return;
    }

    updateRoutineExerciseRef(safeRoutine.id, {
      ...currentRef,
      prescription: {
        ...currentRef.prescription,
        sets,
        repRange: { min: repMin, max: repMax },
        targetRIR,
        restSeconds,
        notes: draft.notes.trim() || undefined,
      },
    });

    setPrescriptionErrors((current) => ({ ...current, [exerciseRefId]: undefined }));
    setPrescriptionSuccess((current) => ({ ...current, [exerciseRefId]: true }));

    window.setTimeout(() => {
      setPrescriptionSuccess((current) => ({ ...current, [exerciseRefId]: undefined }));
    }, 1800);
  }

  const hasAnyResults =
    myExerciseResults.length > 0 || catalogResults.length > 0;

  return (
    <div className="routine-form-page">
      <div className="routine-form-container">
        <div className="routine-form-card">
          <div className="routine-form-back-row">
            <PageBackButton fallbackTo="/routines" />
          </div>
          <h1 className="routine-form-title">Edit routine</h1>
          <p className="routine-form-subtitle">
            Update routine details and exercise targets.
          </p>
        </div>

        <div className="routine-form-card">
          <div className="routine-form-section-header">
            <h2 className="routine-form-section-title">Routine details</h2>

            <div className="routine-form-actions routine-form-actions-top">
              <button
                type="button"
                className="routine-form-btn routine-form-btn-primary"
                onClick={handleSaveRoutine}
              >
                Save changes
              </button>

              <button
                type="button"
                className="routine-form-btn routine-form-btn-secondary"
                onClick={() =>
                  navigate(returnTo, {
                    state: restoreDetailScroll
                      ? { restoreDetailScroll: true }
                      : undefined,
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="routine-form-btn routine-form-btn-danger"
                onClick={handleRequestDelete}
              >
                Delete routine
              </button>
            </div>
          </div>

          <div className="routine-form-field">
            <label className="routine-form-label" htmlFor="routine-name">
              Name
            </label>
            <input
              id="routine-name"
              className="routine-form-input"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setRoutineError("");
              }}
            />
          </div>

          <div className="routine-form-field">
            <label className="routine-form-label" htmlFor="routine-day-type">
              Day type
            </label>
            <select
              id="routine-day-type"
              className="routine-form-select"
              value={dayType}
              onChange={(event) => setDayType(event.target.value)}
            >
              <option value="">Select a category</option>
              {EXERCISE_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="routine-form-field routine-form-field-compact">
            <label className="routine-form-label" htmlFor="routine-description">
              Description
            </label>
            <textarea
              id="routine-description"
              className="routine-form-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {routineError && (
            <p className="routine-form-routine-error">{routineError}</p>
          )}

          {showDeleteConfirm && (
            <div className="routine-form-delete-confirm">
              <p className="routine-form-delete-text">Delete routine?</p>
              <p className="routine-form-delete-subtext">
                Existing workout logs will stay, but this routine will be
                removed.
              </p>
              <div className="routine-form-delete-actions">
                <button
                  type="button"
                  className="routine-form-btn routine-form-btn-danger"
                  onClick={handleConfirmDelete}
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  className="routine-form-btn routine-form-btn-secondary"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="routine-form-card">
          <h2 className="routine-form-section-title">Exercises in routine</h2>

          {sortedExerciseRefs.length === 0 ? (
            <p className="routine-form-subtitle">
              No exercises yet. Add one below.
            </p>
          ) : (
            <div className="routine-form-list">
              {sortedExerciseRefs.map((exerciseRef, index) => {
                const draft =
                  prescriptionDrafts[exerciseRef.id] ??
                  buildPrescriptionDraft(exerciseRef);
                const error = prescriptionErrors[exerciseRef.id];
                const success = prescriptionSuccess[exerciseRef.id];

                return (
                  <RoutineExerciseEditorCard
                    key={exerciseRef.id}
                    exerciseRef={exerciseRef}
                    exerciseName={getExerciseDisplayLabel(exerciseRef.exerciseId)}
                    draft={draft}
                    error={error}
                    success={success}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedExerciseRefs.length - 1}
                    onMoveUp={handleMoveExerciseRefUp}
                    onMoveDown={handleMoveExerciseRefDown}
                    onDraftChange={handlePrescriptionDraftChange}
                    onSave={handleSaveExerciseRefPrescription}
                    onRemove={handleRemoveExerciseRef}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div
          ref={addExerciseSectionRef}
          className={`routine-form-card ${
            highlightAddExercise ? "routine-form-card-highlight" : ""
          }`}
        >
          <h2 className="routine-form-section-title">Add exercise</h2>

          <div className="routine-form-field">
            <label
              className="routine-form-label"
              htmlFor="routine-exercise-search"
            >
              Search
            </label>
            <input
              id="routine-exercise-search"
              className="routine-form-input"
              type="text"
              placeholder="Search exercise"
              value={exerciseSearch}
              onChange={(event) => setExerciseSearch(event.target.value)}
            />
          </div>

          {!exerciseSearch.trim() ? (
            <p className="routine-form-helper-text">
              Start typing to search your exercises or the exercise database.
            </p>
          ) : !hasAnyResults ? (
            <div className="routine-form-no-results">
              <p className="routine-form-helper-text">
                No exercises found for "{exerciseSearch}".
              </p>
              <button
                type="button"
                className="routine-form-btn routine-form-btn-secondary"
                onClick={() =>
                  navigate("/exercises/new", {
                    state: {
                      prefillName: exerciseSearch.trim(),
                      returnTo: location.pathname,
                    },
                  })
                }
              >
                + Add "{exerciseSearch.trim()}" manually
              </button>
            </div>
          ) : (
            <div className="routine-form-search-results">
              {myExerciseResults.length > 0 && (
                <>
                  <p className="routine-form-search-section-label">
                    Your exercises
                  </p>
                  {myExerciseResults.slice(0, 6).map((exercise) => {
  const images = getImagesForExercise(
    exercise.exerciseDbId,
    catalog,
  );
  return (
    <div
      key={exercise.id}
      className="routine-form-search-result routine-form-search-result-with-photo"
    >
      <ExercisePhotoToggle
        images={images}
        alt={exercise.name}
        mode="compact"
      />
      <button
        type="button"
        className="routine-form-search-result-name"
        onClick={() => handleAddExerciseRef(exercise.id)}
      >
        {exercise.name}
      </button>
    </div>
  );
})}
                </>
              )}

              {catalogResults.length > 0 && (
                <>
                  <p className="routine-form-search-section-label">
                    From exercise database
                  </p>
                 {catalogResults.map((entry) => (
  <div
    key={entry.id}
    className="routine-form-search-result routine-form-search-result-with-photo"
  >
    <ExercisePhotoToggle
      images={entry.images}
      alt={entry.name}
      mode="compact"
    />
    <button
      type="button"
      className="routine-form-search-result-name"
      onClick={() => handleAddFromCatalog(entry)}
    >
      {entry.name}
    </button>
  </div>
))}
                </>
              )}

              {!hasAnyResults && (
                <button
                  type="button"
                  className="routine-form-btn routine-form-btn-secondary"
                  onClick={() =>
                    navigate("/exercises/new", {
                      state: {
                        prefillName: exerciseSearch.trim(),
                        returnTo: location.pathname,
                      },
                    })
                  }
                >
                  + Add "{exerciseSearch.trim()}" manually
                </button>
              )}
            </div>
          )}
        </div>

        <div className="routine-form-card routine-form-bottom-save">
          <div className="routine-form-actions routine-form-actions-end">
            <button
              type="button"
              className="routine-form-btn routine-form-btn-primary"
              onClick={handleSaveRoutine}
            >
              Save changes
            </button>

            <button
              type="button"
              className="routine-form-btn routine-form-btn-secondary"
              onClick={() =>
                navigate(returnTo, {
                  state: restoreDetailScroll
                    ? { restoreDetailScroll: true }
                    : undefined,
                })
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}