import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getVariantById,
  getWorkoutLogById,
} from "../store/selectors";
import {
  formatLatestPerformance,
  formatLogDate,
  formatSingleWeight,
  kgToLb,
  lbToKg,
} from "../utils/format";
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
  const preferredWeightUnit = useAppStore(
    (state) => state.preferredWeightUnit,
  );
  const updateWorkoutLog = useAppStore((state) => state.updateWorkoutLog);

  const log = useMemo(
    () => (logId ? getWorkoutLogById(workoutLogs, logId) : undefined),
    [workoutLogs, logId],
  );

  const locationState =
    (location.state as
      | { returnTo?: string; restoreDetailScroll?: boolean }
      | null) ?? null;

  const returnTo =
    locationState?.returnTo ??
    (log ? `/history/variant/${log.variantId}` : "/history");

  const restoreDetailScroll = locationState?.restoreDetailScroll ?? false;

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
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  if (!log || !routine || !variant || !exercise) {
    return (
      <div className="new-workout-log-page">
        <div className="new-workout-log-container">
          <div className="new-workout-log-card">
            <div className="new-workout-log-back-row">
              <PageBackButton fallbackTo={returnTo} />
            </div>

            <p className="new-workout-log-error">Log not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const safeLog = log;
  const safeRoutine = routine;
  const safeVariant = variant;
  const safeExercise = exercise;

  function displayWeightFromStoredKg(valueKgString: string): string {
    const numericKg = Number(valueKgString);

    if (Number.isNaN(numericKg)) {
      return valueKgString;
    }

    return preferredWeightUnit === "lb"
      ? String(kgToLb(numericKg))
      : String(numericKg);
  }

  function storedKgFromDisplayWeight(valueString: string): string {
    const numericDisplay = Number(valueString);

    if (Number.isNaN(numericDisplay)) {
      return valueString;
    }

    return preferredWeightUnit === "lb"
      ? String(lbToKg(numericDisplay))
      : String(numericDisplay);
  }

  function handleSetChange(
    index: number,
    field: keyof SetInput,
    value: string,
  ) {
    setSets((currentSets) =>
      currentSets.map((set, i) => {
        if (i !== index) {
          return set;
        }

        if (field === "weight") {
          return {
            ...set,
            weight: storedKgFromDisplayWeight(value),
          };
        }

        return { ...set, [field]: value };
      }),
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

    if (!currentSet) {
      return "—";
    }

    return `${formatSingleWeight(
      currentSet.weight,
      preferredWeightUnit,
    )} × ${currentSet.reps}`;
  }

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

    navigate(returnTo, {
      state: restoreDetailScroll ? { restoreDetailScroll: true } : undefined,
    });
  }

  return (
    <div className="new-workout-log-page">
      <div className="new-workout-log-container">
        <div className="new-workout-log-card new-workout-log-card-header">
          <div className="new-workout-log-back-row">
            <PageBackButton fallbackTo={returnTo} />
          </div>

          <div className="new-workout-log-header-top">
            <div className="new-workout-log-title-wrap">
              <h1 className="new-workout-log-header-title">
                {safeExercise.name}
                <span className="new-workout-log-title-separator"> — </span>
                <span className="new-workout-log-header-variant">
                  {safeVariant.name}
                </span>
              </h1>
              <p className="new-workout-log-header-subtitle">Edit log</p>
            </div>
          </div>

          <p className="new-workout-log-header-line">
            <strong>Routine:</strong> {safeRoutine.name}
          </p>

          <div className="new-workout-log-header-previous-row">
            <p className="new-workout-log-header-line">
              <strong>Current:</strong>{" "}
              {formatLatestPerformance(safeLog, preferredWeightUnit)}
            </p>

            <p className="new-workout-log-header-meta">
              {formatLogDate(safeLog.date)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="new-workout-log-form">
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

            <div className="new-workout-log-table">
              <div className="new-workout-log-table-head">
                <div className="new-workout-log-table-col new-workout-log-table-col-set">
                  Set
                </div>
                <div className="new-workout-log-table-col new-workout-log-table-col-prev">
                  Current
                </div>
                <div className="new-workout-log-table-col new-workout-log-table-col-weight">
                  {preferredWeightUnit === "lb" ? "Lb" : "Kg"}
                </div>
                <div className="new-workout-log-table-col new-workout-log-table-col-reps">
                  Reps
                </div>
                <div className="new-workout-log-table-col new-workout-log-table-col-remove" />
              </div>

              <div className="new-workout-log-rows new-workout-log-rows-table">
                {sets.map((set, index) => (
                  <div
                    key={index}
                    className="new-workout-log-row new-workout-log-row-table"
                  >
                    <div className="new-workout-log-cell new-workout-log-cell-set">
                      <span className="new-workout-log-row-set-value">
                        {index + 1}
                      </span>
                    </div>

                    <div className="new-workout-log-cell new-workout-log-cell-prev">
                      <span className="new-workout-log-row-prev-value">
                        {getCurrentSetText(index)}
                      </span>
                    </div>

                    <div className="new-workout-log-cell new-workout-log-cell-input">
                      <input
                        id={`set-weight-${index}`}
                        className="new-workout-log-number-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value={displayWeightFromStoredKg(set.weight)}
                        onChange={(event) =>
                          handleSetChange(index, "weight", event.target.value)
                        }
                        aria-label={`Weight for set ${index + 1}`}
                      />
                    </div>

                    <div className="new-workout-log-cell new-workout-log-cell-input">
                      <input
                        id={`set-reps-${index}`}
                        className="new-workout-log-number-input"
                        type="number"
                        min="0"
                        value={set.reps}
                        onChange={(event) =>
                          handleSetChange(index, "reps", event.target.value)
                        }
                        aria-label={`Reps for set ${index + 1}`}
                      />
                    </div>

                    <div className="new-workout-log-cell new-workout-log-cell-remove">
                      <button
                        className="new-workout-log-remove-icon"
                        type="button"
                        onClick={() => handleRemoveSet(index)}
                        disabled={sets.length === 1}
                        aria-label={`Remove set ${index + 1}`}
                        title="Remove set"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
              ref={notesRef}
              className="new-workout-log-textarea new-workout-log-textarea-compact"
              rows={1}
              value={notes}
              onChange={(event) => handleNotesChange(event.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          {error && <p className="new-workout-log-error">{error}</p>}

          <div className="new-workout-log-footer-card">
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
        </form>
      </div>
    </div>
  );
}