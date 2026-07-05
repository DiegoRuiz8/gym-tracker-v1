// src/pages/EditExercisePage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import {
  PRIMARY_MUSCLE_OPTIONS,
  type PrimaryMuscle,
} from "../utils/primaryMuscles";
import type { Exercise } from "../types/exercise";
import {
  getExerciseDbCatalog,
  type ExerciseDbEntry,
} from "../lib/exerciseDbCache";
import {
  findExerciseDbCandidates,
  getBestAutoSuggestion,
  searchExerciseDbByText,
  type ExerciseDbCandidate,
} from "../lib/exerciseDbMatching";
import ExercisePhotoToggle from "../components/exercise/ExercisePhotoToggle";
import PageBackButton from "../components/navigation/PageBackButton";
import StyledSelect from "../components/ui/StyledSelect";
import "../styles/simple-page.css";

export default function EditExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const exercises = useAppStore((state) => state.exercises);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const updateExercise = useAppStore((state) => state.updateExercise);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === exerciseId),
    [exercises, exerciseId],
  );

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/exercises";

  // --- Todos los hooks ANTES del early return ---

  const [catalog, setCatalog] = useState<ExerciseDbEntry[]>([]);
  const [exerciseDbSearch, setExerciseDbSearch] = useState("");
  const exerciseDbSectionRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState(exercise?.category ?? "");
  const [primaryMuscle, setPrimaryMuscle] = useState<string>(
    exercise?.primaryMuscle ?? "",
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState(
    exercise?.secondaryMuscleGroups?.join(", ") ?? "",
  );
  const [setup, setSetup] = useState(
    exercise?.gymLabel ?? exercise?.equipment ?? "",
  );
  const [notes, setNotes] = useState(exercise?.notes ?? "");
  const [isActive, setIsActive] = useState(exercise?.isActive ?? true);
  const [error, setError] = useState("");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const exerciseLogCount = exercise
    ? workoutLogs.filter((log) => log.exerciseId === exercise.id).length
    : 0;

  const candidates: ExerciseDbCandidate[] = useMemo(() => {
    if (!exercise || catalog.length === 0) return [];
    return findExerciseDbCandidates(exercise, catalog, 3);
  }, [exercise, catalog]);

  const bestSuggestion = getBestAutoSuggestion(candidates);

  const searchResults = useMemo(() => {
    if (!exerciseDbSearch.trim()) return [];
    return searchExerciseDbByText(exerciseDbSearch, catalog, 6);
  }, [exerciseDbSearch, catalog]);

  useEffect(() => {
    const state = location.state as {
      scrollToExerciseDbSection?: boolean;
    } | null;

    if (!state?.scrollToExerciseDbSection) {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      exerciseDbSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [location.state]);

  useEffect(() => {
    getExerciseDbCatalog().then((result) => setCatalog(result.exercises));
  }, []);

  // --- Early return DESPUÉS de todos los hooks ---

  if (!exercise) {
    return (
      <div className="simple-page">
        <div className="simple-page-container">
          <div className="simple-page-card">
            <div className="simple-page-card-body">
              <h1 className="simple-page-title">Exercise not found</h1>
              <p className="simple-page-subtitle">
                The selected exercise does not exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const safeExercise = exercise;

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
      (item) =>
        item.id !== safeExercise.id &&
        item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      setError("An exercise with that name already exists.");
      return;
    }

    const parsedSecondary = secondaryMuscles
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const updatedExercise: Exercise = {
      ...safeExercise,
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
      isActive,
    };

    updateExercise(updatedExercise);
    navigate(returnTo);
  }

  function handleRequestToggleActive() {
    setShowStatusConfirm(true);
  }

  function handleCancelToggleActive() {
    setShowStatusConfirm(false);
  }

  function handleConfirmToggleActive() {
    setIsActive((current) => !current);
    setShowStatusConfirm(false);
  }

  function handleLinkToEntry(
    entry: ExerciseDbEntry,
    status: "auto" | "manual",
  ) {
    updateExercise({
      ...safeExercise,
      exerciseDbId: entry.id,
      exerciseDbLinkStatus: status,
    });
    setExerciseDbSearch("");
  }

  function handleUnlink() {
    updateExercise({
      ...safeExercise,
      exerciseDbId: null,
      exerciseDbLinkStatus: "none",
    });
  }

  const currentEntry = catalog.find(
    (entry) => entry.id === safeExercise.exerciseDbId,
  );

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <div className="simple-page-card simple-page-card-compact simple-page-hero-card-compact">
          <div className="simple-page-card-body simple-page-card-body-compact">
            <div className="simple-page-back-row">
              <PageBackButton fallbackTo="/exercises" />
            </div>
            <h1 className="simple-page-title simple-page-title-compact">
              Edit exercise
            </h1>
            <p className="simple-page-subtitle">Update the exercise details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="simple-page-card">
            <div className="simple-page-card-body">
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
                />
              </div>

              <div className="simple-page-field">
                <label
                  className="simple-page-label"
                  htmlFor="exercise-category"
                >
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

              <div className="simple-page-field">
                <label className="simple-page-label">Status</label>

                <div className="simple-page-status-row">
                  <span
                    className={
                      isActive
                        ? "simple-page-status-badge simple-page-status-badge-active"
                        : "simple-page-status-badge simple-page-status-badge-inactive"
                    }
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>

                  <button
                    type="button"
                    className="simple-page-btn simple-page-btn-secondary"
                    onClick={handleRequestToggleActive}
                  >
                    {isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>

                <p className="simple-page-help">
                  {exerciseLogCount > 0
                    ? `This exercise has ${exerciseLogCount} log${
                        exerciseLogCount === 1 ? "" : "s"
                      }. Deactivating it will keep existing history but hide it from new selections.`
                    : "Inactive exercises stay in history but should not be used for new selections."}
                </p>
              </div>

              {showStatusConfirm && (
                <div className="simple-page-inline-confirm">
                  <p className="simple-page-inline-confirm-title">
                    {isActive ? "Deactivate exercise?" : "Reactivate exercise?"}
                  </p>
                  <p className="simple-page-inline-confirm-text">
                    {isActive
                      ? "The exercise will stay in your history, but it should no longer appear for new routine selections."
                      : "The exercise will become available again for new routine selections."}
                  </p>

                  <div className="simple-page-inline-confirm-actions">
                    <button
                      type="button"
                      className="simple-page-btn simple-page-btn-secondary"
                      onClick={handleConfirmToggleActive}
                    >
                      {isActive ? "Confirm deactivate" : "Confirm reactivate"}
                    </button>

                    <button
                      type="button"
                      className="simple-page-btn simple-page-btn-secondary"
                      onClick={handleCancelToggleActive}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="simple-page-error">{error}</p>}

              <div className="simple-page-actions">
                <button
                  type="submit"
                  className="simple-page-btn simple-page-btn-primary"
                >
                  Save changes
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

        {/* Vinculo a ExerciseDB - vive fuera del <form>, actua de inmediato */}
        <div
          ref={exerciseDbSectionRef}
          className="simple-page-card simple-page-card-spaced-top"
        >
          <div className="simple-page-card-body">
            <label className="simple-page-label">Exercise photo</label>

            {currentEntry ? (
              <div className="exercisedb-current-link">
                <ExercisePhotoToggle
                  images={currentEntry.images}
                  alt={currentEntry.name}
                  mode="compact"
                />
                <div className="exercisedb-current-link-info">
                  <p className="exercisedb-current-link-name">
                    {currentEntry.name}
                  </p>
                  <p className="simple-page-help">
                    {safeExercise.exerciseDbLinkStatus === "auto"
                      ? "Linked automatically"
                      : "Linked manually"}
                  </p>
                </div>
                <button
                  type="button"
                  className="simple-page-btn simple-page-btn-secondary"
                  onClick={handleUnlink}
                >
                  Remove link
                </button>
              </div>
            ) : (
              <>
                {bestSuggestion && (
                  <div className="exercisedb-suggestion">
                    <ExercisePhotoToggle
                      images={bestSuggestion.entry.images}
                      alt={bestSuggestion.entry.name}
                      mode="compact"
                    />
                    <div className="exercisedb-suggestion-info">
                      <p className="exercisedb-suggestion-name">
                        Is this it? {bestSuggestion.entry.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="simple-page-btn simple-page-btn-primary"
                      onClick={() =>
                        handleLinkToEntry(bestSuggestion.entry, "auto")
                      }
                    >
                      Yes, link it
                    </button>
                  </div>
                )}

                <p className="simple-page-help">
                  {bestSuggestion
                    ? "Not the right exercise? Search manually:"
                    : "No automatic suggestion found. Search manually:"}
                </p>

                <input
                  className="simple-page-input"
                  type="text"
                  value={exerciseDbSearch}
                  onChange={(event) => setExerciseDbSearch(event.target.value)}
                  placeholder="Search the exercise database..."
                />

                {searchResults.length > 0 && (
                  <div className="exercisedb-search-results">
                    {searchResults.map((entry) => (
                      <div key={entry.id} className="exercisedb-search-result">
                        <ExercisePhotoToggle
                          images={entry.images}
                          alt={entry.name}
                          mode="compact"
                        />
                        <button
                          type="button"
                          className="exercisedb-search-result-name"
                          onClick={() => handleLinkToEntry(entry, "manual")}
                        >
                          {entry.name}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {exerciseDbSearch.trim() && searchResults.length === 0 && (
                  <p className="simple-page-help">
                    No results for "{exerciseDbSearch}".
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}