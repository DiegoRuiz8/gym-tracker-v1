import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getLogsForVariant,
  getVariantById,
} from "../store/selectors";
import {
  formatLogDate,
  formatPrescriptionInline,
  formatSetPerformanceInline,
  formatSingleWeight,
  getTodayDateInputValue,
  kgToLb,
  lbToKg,
} from "../utils/format";
import { generateId } from "../utils/ids";
import {
  buildInitialSetInputs,
  createEmptySetInput,
  type SetInput,
} from "../utils/logForm";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/new-workout-log.css";

export default function NewWorkoutLogPage() {
  const { routineId, variantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const addWorkoutLog = useAppStore((state) => state.addWorkoutLog);

  const routine = useMemo(
    () => routines.find((item) => item.id === routineId),
    [routines, routineId],
  );

  const variant = useMemo(
    () => (variantId ? getVariantById(exerciseVariants, variantId) : undefined),
    [exerciseVariants, variantId],
  );

  const exercise = useMemo(
    () =>
      variant ? getExerciseById(exercises, variant.exerciseId) : undefined,
    [exercises, variant],
  );

  const routineExerciseRef = useMemo(
    () =>
      routine && exercise
        ? routine.exerciseRefs.find((ref) => ref.exerciseId === exercise.id)
        : undefined,
    [routine, exercise],
  );

  const logsForVariant = useMemo(
    () => (variantId ? getLogsForVariant(workoutLogs, variantId) : []),
    [workoutLogs, variantId],
  );

  const availableSwapVariants = useMemo(() => {
    if (!exercise) {
      return [];
    }

    return exerciseVariants.filter(
      (item) => item.exerciseId === exercise.id && item.isActive,
    );
  }, [exerciseVariants, exercise]);

  const lastLog = logsForVariant[0];
  const initialSetCount = routineExerciseRef?.prescription.sets ?? 3;

  const [date, setDate] = useState(() => getTodayDateInputValue());
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<SetInput[]>(() =>
    buildInitialSetInputs(lastLog, initialSetCount),
  );
  const [error, setError] = useState("");
  const [showSwapOptions, setShowSwapOptions] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setSets(buildInitialSetInputs(lastLog, initialSetCount));
    setNotes("");
    setError("");
    setShowSwapOptions(false);
  }, [variantId, lastLog?.id, initialSetCount]);

  if (!routine || !variant || !exercise || !variantId) {
    return (
      <div className="new-workout-log-page">
        <div className="new-workout-log-container">
          <div className="new-workout-log-card">
            <div className="new-workout-log-back-row">
              <PageBackButton fallbackTo="/routines" />
            </div>

            <p className="new-workout-log-error">
              Missing routine or variant data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const safeRoutine = routine;
  const safeVariant = variant;
  const safeExercise = exercise;
  const safeVariantId = variantId;

  const pageState =
    (location.state as {
      returnTo?: string;
      restoreDetailScroll?: boolean;
    } | null) ?? null;

  const returnTo = pageState?.returnTo ?? `/routines/${safeRoutine.id}`;
  const restoreDetailScroll = pageState?.restoreDetailScroll ?? false;

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

  function getPreviousSetText(index: number): string {
    if (!lastLog) {
      return "—";
    }

    const previousSet = lastLog.performedSets[index];

    if (!previousSet) {
      return "—";
    }

    return `${formatSingleWeight(
      previousSet.weight,
      preferredWeightUnit,
    )} × ${previousSet.reps}`;
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

  function handleSwapVariant(nextVariantId: string) {
    if (nextVariantId === safeVariantId) {
      setShowSwapOptions(false);
      return;
    }

    navigate(`/routines/${safeRoutine.id}/log/${nextVariantId}`, {
      state: {
        returnTo,
        restoreDetailScroll,
      },
    });
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

    const newLog = {
      id: generateId(),
      date,
      routineId: safeRoutine.id,
      exerciseId: safeExercise.id,
      variantId: safeVariantId,
      performedSets,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addWorkoutLog(newLog);
    navigate(returnTo, {
      state: restoreDetailScroll ? { restoreDetailScroll: true } : undefined,
    });
  }

  return (
    <div className="new-workout-log-page">
      <div className="new-workout-log-container">
        <div className="new-workout-log-card new-workout-log-card-header">
          <div className="new-workout-log-header-meta-row">
            <div className="new-workout-log-back-row">
              <PageBackButton fallbackTo={returnTo} />
            </div>

            <p className="new-workout-log-routine-tag">{safeRoutine.name}</p>
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

              <div className="new-workout-log-header-actions">
                <button
                  type="button"
                  className="new-workout-log-swap-btn"
                  onClick={() => setShowSwapOptions((current) => !current)}
                  aria-expanded={showSwapOptions}
                >
                  ⇄ Swap
                </button>
              </div>
            </div>
          </div>

          {showSwapOptions && (
            <div className="new-workout-log-swap-panel">
              <p className="new-workout-log-swap-label">Swap for today</p>

              <div className="new-workout-log-swap-options">
                {availableSwapVariants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`new-workout-log-swap-option ${
                      item.id === safeVariantId
                        ? "new-workout-log-swap-option-active"
                        : ""
                    }`}
                    onClick={() => handleSwapVariant(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {routineExerciseRef && (
            <p className="new-workout-log-header-line">
              <strong>Target:</strong>{" "}
              {formatPrescriptionInline(routineExerciseRef.prescription)}
            </p>
          )}

          <div className="new-workout-log-header-previous-row">
            <p className="new-workout-log-header-line">
              <strong>Previous:</strong>{" "}
              {formatSetPerformanceInline(lastLog, preferredWeightUnit)}
            </p>

            {lastLog?.date && (
              <p className="new-workout-log-header-meta">
                {formatLogDate(lastLog.date)}
              </p>
            )}
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
                  Previous
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
                        {getPreviousSetText(index)}
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
                Log sets
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
