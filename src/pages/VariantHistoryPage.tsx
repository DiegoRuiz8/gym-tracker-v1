import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getLogsForVariant,
  getVariantById,
} from "../store/selectors";
import { formatLogDate, formatPerformedSetsDetailed } from "../utils/format";
import "../styles/variant-history.css";

export default function VariantHistoryPage() {
  const { variantId } = useParams();
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(
    null,
  );

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const routines = useAppStore((state) => state.routines);
  const deleteWorkoutLog = useAppStore((state) => state.deleteWorkoutLog);

  const variant = useMemo(
    () => (variantId ? getVariantById(exerciseVariants, variantId) : undefined),
    [exerciseVariants, variantId],
  );

  const exercise = useMemo(
    () =>
      variant ? getExerciseById(exercises, variant.exerciseId) : undefined,
    [exercises, variant],
  );

  const logs = useMemo(
    () => (variantId ? getLogsForVariant(workoutLogs, variantId) : []),
    [workoutLogs, variantId],
  );

  if (!variantId || !variant || !exercise) {
    return <p>Variant not found.</p>;
  }

  function getRoutineName(routineId?: string): string {
    if (!routineId) return "Unknown routine";

    const routine = routines.find((item) => item.id === routineId);
    return routine?.name ?? "Unknown routine";
  }

  function handleRequestDelete(logId: string) {
    setPendingDeleteLogId(logId);
  }

  function handleCancelDelete() {
    setPendingDeleteLogId(null);
  }

  function handleConfirmDelete(logId: string) {
    deleteWorkoutLog(logId);
    setPendingDeleteLogId(null);
  }

  return (
    <div className="variant-history-page">
      <div className="variant-history-container">
        <header className="variant-history-header">
          <p className="variant-history-back-link">
            <Link to="/history">History</Link>
          </p>

          <h1 className="variant-history-title">{variant.name}</h1>
          <p className="variant-history-subtitle">{exercise.name}</p>
          <p className="variant-history-meta">
            {logs.length} log{logs.length === 1 ? "" : "s"}
          </p>
        </header>

        {logs.length === 0 ? (
          <div className="variant-history-card">
            <h2 className="variant-history-card-title">No logs yet</h2>
            <p className="variant-history-card-text">
              This variant does not have any recorded sessions yet.
            </p>
          </div>
        ) : (
          <div className="variant-history-list">
            {logs.map((log) => {
              const setLines = formatPerformedSetsDetailed(log);

              return (
                <div key={log.id} className="variant-history-card">
                  <div className="variant-history-log-header">
                    <div className="variant-history-log-info">
                      <h2 className="variant-history-card-title">
                        {formatLogDate(log.date)}
                      </h2>
                      <p className="variant-history-routine">
                        {getRoutineName(log.routineId)}
                      </p>
                    </div>

                    <div className="variant-history-actions-wrapper">
                      <div className="variant-history-actions">
                        <Link
                          to={`/history/log/${log.id}/edit`}
                          state={{ returnTo: `/history/variant/${variantId}` }}
                          className="variant-history-btn variant-history-btn-secondary variant-history-btn-link"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className="variant-history-btn variant-history-btn-danger"
                          onClick={() => handleRequestDelete(log.id)}
                        >
                          Delete
                        </button>
                      </div>

                      {pendingDeleteLogId === log.id && (
                        <div className="variant-history-delete-confirm-inline">
                          <p className="variant-history-delete-text">
                            Delete log?
                          </p>

                          <div className="variant-history-delete-actions">
                            <button
                              type="button"
                              className="variant-history-btn variant-history-btn-danger "
                              onClick={() => handleConfirmDelete(log.id)}
                            >
                              Confirm
                            </button>

                            <button
                              type="button"
                              className="variant-history-btn variant-history-btn-secondary "
                              onClick={handleCancelDelete}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="variant-history-sets">
                    {setLines.map((line, index) => (
                      <div key={index} className="variant-history-set-line">
                        <span className="variant-history-set-index">
                          Set {index + 1}
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  {log.notes && (
                    <p className="variant-history-notes">{log.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
