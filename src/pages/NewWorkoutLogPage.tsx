import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getLogsForVariant,
  getVariantById,
} from "../store/selectors";
import {
  formatLogDate,
  formatPrescriptionInline,
  formatSetPerformanceInline
} from "../utils/format";
import { generateId } from "../utils/ids";
import {
  buildInitialSetInputs,
  createEmptySetInput,
  type SetInput,
} from "../utils/logForm";
import "../styles/new-workout-log.css";

export default function NewWorkoutLogPage() {
  const { routineId, variantId } = useParams();
  const navigate = useNavigate();

  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
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
    () => routine?.exerciseRefs.find((ref) => ref.variantId === variantId),
    [routine, variantId],
  );

  const logsForVariant = useMemo(
    () => (variantId ? getLogsForVariant(workoutLogs, variantId) : []),
    [workoutLogs, variantId],
  );

  const lastLog = logsForVariant[0];
  const initialSetCount = routineExerciseRef?.prescription.sets ?? 3;

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<SetInput[]>(() =>
    buildInitialSetInputs(lastLog, initialSetCount),
  );

  if (!routine || !variant || !exercise || !variantId) {
    return <p>Missing routine or variant data.</p>;
  }

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

  function getPreviousSetText(index: number): string {
    if (!lastLog) return "—";

    const previousSet = lastLog.performedSets[index];

    if (!previousSet) return "—";

    return `${previousSet.weight} kg × ${previousSet.reps}`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!routine || !variant || !exercise) {
      return;
    }

    const performedSets = sets
      .map((set) => ({
        reps: Number(set.reps),
        weight: Number(set.weight),
      }))
      .filter((set) => !Number.isNaN(set.reps) && !Number.isNaN(set.weight));

    if (performedSets.length === 0) {
      alert("Add at least one valid set.");
      return;
    }

    const newLog = {
      id: generateId(),
      date,
      routineId: routine.id,
      exerciseId: exercise.id,
      variantId: variant.id,
      performedSets,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addWorkoutLog(newLog);
    navigate(`/routines/${routine.id}`);
  }

  return (
    <div className="new-workout-log-page">
      <div className="new-workout-log-container">
        <div className="new-workout-log-card">
          <h1 className="new-workout-log-header-title">{variant.name}</h1>

          <p className="new-workout-log-header-subtitle">{routine.name}</p>

          {routineExerciseRef && (
            <p className="new-workout-log-header-line">
              <strong>Target:</strong>{" "}
              {formatPrescriptionInline(routineExerciseRef.prescription)}
            </p>
          )}

          <p className="new-workout-log-header-line">
            <strong>Previous:</strong> {formatSetPerformanceInline(lastLog)}
          </p>

          <p className="new-workout-log-header-meta">
            {formatLogDate(lastLog?.date)} • {logsForVariant.length} log
            {logsForVariant.length === 1 ? "" : "s"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="new-workout-log-card">
            <h2 className="new-workout-log-section-title">Date</h2>

            <div className="new-workout-log-date-field">
              <input
                className="new-workout-log-date-input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="new-workout-log-table-head">
              <div>Set</div>
              <div>Prev</div>
              <div>Kg</div>
              <div>Reps</div>
              <div></div>
            </div>

            {sets.map((set, index) => (
              <div key={index} className="new-workout-log-table-row">
                <div className="new-workout-log-set-index">{index + 1}</div>

                <div className="new-workout-log-prev">
                  {getPreviousSetText(index)}
                </div>

                <input
                  className="new-workout-log-number-input"
                  type="number"
                  min="0"
                  step="0.5"
                  value={set.weight}
                  onChange={(event) =>
                    handleSetChange(index, "weight", event.target.value)
                  }
                />

                <input
                  className="new-workout-log-number-input"
                  type="number"
                  min="0"
                  value={set.reps}
                  onChange={(event) =>
                    handleSetChange(index, "reps", event.target.value)
                  }
                />

                <button
                  className="new-workout-log-btn new-workout-log-btn-remove"
                  type="button"
                  onClick={() => handleRemoveSet(index)}
                  disabled={sets.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

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

          <div className="new-workout-log-footer-actions">
            <button
              className="new-workout-log-btn new-workout-log-btn-primary"
              type="submit"
            >
              Save sets
            </button>

            <button
              className="new-workout-log-btn new-workout-log-btn-secondary"
              type="button"
              onClick={() => navigate(`/routines/${routine.id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}