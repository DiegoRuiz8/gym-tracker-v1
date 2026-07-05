// src/pages/NewExercisePage.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { generateId } from "../utils/ids";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import {
  PRIMARY_MUSCLE_OPTIONS,
  normalizeExerciseDbMuscle,
  type PrimaryMuscle,
} from "../utils/primaryMuscles";
import type { Exercise } from "../types/exercise";
import {
  getExerciseDbCatalog,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import { searchExerciseDbByText } from "../lib/exerciseDbMatching";
import ExercisePhotoToggle from "../components/exercise/ExercisePhotoToggle";
import PageBackButton from "../components/navigation/PageBackButton";
import StyledSelect from "../components/ui/StyledSelect";
import "../styles/simple-page.css";
import "../styles/routine-form.css";

type NewExerciseLocationState = {
  prefillName?: string;
  returnTo?: string;
};

export default function NewExercisePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const exercises = useAppStore((state) => state.exercises);
  const addExercise = useAppStore((state) => state.addExercise);

  const pageState = (location.state as NewExerciseLocationState | null) ?? null;
  const returnTo = pageState?.returnTo ?? "/exercises";

  // --- Estado del buscador de catálogo ---
  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);
  const [catalogSearch, setCatalogSearch] = useState(pageState?.prefillName ?? "");
  const [showManualForm, setShowManualForm] = useState(false);

  // --- Estado del formulario manual ---
  const [name, setName] = useState(pageState?.prefillName ?? "");
  const [category, setCategory] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState<string>("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [setup, setSetup] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  // IDs ya vinculados en la librería personal (para excluirlos del catálogo)
  const myExerciseDbIds = new Set(
    exercises.map((e) => e.exerciseDbId).filter(Boolean),
  );

  const normalizedSearch = catalogSearch.trim().toLowerCase();

  const catalogResults = normalizedSearch
    ? searchExerciseDbByText(normalizedSearch, catalog, 6).filter(
        (entry) => !myExerciseDbIds.has(entry.id),
      )
    : [];

  const hasSearched = normalizedSearch.length > 0;
  const hasResults = catalogResults.length > 0;

  function autoResizeNotes(element: HTMLTextAreaElement) {
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesRef.current) {
      autoResizeNotes(notesRef.current);
    }
  }

  // Crea el ejercicio desde el catálogo con link a ExerciseDB y navega de vuelta.
  // Normaliza el primer músculo de ExerciseDB a nuestra lista fija; el resto queda
  // como secondaryMuscleGroups en texto libre.
  function handleAddFromCatalog(entry: ExerciseDbEntry) {
    const now = new Date().toISOString();

    const primaryFromCatalog = entry.primaryMuscles[0];
    const normalizedPrimary = primaryFromCatalog
      ? normalizeExerciseDbMuscle(primaryFromCatalog)
      : undefined;
    const secondary = entry.primaryMuscles.slice(1);

    const newExercise: Exercise = {
      id: generateId(),
      name: entry.name,
      category: undefined,
      primaryMuscle: normalizedPrimary,
      secondaryMuscleGroups: secondary.length > 0 ? secondary : undefined,
      equipment: entry.equipment ?? undefined,
      gymLabel: undefined,
      notes: undefined,
      isActive: true,
      trackingType: "weight_reps",
      exerciseDbId: entry.id,
      exerciseDbLinkStatus: "auto",
      createdAt: now,
      updatedAt: now,
    };
    addExercise(newExercise);
    navigate(returnTo);
  }

  function handleShowManualForm() {
    // Pre-llena el nombre con lo que el usuario buscó si el campo está vacío
    if (catalogSearch.trim() && !name) {
      setName(catalogSearch.trim());
    }
    setShowManualForm(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedSetup = setup.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName) {
      setError("Exercise name is required.");
      return;
    }

    const nameAlreadyExists = exercises.some(
      (exercise) =>
        exercise.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      setError("An exercise with that name already exists.");
      return;
    }

    const parsedSecondary = secondaryMuscles
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const now = new Date().toISOString();

    const newExercise: Exercise = {
      id: generateId(),
      name: trimmedName,
      category: category || undefined,
      primaryMuscle: primaryMuscle
        ? (primaryMuscle as PrimaryMuscle)
        : undefined,
      secondaryMuscleGroups:
        parsedSecondary.length > 0 ? parsedSecondary : undefined,
      gymLabel: trimmedSetup || undefined,
      equipment: undefined,
      notes: trimmedNotes || undefined,
      isActive: true,
      trackingType: "weight_reps",
      createdAt: now,
      updatedAt: now,
    };

    addExercise(newExercise);
    navigate(returnTo);
  }

  return (
    <div className="simple-page">
      <div className="simple-page-container">

        {/* Header */}
        <div className="simple-page-card">
          <div className="simple-page-card-body">
            <div className="simple-page-back-row">
              <PageBackButton fallbackTo={returnTo} />
            </div>
            <h1 className="simple-page-title">New exercise</h1>
            <p className="simple-page-subtitle">
              Search the exercise database or add one manually.
            </p>
          </div>
        </div>

        {/* Búsqueda en el catálogo */}
        <div className="simple-page-card">
          <div className="simple-page-card-body">
            <div className="simple-page-field">
              <label className="simple-page-label" htmlFor="catalog-search">
                Search exercise database
              </label>
              <input
                id="catalog-search"
                className="simple-page-input"
                type="text"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="e.g. Bench Press, Squat, Romanian Deadlift..."
              />
            </div>

            {!hasSearched && (
              <p className="simple-page-help">
                Search across ~873 exercises with photos and muscle data.
              </p>
            )}

            {hasSearched && hasResults && (
              <div className="routine-form-search-results">
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
              </div>
            )}

            {hasSearched && !hasResults && (
              <p className="simple-page-help">
                No results for "{catalogSearch.trim()}".
              </p>
            )}

            {!showManualForm && (
              <button
                type="button"
                className="simple-page-btn simple-page-btn-secondary"
                style={{ marginTop: "var(--space-3)" }}
                onClick={handleShowManualForm}
              >
                {hasSearched && !hasResults
                  ? `+ Add "${catalogSearch.trim()}" manually`
                  : "+ Add manually instead"}
              </button>
            )}
          </div>
        </div>

        {/* Formulario manual */}
        {showManualForm && (
          <form onSubmit={handleSubmit}>
            <div className="simple-page-card">
              <div className="simple-page-card-body">
                <p className="simple-page-subtitle" style={{ marginBottom: "var(--space-4)" }}>
                  Fill in the details manually.
                </p>

                <div className="simple-page-field">
                  <label className="simple-page-label" htmlFor="exercise-name">
                    Name
                  </label>
                  <input
                    id="exercise-name"
                    className="simple-page-input"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    placeholder="e.g. Bench Press - Barbell"
                  />
                </div>

                <div className="simple-page-field">
                  <label className="simple-page-label" htmlFor="exercise-category">
                    Category
                  </label>
                  <select
                    id="exercise-category"
                    className="simple-page-select"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="">Select a category</option>
                    {EXERCISE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="simple-page-field">
                  <label
                    className="simple-page-label"
                    htmlFor="exercise-primary-muscle"
                  >
                    Primary muscle
                  </label>
                  <StyledSelect
  id="exercise-primary-muscle"
  value={primaryMuscle}
  onChange={setPrimaryMuscle}
  placeholder="Select a primary muscle"
  ariaLabel="Primary muscle"
  options={PRIMARY_MUSCLE_OPTIONS.map((option) => ({
    value: option,
    label: option,
  }))}
/>
                  <p className="simple-page-help">
                    Used for exercise swaps by matching muscle.
                  </p>
                </div>

                <div className="simple-page-field">
                  <label
                    className="simple-page-label"
                    htmlFor="exercise-secondary-muscles"
                  >
                    Secondary muscles
                  </label>
                  <input
                    id="exercise-secondary-muscles"
                    className="simple-page-input"
                    type="text"
                    value={secondaryMuscles}
                    onChange={(event) => setSecondaryMuscles(event.target.value)}
                    placeholder="e.g. triceps, shoulders"
                  />
                  <p className="simple-page-help">
                    Optional. Separate multiple muscles with commas.
                  </p>
                </div>

                <div className="simple-page-field">
                  <label className="simple-page-label" htmlFor="exercise-setup">
                    Setup
                  </label>
                  <input
                    id="exercise-setup"
                    className="simple-page-input"
                    type="text"
                    value={setup}
                    onChange={(event) => setSetup(event.target.value)}
                    placeholder="e.g. Smith machine, flat bench, cable station"
                  />
                  <p className="simple-page-help">
                    Use this for whatever helps you recognize the setup in your
                    gym.
                  </p>
                </div>

                <div className="simple-page-field">
                  <label className="simple-page-label" htmlFor="exercise-notes">
                    Notes
                  </label>
                  <textarea
                    ref={notesRef}
                    id="exercise-notes"
                    className="simple-page-textarea simple-page-textarea-compact"
                    rows={1}
                    value={notes}
                    onChange={(event) => handleNotesChange(event.target.value)}
                    placeholder="Optional notes..."
                  />
                </div>

                {error && <p className="simple-page-error">{error}</p>}

                <div className="simple-page-actions">
                  <button
                    type="submit"
                    className="simple-page-btn simple-page-btn-primary"
                  >
                    Save exercise
                  </button>

                  <button
                    type="button"
                    className="simple-page-btn simple-page-btn-secondary"
                    onClick={() => navigate(returnTo)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}