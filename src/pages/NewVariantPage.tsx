import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { generateId } from "../utils/ids";
import type { ExerciseVariant } from "../types/exercise";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/simple-page.css";

export default function NewVariantPage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const addExerciseVariant = useAppStore((state) => state.addExerciseVariant);

  const exercise = exercises.find((item) => item.id === exerciseId);

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/exercises";

  const [name, setName] = useState("");
  const [setup, setSetup] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

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
      setError("Variant name is required.");
      return;
    }

    const variantNameAlreadyExists = exerciseVariants.some(
      (variant) =>
        variant.exerciseId === safeExercise.id &&
        variant.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (variantNameAlreadyExists) {
      setError("A variant with that name already exists for this exercise.");
      return;
    }

    const newVariant: ExerciseVariant = {
      id: generateId(),
      exerciseId: safeExercise.id,
      name: trimmedName,
      gymLabel: trimmedSetup || undefined,
      equipment: undefined,
      notes: trimmedNotes || undefined,
      isActive: true,
      trackingType: "weight_reps",
      createdAt: new Date().toISOString(),
    };

    addExerciseVariant(newVariant);
    navigate(returnTo);
  }

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-card simple-page-card-compact simple-page-hero-card-compact">
          <div className="simple-page-card-body simple-page-card-body-compact">
            <div className="simple-page-back-row">
              <PageBackButton fallbackTo="/exercises" />
            </div>

            <h1 className="simple-page-title simple-page-title-compact">
              New variant
            </h1>

            <div className="simple-page-context-chip-row">
              <span className="simple-page-context-chip-label">Exercise</span>
              <span className="simple-page-context-chip-value">
                {safeExercise.name}
              </span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="simple-page-card">
            <div className="simple-page-card-body">
              <div className="simple-page-field">
                <label className="simple-page-label" htmlFor="variant-name">
                  Variant name
                </label>
                <input
                  id="variant-name"
                  className="simple-page-input"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Dumbbell, Cable, Smith"
                />
              </div>

              <div className="simple-page-field">
                <label className="simple-page-label" htmlFor="variant-setup">
                  Setup
                </label>
                <input
                  id="variant-setup"
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
                <label className="simple-page-label" htmlFor="variant-notes">
                  Notes
                </label>
                <textarea
                  ref={notesRef}
                  id="variant-notes"
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
                  Save variant
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