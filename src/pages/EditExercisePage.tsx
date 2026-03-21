import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import type { Exercise } from "../types/exercise";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/simple-page.css";

export default function EditExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const updateExercise = useAppStore((state) => state.updateExercise);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === exerciseId),
    [exercises, exerciseId],
  );

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/exercises";

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

  const linkedVariants = exerciseVariants.filter(
    (variant) => variant.exerciseId === safeExercise.id,
  );

  const [name, setName] = useState(safeExercise.name);
  const [category, setCategory] = useState(safeExercise.category ?? "");
  const [muscleGroups, setMuscleGroups] = useState(
    safeExercise.muscleGroups?.join(", ") ?? "",
  );
  const [notes, setNotes] = useState(safeExercise.notes ?? "");
  const [error, setError] = useState("");
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

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

    const parsedMuscleGroups = muscleGroups
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const updatedExercise: Exercise = {
      ...safeExercise,
      name: trimmedName,
      category: category || undefined,
      muscleGroups:
        parsedMuscleGroups.length > 0 ? parsedMuscleGroups : undefined,
      notes: trimmedNotes || undefined,
    };

    updateExercise(updatedExercise);
    navigate(returnTo);
  }

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
            <p className="simple-page-subtitle">
              Update the base exercise details and review linked variants.
            </p>
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
                  htmlFor="exercise-muscle-groups"
                >
                  Muscle groups
                </label>
                <input
                  id="exercise-muscle-groups"
                  className="simple-page-input"
                  type="text"
                  value={muscleGroups}
                  onChange={(event) => setMuscleGroups(event.target.value)}
                  placeholder="e.g. chest, triceps, front-delts"
                />
                <p className="simple-page-help">
                  Separate multiple muscle groups with commas.
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
                <div className="simple-page-variants-section-top">
                  <label className="simple-page-label">Variants</label>

                  {linkedVariants.length > 0 && (
                    <span className="simple-page-variants-count">
                      {linkedVariants.length}
                    </span>
                  )}
                </div>

                {linkedVariants.length === 0 ? (
                  <div className="simple-page-inline-confirm">
                    <p className="simple-page-inline-confirm-title">
                      No variants yet
                    </p>
                    <p className="simple-page-inline-confirm-text">
                      This exercise does not have any variants yet.
                    </p>

                    <div className="simple-page-inline-confirm-actions">
                      <Link
                        to={`/exercises/${safeExercise.id}/variants/new`}
                        className="simple-page-btn simple-page-btn-secondary"
                        state={{ returnTo }}
                      >
                        Add variant
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="simple-page-variant-list">
                    {linkedVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="simple-page-variant-list-item"
                      >
                        <div className="simple-page-variant-list-item-top">
                          <div className="simple-page-variant-list-item-main">
                            <p className="simple-page-variant-list-item-title">
                              {variant.name}
                            </p>
                            <p className="simple-page-variant-list-item-meta">
                              {variant.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>

                          <Link
                            to={`/variants/${variant.id}/edit`}
                            state={{
                              returnTo: `/exercises/${safeExercise.id}/edit`,
                            }}
                            className="simple-page-btn simple-page-btn-secondary simple-page-variant-edit-btn"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
      </div>
    </div>
  );
}