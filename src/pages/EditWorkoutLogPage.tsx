import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getVariantById,
  getWorkoutLogById,
} from "../store/selectors";
import { formatLatestPerformance, formatLogDate } from "../utils/format";
import {
  mapLogToSetInputs,
  createEmptySetInput,
  type SetInput,
} from "../utils/logForm";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/new-workout-log.css";

export default function EditWorkoutLogPage() {
  const { logId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const updateWorkoutLog = useAppStore((state) => state.updateWorkoutLog);

  const log = useMemo(
    () => (logId ? getWorkoutLogById(workoutLogs, logId) : undefined),
    [workoutLogs, logId],
  );

  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    (log ? `/history/variant/${log.variantId}` : "/history");

  const routine = useMemo(
    () => routines.find((item) => item.id === log?.routineId),
    [routines, log],
  );

  const variant = useMemo(
    () => (log ? getVariantById(exerciseVariants, log.variantId) : undefined),
    [exerciseVariants, log],
  );

  const exercise = useMemo(
    () =>
      variant ? getExerciseById(exercises, variant.exerciseId) : undefined,
    [exercises, variant],
  );

  const [date, setDate] = useState(log?.date ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [sets, setSets] = useState<SetInput[]>(() => mapLogToSetInputs(log));
  const [error, setError] = useState("");

  if (!log || !routine || !variant || !exercise) {
    return <p>Log not found.</p>;
  }

  const safeLog = log;
  const safeRoutine = routine;
  const safeVariant = variant;

  function handleSetChange(
    index: number,
    field: keyof SetInput,
    value: string,
  ) {
    setSets((currentSets) =>
      currentSets.map((set, i) =>
        i === index ? { ...set, [field]: value } : set,
      ),
    );
  }

  function handleAddSet() {
    setSets((currentSets) => [...currentSets, createEmptySetInput()]);
  }

  function handleRemoveSet(indexToRemove: number) {
    setSets((currentSets) => {
      if (currentSets.length === 1) {
        return currentSets;
      }

      return currentSets.filter((_, index) => index !== indexToRemove);
    });
  }

  function getCurrentSetText(index: number): string {
    const currentSet = safeLog.performedSets[index];

    if (!currentSet) return "—";

    return `${currentSet.weight} kg × ${currentSet.reps}`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const performedSets = sets
      .map((set) => ({
        reps: Number(set.reps),
        weight: Number(set.weight),
      }))
      .filter((set) => !Number.isNaN(set.reps) && !Number.isNaN(set.weight));

    if (performedSets.length === 0) {
      setError("Add at least one valid set.");
      return;
    }

    setError("");

    updateWorkoutLog({
      ...safeLog,
      date,
      performedSets,
      notes: notes.trim() || undefined,
    });

    navigate(returnTo);
  }

  return (
    <div className="new-workout-log-page">
      <div className="new-workout-log-container">
        <div className="new-workout-log-card">
          <div className="new-workout-log-back-row">
            <PageBackButton fallbackTo={returnTo} />
          </div>
          <div className="new-workout-log-header-top">
            <h1 className="new-workout-log-header-title">Edit log</h1>
            <p className="new-workout-log-header-subtitle">
              {safeVariant.name}
            </p>
          </div>

          <p className="new-workout-log-header-line">
            <strong>Routine:</strong> {safeRoutine.name}
          </p>

          <div className="new-workout-log-header-previous-row">
            <p className="new-workout-log-header-line">
              <strong>Current:</strong> {formatLatestPerformance(safeLog)}
            </p>

            <p className="new-workout-log-header-meta">
              {formatLogDate(safeLog.date)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="new-workout-log-card">
            <div className="new-workout-log-section-top">
              <h2 className="new-workout-log-section-title">Workout log</h2>

              <div className="new-workout-log-date-field">
                <label className="new-workout-log-label" htmlFor="workout-date">
                  Date
                </label>
                <input
                  id="workout-date"
                  className="new-workout-log-date-input"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>

            <div className="new-workout-log-table-head">
              <div>Set</div>
              <div>Current</div>
              <div>Kg</div>
              <div>Reps</div>
              <div></div>
            </div>

            <div className="new-workout-log-rows">
              {sets.map((set, index) => (
                <div key={index} className="new-workout-log-row">
                  <div className="new-workout-log-row-set">
                    <span className="new-workout-log-row-set-label">Set</span>
                    <span className="new-workout-log-row-set-value">
                      {index + 1}
                    </span>
                  </div>

                  <div className="new-workout-log-row-prev">
                    <span className="new-workout-log-mobile-label">
                      Current
                    </span>
                    {getCurrentSetText(index)}
                  </div>

                  <div className="new-workout-log-row-input-wrap">
                    <label
                      className="new-workout-log-mobile-label"
                      htmlFor={`set-weight-${index}`}
                    >
                      Kg
                    </label>
                    <input
                      id={`set-weight-${index}`}
                      className="new-workout-log-number-input"
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight}
                      onChange={(event) =>
                        handleSetChange(index, "weight", event.target.value)
                      }
                    />
                  </div>

                  <div className="new-workout-log-row-input-wrap">
                    <label
                      className="new-workout-log-mobile-label"
                      htmlFor={`set-reps-${index}`}
                    >
                      Reps
                    </label>
                    <input
                      id={`set-reps-${index}`}
                      className="new-workout-log-number-input"
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(event) =>
                        handleSetChange(index, "reps", event.target.value)
                      }
                    />
                  </div>

                  <button
                    className="new-workout-log-btn new-workout-log-btn-remove"
                    type="button"
                    onClick={() => handleRemoveSet(index)}
                    disabled={sets.length === 1}
                    aria-label={`Remove set ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="new-workout-log-actions-row">
              <button
                className="new-workout-log-btn new-workout-log-btn-tertiary"
                type="button"
                onClick={handleAddSet}
              >
                + Add set
              </button>
            </div>
          </div>

          <div className="new-workout-log-card">
            <h2 className="new-workout-log-section-title">Notes</h2>

            <textarea
              className="new-workout-log-textarea"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          {error && <p className="new-workout-log-error">{error}</p>}

          <div className="new-workout-log-footer-actions">
            <button
              className="new-workout-log-btn new-workout-log-btn-primary"
              type="submit"
            >
              Save changes
            </button>

            <button
              className="new-workout-log-btn new-workout-log-btn-secondary"
              type="button"
              onClick={() => navigate(returnTo)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
