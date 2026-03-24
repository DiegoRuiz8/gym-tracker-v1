import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { generateId } from "../utils/ids";
import { EXERCISE_CATEGORY_OPTIONS } from "../utils/exerciseCategories";
import type { Exercise } from "../types/exercise";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/simple-page.css";

export default function NewExercisePage() {
  const navigate = useNavigate();
  const exercises = useAppStore((state) => state.exercises);
  const addExercise = useAppStore((state) => state.addExercise);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [muscleGroups, setMuscleGroups] = useState("");
  const [notes, setNotes] = useState("");
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
      (exercise) =>
        exercise.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      setError("An exercise with that name already exists.");
      return;
    }

    const parsedMuscleGroups = muscleGroups
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const now = new Date().toISOString();

const newExercise: Exercise = {
  id: generateId(),
  name: trimmedName,
  category: category || undefined,
  muscleGroups:
    parsedMuscleGroups.length > 0 ? parsedMuscleGroups : undefined,
  notes: trimmedNotes || undefined,
  createdAt: now,
  updatedAt: now,
};

    addExercise(newExercise);
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
            <h1 className="simple-page-title">New exercise</h1>
            <p className="simple-page-subtitle">
              Create a new base exercise for your library.
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
                  placeholder="e.g. Chest Press"
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