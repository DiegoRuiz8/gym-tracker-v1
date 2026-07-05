// src/pages/HistoryPage.tsx

import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildResolvedWorkoutSessions } from "../store/selectors";
import { formatLogDate, formatSingleWeight } from "../utils/format";
import type { CompletedSet, WorkoutSessionExercise } from "../types/session";
import "../styles/history-page.css";

type HistoryRange = "all" | "week" | "month";

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

function formatTime(dateString?: string | null): string | null {
  if (!dateString) return null;

  return new Date(dateString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(
  startedAt?: string | null,
  endedAt?: string | null,
): string | null {
  if (!startedAt || !endedAt) return null;

  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();

  if (Number.isNaN(diffMs) || diffMs <= 0) return null;

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getRelevantSets(exercise: WorkoutSessionExercise): CompletedSet[] {
  return exercise.performedSets.filter((set) => {
    const hasPerformanceData =
      set.reps != null || set.weight != null || set.durationSeconds != null;

    return set.isCompleted && hasPerformanceData;
  });
}

function formatSessionExercisePerformance(
  exercise: WorkoutSessionExercise,
  preferredWeightUnit: "kg" | "lb",
): string {
  const relevantSets = getRelevantSets(exercise);

  if (relevantSets.length === 0) {
    return "No completed sets";
  }

  const parts = relevantSets
    .map((set) => {
      if (set.durationSeconds != null && set.weight != null) {
        return `${formatSingleWeight(set.weight, preferredWeightUnit)} × ${set.durationSeconds}s`;
      }

      if (set.durationSeconds != null) {
        return `${set.durationSeconds}s`;
      }

      if (set.weight != null && set.reps != null) {
        return `${formatSingleWeight(set.weight, preferredWeightUnit)} × ${set.reps}`;
      }

      if (set.reps != null) {
        return `${set.reps} reps`;
      }

      if (set.weight != null) {
        return formatSingleWeight(set.weight, preferredWeightUnit);
      }

      return null;
    })
    .filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join(" • ") : "No completed sets";
}

export default function HistoryPage() {
  const [activeRange, setActiveRange] = useState<HistoryRange>("all");
  const [search, setSearch] = useState("");
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);

  const exercises = useAppStore((state) => state.exercises);
  const workoutSessions = useAppStore((state) => state.workoutSessions);
  const routines = useAppStore((state) => state.routines);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const deleteWorkoutSession = useAppStore(
    (state) => state.deleteWorkoutSession,
  );

  const sessionItems = useMemo(
    () => buildResolvedWorkoutSessions(workoutSessions, routines, exercises),
    [workoutSessions, routines, exercises],
  );

  const rangeFilteredSessionItems = useMemo(() => {
    if (activeRange === "all") {
      return sessionItems;
    }

    const maxDays = activeRange === "week" ? 7 : 30;

    return sessionItems.filter((item) => {
      const daysDiff = getDaysDiffFromToday(item.session.date);
      return daysDiff >= 0 && daysDiff < maxDays;
    });
  }, [sessionItems, activeRange]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredSessionItems = useMemo(() => {
    if (!normalizedSearch) {
      return rangeFilteredSessionItems;
    }

    return rangeFilteredSessionItems.filter((item) => {
      const routineName = item.routine?.name ?? "";
      const sessionNotes = item.session.notes ?? "";

      const exerciseText = item.exercises
        .map(({ exercise, sessionExercise }) =>
          [exercise?.name ?? "", sessionExercise.notes ?? ""].join(" "),
        )
        .join(" ");

      const haystack =
        `${routineName} ${sessionNotes} ${exerciseText}`.toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [rangeFilteredSessionItems, normalizedSearch]);

  const groupedHistory = useMemo(() => {
    const groupsMap = new Map<string, typeof filteredSessionItems>();

    filteredSessionItems.forEach((item) => {
      const existing = groupsMap.get(item.dateKey) ?? [];
      existing.push(item);
      groupsMap.set(item.dateKey, existing);
    });

    return Array.from(groupsMap.entries())
      .map(([dateKey, sessions]) => ({
        dateKey,
        sessions: [...sessions].sort((a, b) =>
          (b.session.endedAt ?? b.session.startedAt).localeCompare(
            a.session.endedAt ?? a.session.startedAt,
          ),
        ),
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredSessionItems]);

  function handleRequestDelete(sessionId: string) {
    setPendingDeleteSessionId(sessionId);
  }

  function handleCancelDelete() {
    setPendingDeleteSessionId(null);
  }

  function handleConfirmDelete(sessionId: string) {
    deleteWorkoutSession(sessionId);
    setPendingDeleteSessionId(null);
  }
  return (
    <div className="history-page">
      <div className="history-page-container">
        <header className="history-page-header">
          <h1 className="history-page-title">History</h1>
          <p className="history-page-description">
            Review completed workout sessions grouped by date.
          </p>
        </header>

        <div className="history-page-controls">
          <div className="history-page-search-wrap">
            <input
              type="text"
              className="history-page-search-input history-page-search-input-with-clear"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search routine or exercise..."
              aria-label="Search history"
            />

            {search.trim() && (
              <button
                type="button"
                className="history-page-search-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
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
            <h2 className="history-page-empty-title">No sessions found</h2>
            <p className="history-page-empty-text">
              There are no workout sessions for the selected filters.
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
                  {group.sessions.map(({ session, routine, exercises }) => {
                    const startTime = formatTime(session.startedAt);
                    const endTime = formatTime(session.endedAt);
                    const duration = formatDuration(
                      session.startedAt,
                      session.endedAt,
                    );

                    return (
                      <article key={session.id} className="history-page-card">
                        <div className="history-page-card-header">
                          <div className="history-page-card-header-top">
                            <div className="history-page-card-info">
                              <h3 className="history-page-card-title">
                                {routine?.name ?? "Workout session"}
                              </h3>

                              <p className="history-page-card-routine">
                                {exercises.length} exercise
                                {exercises.length === 1 ? "" : "s"}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="history-page-delete-icon"
                              aria-label="Delete session"
                              title="Delete session"
                              onClick={() => handleRequestDelete(session.id)}
                            >
                              ×
                            </button>
                          </div>

                          {(startTime || duration) && (
                            <div className="history-page-card-meta">
                              {startTime && (
                                <span className="history-page-card-meta-chip">
                                  {endTime ? `${startTime} - ${endTime}` : startTime}
                                </span>
                              )}

                              {duration && (
                                <span className="history-page-card-meta-chip">
                                  {duration}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {pendingDeleteSessionId === session.id && (
                          <div className="history-page-delete-confirm">
                            <p className="history-page-delete-text">
                              Delete session?
                            </p>
                            <p className="history-page-delete-subtext">
                              This completed workout session will be permanently
                              removed.
                            </p>

                            <div className="history-page-delete-actions">
                              <button
                                type="button"
                                className="history-page-btn history-page-btn-danger"
                                onClick={() => handleConfirmDelete(session.id)}
                              >
                                Delete
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

                        <div className="history-page-session-exercises">
                          {exercises.map(({ sessionExercise, exercise }) => (
                            <div
                              key={sessionExercise.id}
                              className="history-page-session-exercise"
                            >
                              <div className="history-page-session-exercise-top">
                                <h4 className="history-page-session-exercise-title">
                                  {exercise?.name ?? "Unknown exercise"}
                                </h4>
                              </div>

                              <p className="history-page-card-performance">
                                <strong>Sets:</strong>{" "}
                                {formatSessionExercisePerformance(
                                  sessionExercise,
                                  preferredWeightUnit,
                                )}
                              </p>

                              {sessionExercise.notes?.trim() && (
                                <p className="history-page-card-notes">
                                  <strong>Notes:</strong>{" "}
                                  {sessionExercise.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {session.notes?.trim() && (
                          <p className="history-page-card-notes">
                            <strong>Session notes:</strong> {session.notes}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}