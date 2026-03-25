import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getExerciseById,
  getSessionHistoryForVariant,
  getVariantById,
} from "../store/selectors";
import {
  formatLogDate,
  formatSessionExerciseSetsDetailed,
} from "../utils/format";
import PageBackButton from "../components/navigation/PageBackButton";
import "../styles/variant-history.css";

type VariantHistoryLocationState = {
  returnTo?: string;
  restoreDetailScroll?: boolean;
};

export default function VariantHistoryPage() {
  const { variantId } = useParams();
  const location = useLocation();
  const [pendingRemoveExerciseId, setPendingRemoveExerciseId] = useState<
    string | null
  >(null);

  const exercises = useAppStore((state) => state.exercises);
  const exerciseVariants = useAppStore((state) => state.exerciseVariants);
  const workoutSessions = useAppStore((state) => state.workoutSessions);
  const routines = useAppStore((state) => state.routines);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const removeExerciseFromWorkoutSession = useAppStore(
    (state) => state.removeExerciseFromWorkoutSession,
  );
  const pageState =
    (location.state as VariantHistoryLocationState | null) ?? null;

  const returnTo = pageState?.returnTo ?? "/history";
  

  const variant = useMemo(
    () => (variantId ? getVariantById(exerciseVariants, variantId) : undefined),
    [exerciseVariants, variantId],
  );

  const exercise = useMemo(
    () =>
      variant ? getExerciseById(exercises, variant.exerciseId) : undefined,
    [exercises, variant],
  );

  const sessionItems = useMemo(
    () =>
      variantId ? getSessionHistoryForVariant(workoutSessions, variantId) : [],
    [workoutSessions, variantId],
  );

  if (!variantId || !variant || !exercise) {
    return (
      <div className="variant-history-page">
        <div className="variant-history-container">
          <div className="variant-history-card">
            <div className="variant-history-back-row">
              <PageBackButton fallbackTo="/history" />
            </div>

            <h2 className="variant-history-card-title">Variant not found</h2>
            <p className="variant-history-card-text">
              The variant you are trying to open does not exist or is no longer
              available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function getRoutineName(routineId?: string): string {
    if (!routineId) {
      return "Unknown routine";
    }

    const routine = routines.find((item) => item.id === routineId);
    return routine?.name ?? "Unknown routine";
  }

  function handleRequestRemove(sessionExerciseId: string) {
    setPendingRemoveExerciseId(sessionExerciseId);
  }

  function handleCancelRemove() {
    setPendingRemoveExerciseId(null);
  }

  function handleConfirmRemove(sessionId: string, sessionExerciseId: string) {
    removeExerciseFromWorkoutSession(sessionId, sessionExerciseId);
    setPendingRemoveExerciseId(null);
  }

  return (
    <div className="variant-history-page">
      <div className="variant-history-container">
        <header className="variant-history-header">
          <div className="variant-history-back-row">
            <PageBackButton fallbackTo={returnTo} />
          </div>

          <h1 className="variant-history-title">
            {exercise.name}
            <span className="variant-history-title-separator"> — </span>
            <span className="variant-history-title-variant">
              {variant.name}
            </span>
          </h1>
          <p className="variant-history-meta">
            {sessionItems.length} session{sessionItems.length === 1 ? "" : "s"}
          </p>
        </header>

        {sessionItems.length === 0 ? (
          <div className="variant-history-card">
            <h2 className="variant-history-card-title">No sessions yet</h2>
            <p className="variant-history-card-text">
              This variant does not have any recorded sessions yet.
            </p>
          </div>
        ) : (
          <div className="variant-history-list">
            {sessionItems.map((item) => {
              const setLines = formatSessionExerciseSetsDetailed(
                item.sessionExercise,
                preferredWeightUnit,
              );

              return (
                <div
                  key={`${item.sessionId}-${item.sessionExercise.id}`}
                  className="variant-history-card"
                >
                  <div className="variant-history-log-header">
                    <div className="variant-history-log-info">
                      <h2 className="variant-history-card-title">
                        {formatLogDate(item.date)}
                      </h2>
                      <p className="variant-history-routine">
                        {getRoutineName(item.routineId)}
                      </p>
                    </div>

                    <div className="variant-history-actions">
                      <button
                        type="button"
                        className="variant-history-delete-icon"
                        aria-label="Remove from session"
                        title="Remove from session"
                        onClick={() =>
                          handleRequestRemove(item.sessionExercise.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {pendingRemoveExerciseId === item.sessionExercise.id && (
                    <div className="variant-history-delete-confirm-inline">
                      <p className="variant-history-delete-text">
                        Remove from session?
                      </p>
                      <p className="variant-history-delete-subtext">
                        This exercise will be removed from the workout session.
                      </p>

                      <div className="variant-history-delete-actions">
                        <button
                          type="button"
                          className="variant-history-btn variant-history-btn-danger"
                          onClick={() =>
                            handleConfirmRemove(
                              item.sessionId,
                              item.sessionExercise.id,
                            )
                          }
                        >
                          Remove
                        </button>

                        <button
                          type="button"
                          className="variant-history-btn variant-history-btn-secondary"
                          onClick={handleCancelRemove}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="variant-history-sets">
                    {setLines.length > 0 ? (
                      setLines.map((line, index) => (
                        <div key={index} className="variant-history-set-line">
                          <span className="variant-history-set-index">
                            Set {index + 1}
                          </span>
                          <span className="variant-history-set-value">
                            {line}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="variant-history-card-text">
                        No completed sets recorded.
                      </p>
                    )}
                  </div>

                  {item.sessionExercise.notes && (
                    <p className="variant-history-notes">
                      <strong>Notes:</strong> {item.sessionExercise.notes}
                    </p>
                  )}

                  {item.sessionNotes && (
                    <p className="variant-history-notes">
                      <strong>Session notes:</strong> {item.sessionNotes}
                    </p>
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
