import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { ExerciseVariant } from "../types/exercise";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/simple-page.css";

export default function EditVariantPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const updateExerciseVariant = useAppStore(
    (state) => state.updateExerciseVariant,
  );
  const workoutLogs = useAppStore((state) => state.workoutLogs);

  const variant = useMemo(
    () => exerciseVariants.find((item) => item.id === variantId),
    [exerciseVariants, variantId],
  );

  if (!variant) {
    return (
      <div className="simple-page">
        <div className="simple-page-container">
          <div className="simple-page-card">
            <h1 className="simple-page-title">Variant not found</h1>
            <p className="simple-page-subtitle">
              The selected variant does not exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const safeVariant = variant;

  const parentExercise = exercises.find(
    (exercise) => exercise.id === safeVariant.exerciseId,
  );

  const variantLogCount = workoutLogs.filter(
    (log) => log.variantId === safeVariant.id,
  ).length;

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/exercises";

  const [name, setName] = useState(safeVariant.name);
  const [setup, setSetup] = useState(
    safeVariant.gymLabel ?? safeVariant.equipment ?? "",
  );
  const [notes, setNotes] = useState(safeVariant.notes ?? "");
  const [isActive, setIsActive] = useState(safeVariant.isActive);
  const [error, setError] = useState("");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

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
      (item) =>
        item.id !== safeVariant.id &&
        item.exerciseId === safeVariant.exerciseId &&
        item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (variantNameAlreadyExists) {
      setError("A variant with that name already exists for this exercise.");
      return;
    }

    const updatedVariant: ExerciseVariant = {
      ...safeVariant,
      name: trimmedName,
      gymLabel: trimmedSetup || undefined,
      equipment: undefined,
      notes: trimmedNotes || undefined,
      isActive,
    };

    updateExerciseVariant(updatedVariant);
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

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <div className="simple-page-card">
          <div className="simple-page-back-row">
            <PageBackButton fallbackTo="/exercises" />
          </div>
          <h1 className="simple-page-title">Edit variant</h1>
          <p className="simple-page-subtitle">
            Update the variant for{" "}
            <strong>{parentExercise?.name ?? "Unknown exercise"}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="simple-page-card">
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
                Use this for whatever helps you recognize the setup in your gym.
              </p>
            </div>

            <div className="simple-page-field">
              <label className="simple-page-label" htmlFor="variant-notes">
                Notes
              </label>
              <textarea
                id="variant-notes"
                className="simple-page-textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
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
                {variantLogCount > 0
                  ? `This variant has ${variantLogCount} log${
                      variantLogCount === 1 ? "" : "s"
                    }. Deactivating it will keep existing history but hide it from new selections.`
                  : "Inactive variants stay in history but should not be used for new selections."}
              </p>
            </div>

            {showStatusConfirm && (
              <div className="simple-page-inline-confirm">
                <p className="simple-page-inline-confirm-title">
                  {isActive ? "Deactivate variant?" : "Reactivate variant?"}
                </p>
                <p className="simple-page-inline-confirm-text">
                  {isActive
                    ? "The variant will stay in your history, but it should no longer appear for new routine selections."
                    : "The variant will become available again for new routine selections."}
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
        </form>
      </div>
    </div>
  );
}
