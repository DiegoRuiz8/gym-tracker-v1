import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import type { Exercise } from "../types/exercise";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/simple-page.css";

export default function EditExercisePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const updateExercise = useAppStore((state) => state.updateExercise);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === exerciseId),
    [exercises, exerciseId],
  );

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
    navigate("/exercises");
  }

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <div className="simple-page-card">
          <div className="simple-page-card-body">
            <div className="simple-page-back-row">
              <PageBackButton fallbackTo="/exercises" />
            </div>
            <h1 className="simple-page-title">Edit exercise</h1>
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
                  id="exercise-notes"
                  className="simple-page-textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="simple-page-field">
                <label className="simple-page-label">Variants</label>

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
                      >
                        Add variant
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="simple-page-linked-list">
                    {linkedVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="simple-page-linked-list-item"
                      >
                        <div className="simple-page-linked-list-item-main">
                          <p className="simple-page-linked-list-item-title">
                            {variant.name}
                          </p>
                          <p className="simple-page-linked-list-item-meta">
                            {variant.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>

                        <Link
                          to={`/variants/${variant.id}/edit`}
                          state={{
                            returnTo: `/exercises/${safeExercise.id}/edit`,
                          }}
                          className="simple-page-btn simple-page-btn-secondary"
                        >
                          Edit variant
                        </Link>
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
                  onClick={() => navigate("/exercises")}
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