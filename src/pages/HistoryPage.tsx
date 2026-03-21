import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { getExerciseById, getVariantById } from "../store/selectors";
import {
  formatLogDate,
  formatSetPerformanceInline,
  getDateKey,
} from "../utils/format";
import "../styles/history-page.css";

const HISTORY_SCROLL_KEY = "history-page-scroll-y";

type HistoryRange = "all" | "week" | "month";

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

function getDaysDiffFromToday(dateString: string): number {
  const today = new Date();
  const target = new Date(`${dateString}T00:00:00`);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diffMs = todayStart.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function HistoryPage() {
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(
    null,
  );
  const [activeRange, setActiveRange] = useState<HistoryRange>("all");
  const [search, setSearch] = useState("");

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutLogs = useAppStore((state) => state.workoutLogs);
  const routines = useAppStore((state) => state.routines);
  const preferredWeightUnit = useAppStore(
    (state) => state.preferredWeightUnit,
  );
  const deleteWorkoutLog = useAppStore((state) => state.deleteWorkoutLog);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(HISTORY_SCROLL_KEY);

    if (!savedScroll) {
      return;
    }

    const parsed = Number(savedScroll);

    if (!Number.isNaN(parsed)) {
      window.scrollTo(0, parsed);
    }
  }, []);

  function saveCurrentScroll() {
    sessionStorage.setItem(HISTORY_SCROLL_KEY, String(window.scrollY));
  }

  const logItems = useMemo(
    () => buildLogItems(workoutLogs, routines, exerciseVariants, exercises),
    [workoutLogs, routines, exerciseVariants, exercises],
  );

  const rangeFilteredLogItems = useMemo(() => {
    if (activeRange === "all") {
      return logItems;
    }

    const maxDays = activeRange === "week" ? 7 : 30;

    return logItems.filter((item) => {
      const daysDiff = getDaysDiffFromToday(item.log.date);
      return daysDiff >= 0 && daysDiff < maxDays;
    });
  }, [logItems, activeRange]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredLogItems = useMemo(() => {
    if (!normalizedSearch) {
      return rangeFilteredLogItems;
    }

    return rangeFilteredLogItems.filter((item) => {
      const exerciseName = item.exercise?.name ?? "";
      const variantName = item.variant?.name ?? "";
      const routineName = item.routine?.name ?? "";
      const notes = item.log.notes ?? "";

      return (
        exerciseName.toLowerCase().includes(normalizedSearch) ||
        variantName.toLowerCase().includes(normalizedSearch) ||
        routineName.toLowerCase().includes(normalizedSearch) ||
        notes.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [rangeFilteredLogItems, normalizedSearch]);

  const groupedHistory = useMemo(() => {
    const groupsMap = new Map<string, typeof filteredLogItems>();

    filteredLogItems.forEach((item) => {
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
  }, [filteredLogItems]);

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

        <div className="history-page-controls">
          <div className="history-page-search-wrap">
            <input
              type="text"
              className="history-page-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exercise, variant, or routine..."
              aria-label="Search history"
            />
          </div>

          <div className="history-page-filters">
            <button
              type="button"
              className={`history-page-filter-chip ${
                activeRange === "all" ? "history-page-filter-chip-active" : ""
              }`}
              onClick={() => setActiveRange("all")}
            >
              All
            </button>

            <button
              type="button"
              className={`history-page-filter-chip ${
                activeRange === "week" ? "history-page-filter-chip-active" : ""
              }`}
              onClick={() => setActiveRange("week")}
            >
              Week
            </button>

            <button
              type="button"
              className={`history-page-filter-chip ${
                activeRange === "month" ? "history-page-filter-chip-active" : ""
              }`}
              onClick={() => setActiveRange("month")}
            >
              Month
            </button>
          </div>
        </div>

        {groupedHistory.length === 0 ? (
          <div className="history-page-empty-state">
            <h2 className="history-page-empty-title">No logs found</h2>
            <p className="history-page-empty-text">
              There are no workout logs for the selected filters.
            </p>
          </div>
        ) : (
          <div className="history-page-groups">
            {groupedHistory.map((group) => (
              <section key={group.dateKey} className="history-page-group">
                <h2 className="history-page-group-title">
                  {formatLogDate(group.dateKey)}
                </h2>

                <div className="history-page-group-list">
                  {group.logs.map(({ log, routine, variant, exercise }) => (
                    <div key={log.id} className="history-page-card">
                      <div className="history-page-card-header">
                        <div className="history-page-card-title-row">
                          <div className="history-page-card-info">
                            <h3 className="history-page-card-title">
                              {exercise?.name ?? "Unknown exercise"}
                              <span className="history-page-card-title-separator">
                                {" "}
                                –{" "}
                              </span>
                              <span className="history-page-card-title-variant">
                                {variant?.name ?? "Unknown variant"}
                              </span>
                            </h3>
                          </div>

                          <button
                            type="button"
                            className="history-page-delete-icon"
                            onClick={() => handleRequestDelete(log.id)}
                            aria-label="Delete log"
                            title="Delete log"
                          >
                            ×
                          </button>
                        </div>

                        {pendingDeleteLogId === log.id && (
                          <div className="history-page-delete-confirm">
                            <p className="history-page-delete-text">
                              Delete log?
                            </p>
                            <p className="history-page-delete-subtext">
                              This workout entry will be permanently removed.
                            </p>

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

                        <div className="history-page-card-meta-row">
                          <p className="history-page-card-routine">
                            {routine?.name ?? "Unknown routine"}
                          </p>

                          <div className="history-page-card-secondary-actions">
                            <Link
                              to={`/history/log/${log.id}/edit`}
                              state={{ returnTo: "/history" }}
                              className="history-page-card-action-chip"
                              onClick={saveCurrentScroll}
                            >
                              Edit
                            </Link>

                            {variant && (
                              <Link
                                to={`/history/variant/${variant.id}`}
                                state={{ returnTo: "/history" }}
                                className="history-page-card-action-chip"
                                onClick={saveCurrentScroll}
                              >
                                View variant
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="history-page-card-performance">
                        <strong>Sets:</strong>{" "}
                        {formatSetPerformanceInline(log, preferredWeightUnit)}
                      </p>

                      {log.notes && (
                        <p className="history-page-card-notes">
                          <strong>Notes:</strong> {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}