import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { getExerciseById, getVariantById } from "../store/selectors";
import {
  formatLogDate,
  formatSetPerformanceInline,
  getDateKey,
} from "../utils/format";
import "../styles/history-page.css";

type HistoryGroup = {
  dateKey: string;
  logs: ReturnType<typeof buildLogItems>;
};

function buildLogItems(
  workoutLogs: ReturnType<typeof useAppStore.getState>["workoutLogs"],
  routines: ReturnType<typeof useAppStore.getState>["routines"],
  exerciseVariants: ReturnType<typeof useAppStore.getState>["exerciseVariants"],
  exercises: ReturnType<typeof useAppStore.getState>["exercises"],
) {
  return workoutLogs.map((log) => {
    const routine = routines.find((item) => item.id === log.routineId);
    const variant = getVariantById(exerciseVariants, log.variantId);
    const exercise = variant
      ? getExerciseById(exercises, variant.exerciseId)
      : undefined;

    return {
      log,
      routine,
      variant,
      exercise,
      dateKey: getDateKey(log.date),
    };
  });
}

export default function HistoryPage() {
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(
    null,
  );

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const routines = useAppStore((state) => state.routines);
  const deleteWorkoutLog = useAppStore((state) => state.deleteWorkoutLog);

  const logItems = useMemo(
    () => buildLogItems(workoutLogs, routines, exerciseVariants, exercises),
    [workoutLogs, routines, exerciseVariants, exercises],
  );

  const groupedHistory = useMemo(() => {
    const groupsMap = new Map<string, typeof logItems>();

    logItems.forEach((item) => {
      const existing = groupsMap.get(item.dateKey) ?? [];
      existing.push(item);
      groupsMap.set(item.dateKey, existing);
    });

    return Array.from(groupsMap.entries())
      .map(([dateKey, logs]) => ({
        dateKey,
        logs: [...logs].sort((a, b) =>
          b.log.createdAt.localeCompare(a.log.createdAt),
        ),
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [logItems]);

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
    <div className="history-page">
      <div className="history-page-container">
        <header className="history-page-header">
          <h1 className="history-page-title">History</h1>
          <p className="history-page-description">
            Review all recorded logs grouped by date.
          </p>
        </header>

        {groupedHistory.length === 0 ? (
          <p className="history-page-empty">No logs found.</p>
        ) : (
          <div className="history-page-groups">
            {groupedHistory.map((group) => (
              <section key={group.dateKey} className="history-page-group">
                <h2 className="history-page-group-title">
                  {formatLogDate(group.dateKey)}
                </h2>

                {group.logs.map(({ log, routine, variant }) => (
                  <div key={log.id} className="history-page-card">
                    <div className="history-page-card-top">
                      <div>
                        <h3 className="history-page-card-title">
                          {variant?.name ?? "Unknown variant"}
                        </h3>
                        <p className="history-page-card-routine">
                          {routine?.name ?? "Unknown routine"}
                        </p>
                      </div>
                    </div>

                    <p className="history-page-card-performance">
                      <strong>Sets:</strong> {formatSetPerformanceInline(log)}
                    </p>

                    <div className="history-page-card-actions">
                      <Link
                        to={`/history/log/${log.id}/edit`}
                        state={{ returnTo: "/history" }}
                        className="history-page-btn history-page-btn-secondary history-page-btn-link"
                      >
                        Edit
                      </Link>

                      {variant && (
                        <Link
                          to={`/history/variant/${variant.id}`}
                          className="history-page-btn history-page-btn-secondary history-page-btn-link"
                        >
                          View variant
                        </Link>
                      )}

                      <button
                        type="button"
                        className="history-page-btn history-page-btn-danger"
                        onClick={() => handleRequestDelete(log.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {pendingDeleteLogId === log.id && (
                      <div className="history-page-delete-confirm">
                        <p className="history-page-delete-text">Delete log?</p>

                        <div className="history-page-delete-actions">
                          <button
                            type="button"
                            className="history-page-btn history-page-btn-danger"
                            onClick={() => handleConfirmDelete(log.id)}
                          >
                            Confirm
                          </button>

                          <button
                            type="button"
                            className="history-page-btn history-page-btn-secondary"
                            onClick={handleCancelDelete}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
