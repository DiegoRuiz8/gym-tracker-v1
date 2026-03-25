import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import "../styles/active-workout.css";

function formatPrescriptionLabel(
  sets: number,
  repMin?: number,
  repMax?: number,
  targetRir?: number | null,
  restSeconds?: number | null,
) {
  const parts: string[] = [];

  if (repMin != null && repMax != null) {
    parts.push(`Target: ${sets} x ${repMin}-${repMax}`);
  } else {
    parts.push(`${sets} sets`);
  }

  if (targetRir != null) {
    parts.push(`RIR ${targetRir}`);
  }

  if (restSeconds != null) {
    parts.push(`Rest ${restSeconds}s`);
  }

  return parts.join(" · ");
}

function formatElapsedTime(startedAt: string, nowMs: number) {
  const startedMs = new Date(startedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );
  const routines = useAppStore((state) => state.routines);
  const exercises = useAppStore((state) => state.exercises);
  const variants = useAppStore((state) => state.exerciseVariants);

  const updateActiveSessionSetWeight = useAppStore(
    (state) => state.updateActiveSessionSetWeight,
  );
  const updateActiveSessionSetReps = useAppStore(
    (state) => state.updateActiveSessionSetReps,
  );
  const toggleActiveSessionSetCompleted = useAppStore(
    (state) => state.toggleActiveSessionSetCompleted,
  );
  const addActiveSessionExerciseSet = useAppStore(
    (state) => state.addActiveSessionExerciseSet,
  );
  const removeLastActiveSessionExerciseSet = useAppStore(
    (state) => state.removeLastActiveSessionExerciseSet,
  );
  const removeExerciseFromActiveWorkoutSession = useAppStore(
  (state) => state.removeExerciseFromActiveWorkoutSession,
);
  const updateActiveSessionExerciseNotes = useAppStore(
    (state) => state.updateActiveSessionExerciseNotes,
  );
  const completeActiveWorkoutSession = useAppStore(
    (state) => state.completeActiveWorkoutSession,
  );
  const cancelActiveWorkoutSession = useAppStore(
    (state) => state.cancelActiveWorkoutSession,
  );
  const swapActiveSessionExerciseVariant = useAppStore(
    (state) => state.swapActiveSessionExerciseVariant,
  );
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);

  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [swapOpen, setSwapOpen] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<
  Record<string, boolean>
>({});

  const addExerciseToActiveWorkoutSession = useAppStore(
    (state) => state.addExerciseToActiveWorkoutSession,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const state = location.state as
      | {
          source?: string;
          createdVariantId?: string;
          sessionExerciseId?: string;
        }
      | undefined;

    if (
      state?.source !== "active-workout" ||
      !state.createdVariantId ||
      !state.sessionExerciseId
    ) {
      return;
    }

    swapActiveSessionExerciseVariant(
      state.sessionExerciseId,
      state.createdVariantId,
    );

    setSwapOpen((prev) => ({
      ...prev,
      [state.sessionExerciseId!]: true,
    }));

    navigate(location.pathname, { replace: true, state: null });
  }, [
    location.pathname,
    location.state,
    navigate,
    swapActiveSessionExerciseVariant,
  ]);

  if (!activeWorkoutSession) {
    return <Navigate to="/routines" replace />;
  }

  const routine = routines.find(
    (item) => item.id === activeWorkoutSession.routineId,
  );

  const availableVariantsToAdd = variants.filter((variant) => {
    const alreadyInSession = activeWorkoutSession.exercises.some(
      (exercise) => exercise.variantId === variant.id,
    );

    return variant.isActive && !alreadyInSession;
  });

  const filteredVariantsToAdd = availableVariantsToAdd.filter((variant) => {
    const exercise = exercises.find((item) => item.id === variant.exerciseId);
    const search = exerciseSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    const exerciseName = exercise?.name.toLowerCase() ?? "";
    const variantName = variant.name.toLowerCase();
    const equipment = variant.equipment?.toLowerCase() ?? "";
    const gymLabel = variant.gymLabel?.toLowerCase() ?? "";

    return (
      exerciseName.includes(search) ||
      variantName.includes(search) ||
      equipment.includes(search) ||
      gymLabel.includes(search)
    );
  });

  function getVariantDisplayLabel(variantId: string): string {
    const variant = variants.find((item) => item.id === variantId);

    if (!variant) {
      return "Unknown exercise — Unknown variant";
    }

    const exercise = exercises.find((item) => item.id === variant.exerciseId);
    const exerciseName = exercise?.name ?? "Unknown exercise";

    return `${exerciseName} — ${variant.name}`;
  }
  function handleOpenNewVariantFromSession(
    exerciseId: string,
    sessionExerciseId: string,
  ) {
    navigate(`/exercises/${exerciseId}/variants/new`, {
      state: {
        returnTo: "/active-workout",
        source: "active-workout",
        sessionExerciseId,
      },
    });
  }

  function formatPreviousSetLabel(
    set: {
      previousWeight?: number | null;
      previousReps?: number | null;
      previousDurationSeconds?: number | null;
    },
    preferredWeightUnit: "kg" | "lb",
  ): string {
    const previousWeight = convertWeightFromKg(
      set.previousWeight,
      preferredWeightUnit,
    );

    const hasWeight = previousWeight != null;
    const hasReps = set.previousReps != null;
    const hasDuration = set.previousDurationSeconds != null;

    if (hasWeight && hasReps) {
      return `${previousWeight} ${preferredWeightUnit} × ${set.previousReps}`;
    }

    if (hasWeight) {
      return `${previousWeight} ${preferredWeightUnit}`;
    }

    if (hasReps) {
      return `${set.previousReps} reps`;
    }

    if (hasDuration) {
      const totalSeconds = set.previousDurationSeconds ?? 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      }

      return `${seconds}s`;
    }

    return "—";
  }

  const KG_TO_LB = 2.2046226218;

  function roundDisplayWeight(value: number): number {
    return Math.round(value * 10) / 10;
  }

  function convertWeightFromKg(
    weightKg: number | null | undefined,
    preferredWeightUnit: "kg" | "lb",
  ): number | null {
    if (weightKg == null) {
      return null;
    }

    if (preferredWeightUnit === "lb") {
      return roundDisplayWeight(weightKg * KG_TO_LB);
    }

    return roundDisplayWeight(weightKg);
  }

  function convertWeightToKg(
    displayWeight: number | null,
    preferredWeightUnit: "kg" | "lb",
  ): number | null {
    if (displayWeight == null) {
      return null;
    }

    if (preferredWeightUnit === "lb") {
      return displayWeight / KG_TO_LB;
    }

    return displayWeight;
  }

  function formatDisplayWeightValue(
    weightKg: number | null | undefined,
    preferredWeightUnit: "kg" | "lb",
  ): string {
    const converted = convertWeightFromKg(weightKg, preferredWeightUnit);

    if (converted == null) {
      return "";
    }

    return Number.isInteger(converted) ? String(converted) : String(converted);
  }

  function formatWeightUnitLabel(unit: "kg" | "lb") {
    return unit.toUpperCase();
  }

  const elapsedLabel = useMemo(
    () => formatElapsedTime(activeWorkoutSession.startedAt, nowMs),
    [activeWorkoutSession.startedAt, nowMs],
  );

  const completedExercisesCount = activeWorkoutSession.exercises.filter(
    (exercise) => exercise.isCompleted,
  ).length;

  const totalExercisesCount = activeWorkoutSession.exercises.length;
  const incompleteExercisesCount =
    totalExercisesCount - completedExercisesCount;

  const exercisesWithIncompleteSetsCount =
    activeWorkoutSession.exercises.filter((exercise) => {
      const hasAnyIncompleteSet = exercise.performedSets.some(
        (set) => !set.isCompleted,
      );

      return hasAnyIncompleteSet;
    }).length;

    function handleRequestDeleteExercise(sessionExerciseId: string) {
  setDeleteConfirmOpen((prev) => ({
    ...prev,
    [sessionExerciseId]: true,
  }));
}

function handleCancelDeleteExercise(sessionExerciseId: string) {
  setDeleteConfirmOpen((prev) => ({
    ...prev,
    [sessionExerciseId]: false,
  }));
}

function handleConfirmDeleteExercise(sessionExerciseId: string) {
  removeExerciseFromActiveWorkoutSession(sessionExerciseId);

  setDeleteConfirmOpen((prev) => {
    const next = { ...prev };
    delete next[sessionExerciseId];
    return next;
  });

  setNotesOpen((prev) => {
    const next = { ...prev };
    delete next[sessionExerciseId];
    return next;
  });

  setSwapOpen((prev) => {
    const next = { ...prev };
    delete next[sessionExerciseId];
    return next;
  });
}

  return (
    <div className="active-workout-page">
      <header className="active-workout-header">
        <div className="active-workout-header-inner active-workout-header-compact">
          <button
            type="button"
            className="active-workout-back-btn"
            aria-label="Go back"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }

              navigate("/routines", { replace: true });
            }}
          >
            ←
          </button>

          <div className="active-workout-header-main">
            <h1 className="active-workout-title">
              {routine?.name ?? "Active Workout"}
            </h1>
            <p className="active-workout-timer">{elapsedLabel}</p>
          </div>

          <button
            type="button"
            className="button-primary active-workout-finish-btn"
            onClick={() => setShowFinishConfirm(true)}
          >
            Finish
          </button>
        </div>
      </header>

      <main className="active-workout-container">
        <section className="active-workout-list">
          {activeWorkoutSession.exercises.length === 0 ? (
            <div className="surface-card active-workout-empty">
              No exercises in this session.
            </div>
          ) : (
            activeWorkoutSession.exercises.map((sessionExercise) => {
              const exercise = exercises.find(
                (item) => item.id === sessionExercise.exerciseId,
              );

              const variant = variants.find(
                (item) => item.id === sessionExercise.variantId,
              );

              const availableSwapVariants = variants.filter(
                (item) =>
                  item.exerciseId === sessionExercise.exerciseId &&
                  item.isActive,
              );

              const prescription = sessionExercise.prescription;
              const prescribedSetCount = prescription?.sets ?? 0;
              const canRemoveLastSet =
                sessionExercise.performedSets.length > prescribedSetCount;

              const isNotesOpen =
                notesOpen[sessionExercise.id] ||
                Boolean(sessionExercise.notes?.trim());

              const isSwapOpen = Boolean(swapOpen[sessionExercise.id]);

              return (
                <article
                  key={sessionExercise.id}
                  className="surface-card active-workout-card"
                >
                  <div className="active-workout-card-top">
  <div className="active-workout-card-heading-row">
    <div className="active-workout-card-heading-main">
      <div className="active-workout-title-row">
        <h2 className="active-workout-exercise-title">
          {exercise?.name ?? "Unknown exercise"}

          {variant?.name ? (
            <span className="active-workout-exercise-variant-wrap">
              <span className="active-workout-exercise-variant">
                ({variant.name})
              </span>

              <button
                type="button"
                className="active-workout-swap-btn"
                onClick={() =>
                  setSwapOpen((prev) => ({
                    ...prev,
                    [sessionExercise.id]: !prev[sessionExercise.id],
                  }))
                }
                aria-label={`Swap variant for ${
                  exercise?.name ?? "exercise"
                }`}
                aria-expanded={isSwapOpen}
                title="Swap variant"
              >
                ⇄
              </button>
            </span>
          ) : null}
        </h2>
      </div>

      <p className="active-workout-prescription">
        {formatPrescriptionLabel(
          prescription?.sets ?? sessionExercise.performedSets.length,
          prescription?.repRange?.min,
          prescription?.repRange?.max,
          prescription?.targetRIR,
          prescription?.restSeconds,
        )}
      </p>

      <button
        type="button"
        className="active-workout-notes-toggle"
        onClick={() =>
          setNotesOpen((prev) => ({
            ...prev,
            [sessionExercise.id]: !prev[sessionExercise.id],
          }))
        }
      >
        {isNotesOpen ? "Hide notes" : "Add notes"}
      </button>
    </div>

    <button
      type="button"
      className="active-workout-delete-icon"
      aria-label="Remove exercise"
      title="Remove exercise"
      onClick={() => handleRequestDeleteExercise(sessionExercise.id)}
    >
      ✕
    </button>
  </div>

  {deleteConfirmOpen[sessionExercise.id] ? (
    <div className="active-workout-delete-confirm">
      <p className="active-workout-delete-text">Remove exercise?</p>
      <p className="active-workout-delete-subtext">
        This exercise will be removed from the active session.
      </p>

      <div className="active-workout-delete-actions">
        <button
          type="button"
          className="active-workout-btn active-workout-btn-danger"
          onClick={() => handleConfirmDeleteExercise(sessionExercise.id)}
        >
          Remove
        </button>

        <button
          type="button"
          className="active-workout-btn active-workout-btn-secondary"
          onClick={() => handleCancelDeleteExercise(sessionExercise.id)}
        >
          Cancel
        </button>
      </div>
    </div>
  ) : null}

                    {isSwapOpen ? (
                      <div className="active-workout-swap-panel">
                        <p className="active-workout-swap-label">
                          Swap for today
                        </p>

                        <div className="active-workout-swap-options">
                          {availableSwapVariants.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={`active-workout-swap-option ${
                                item.id === sessionExercise.variantId
                                  ? "active-workout-swap-option-active"
                                  : ""
                              }`}
                              onClick={() => {
                                if (item.id === sessionExercise.variantId) {
                                  setSwapOpen((prev) => ({
                                    ...prev,
                                    [sessionExercise.id]: false,
                                  }));
                                  return;
                                }

                                swapActiveSessionExerciseVariant(
                                  sessionExercise.id,
                                  item.id,
                                );

                                setSwapOpen((prev) => ({
                                  ...prev,
                                  [sessionExercise.id]: false,
                                }));
                              }}
                            >
                              {item.name}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="active-workout-swap-option active-workout-swap-chip-add"
                            onClick={() =>
                              handleOpenNewVariantFromSession(
                                sessionExercise.exerciseId,
                                sessionExercise.id,
                              )
                            }
                          >
                            + New variant
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {isNotesOpen ? (
                      <div className="active-workout-notes">
                        <textarea
                          className="textarea"
                          placeholder="Notes for this exercise..."
                          value={sessionExercise.notes ?? ""}
                          onChange={(e) => {
                            updateActiveSessionExerciseNotes(
                              sessionExercise.id,
                              e.target.value,
                            );

                            e.target.style.height = "42px";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onInput={(e) => {
                            const target = e.currentTarget;
                            target.style.height = "42px";
                            target.style.height = `${target.scrollHeight}px`;
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="active-workout-table-wrap">
                    <table className="active-workout-table">
                      <colgroup>
                        <col className="active-workout-col-set" />
                        <col className="active-workout-col-previous" />
                        <col className="active-workout-col-weight" />
                        <col className="active-workout-col-reps" />
                        <col className="active-workout-col-check" />
                      </colgroup>

                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>Previous</th>
                          <th>{formatWeightUnitLabel(preferredWeightUnit)}</th>
                          <th>Reps</th>
                          <th
                            className="active-workout-check-header"
                            aria-label="Completed"
                          >
                            <span aria-hidden="true">✓</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {sessionExercise.performedSets.map((set) => (
                          <tr
                            key={set.id}
                            className={
                              set.isCompleted
                                ? "active-workout-set-row is-completed"
                                : "active-workout-set-row"
                            }
                          >
                            <td className="active-workout-set-number">
                              {set.setNumber}
                            </td>

                            <td className="active-workout-previous-cell">
                              {formatPreviousSetLabel(set, preferredWeightUnit)}
                            </td>

                            <td className="active-workout-cell-input">
                              <input
                                className="input"
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={formatDisplayWeightValue(
                                  set.weight,
                                  preferredWeightUnit,
                                )}
                                onChange={(e) =>
                                  updateActiveSessionSetWeight(
                                    sessionExercise.id,
                                    set.id,
                                    e.target.value === ""
                                      ? null
                                      : convertWeightToKg(
                                          Number(e.target.value),
                                          preferredWeightUnit,
                                        ),
                                  )
                                }
                              />
                            </td>

                            <td className="active-workout-cell-input">
                              <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                value={set.reps ?? ""}
                                onChange={(e) =>
                                  updateActiveSessionSetReps(
                                    sessionExercise.id,
                                    set.id,
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </td>

                            <td className="active-workout-check-cell">
                              <button
                                type="button"
                                aria-label={
                                  set.isCompleted
                                    ? "Mark set as incomplete"
                                    : "Mark set as complete"
                                }
                                className={`active-workout-check-btn ${
                                  set.isCompleted ? "is-completed" : ""
                                }`}
                                onClick={() =>
                                  toggleActiveSessionSetCompleted(
                                    sessionExercise.id,
                                    set.id,
                                  )
                                }
                              >
                                ✓
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={`active-workout-card-footer ${
                      canRemoveLastSet
                        ? "active-workout-card-footer-with-secondary"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="button-secondary active-workout-add-set-btn"
                      onClick={() =>
                        addActiveSessionExerciseSet(sessionExercise.id)
                      }
                    >
                      + Add set
                    </button>

                    {canRemoveLastSet ? (
                      <button
                        type="button"
                        className="active-workout-remove-set-btn"
                        onClick={() =>
                          removeLastActiveSessionExerciseSet(sessionExercise.id)
                        }
                      >
                        Undo add set
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="active-workout-global-actions">
          <button
            type="button"
            className="button-primary active-workout-add-exercise-btn"
            onClick={() => setShowAddExercisePicker((prev) => !prev)}
          >
            + Add exercise
          </button>
          {showAddExercisePicker ? (
            <div className="active-workout-add-exercise-panel">
              <label
                className="active-workout-add-exercise-label"
                htmlFor="active-workout-exercise-search"
              >
                Search exercise
              </label>

              <div className="active-workout-add-exercise-input-wrap">
                <input
                  id="active-workout-exercise-search"
                  className="input active-workout-add-exercise-input"
                  type="text"
                  placeholder="Search exercise or variant"
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                />

                {exerciseSearch.trim() ? (
                  <button
                    type="button"
                    className="active-workout-add-exercise-clear-btn"
                    aria-label="Clear search"
                    onClick={() => setExerciseSearch("")}
                  >
                    ×
                  </button>
                ) : null}
              </div>

              {filteredVariantsToAdd.length > 0 ? (
                <div className="active-workout-add-exercise-results">
                  {filteredVariantsToAdd.slice(0, 8).map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className="active-workout-add-exercise-result"
                      onClick={() => {
                        addExerciseToActiveWorkoutSession(variant.id);
                        setExerciseSearch("");
                        setShowAddExercisePicker(false);
                      }}
                    >
                      {getVariantDisplayLabel(variant.id)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="active-workout-add-exercise-empty">
                  {exerciseSearch.trim()
                    ? "No available variants match your search."
                    : "Start typing to search available variants."}
                </p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="active-workout-discard-btn"
            onClick={() => setShowDiscardConfirm(true)}
          >
            Discard workout
          </button>
        </section>
      </main>
      {showFinishConfirm ? (
        <div
          className="active-workout-finish-overlay"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div
            className="active-workout-finish-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="active-workout-finish-sheet-eyebrow">
              Finish workout
            </p>

            <h2 className="active-workout-finish-sheet-title">
              {routine?.name ?? "Active Workout"}
            </h2>

            <div className="active-workout-finish-sheet-stats">
              <span className="active-workout-finish-stat-chip">
                {elapsedLabel}
              </span>
              <span className="active-workout-finish-stat-chip">
                {totalExercisesCount} exercise
                {totalExercisesCount === 1 ? "" : "s"}
              </span>
              <span className="active-workout-finish-stat-chip">
                {completedExercisesCount}/{totalExercisesCount} completed
              </span>
            </div>

            <p className="active-workout-finish-sheet-text">
              This will save the workout to your history and close the active
              session.
            </p>

            {incompleteExercisesCount > 0 ||
            exercisesWithIncompleteSetsCount > 0 ? (
              <div className="active-workout-finish-warning">
                <p className="active-workout-finish-warning-title">
                  Before you finish
                </p>

                <div className="active-workout-finish-warning-list">
                  {incompleteExercisesCount > 0 &&
                  incompleteExercisesCount ===
                    exercisesWithIncompleteSetsCount ? (
                    <p className="active-workout-finish-warning-item">
                      {incompleteExercisesCount} exercise
                      {incompleteExercisesCount === 1 ? "" : "s"}{" "}
                      {incompleteExercisesCount === 1 ? "is" : "are"} still
                      incomplete.
                    </p>
                  ) : (
                    <>
                      {incompleteExercisesCount > 0 ? (
                        <p className="active-workout-finish-warning-item">
                          {incompleteExercisesCount} exercise
                          {incompleteExercisesCount === 1 ? "" : "s"}{" "}
                          {incompleteExercisesCount === 1 ? "is" : "are"} still
                          incomplete.
                        </p>
                      ) : null}

                      {exercisesWithIncompleteSetsCount > 0 ? (
                        <p className="active-workout-finish-warning-item">
                          {exercisesWithIncompleteSetsCount} exercise
                          {exercisesWithIncompleteSetsCount === 1
                            ? ""
                            : "s"}{" "}
                          {exercisesWithIncompleteSetsCount === 1
                            ? "still has"
                            : "still have"}{" "}
                          unfinished sets.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="active-workout-finish-ok">
                Everything looks good to save this session.
              </div>
            )}

            <div className="active-workout-finish-sheet-actions">
              <button
                type="button"
                className="button-primary active-workout-finish-confirm-btn"
                onClick={() => {
                  completeActiveWorkoutSession();
                  navigate("/history");
                }}
              >
                Finish workout
              </button>

              <button
                type="button"
                className="button-secondary active-workout-finish-cancel-btn"
                onClick={() => setShowFinishConfirm(false)}
              >
                Keep training
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showDiscardConfirm ? (
        <div
          className="active-workout-finish-overlay"
          onClick={() => setShowDiscardConfirm(false)}
        >
          <div
            className="active-workout-finish-sheet active-workout-discard-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="active-workout-discard-sheet-eyebrow">
              Discard workout
            </p>

            <h2 className="active-workout-finish-sheet-title">
              {routine?.name ?? "Active Workout"}
            </h2>

            <div className="active-workout-finish-sheet-stats">
              <span className="active-workout-finish-stat-chip">
                {elapsedLabel}
              </span>
              <span className="active-workout-finish-stat-chip">
                {totalExercisesCount} exercise
                {totalExercisesCount === 1 ? "" : "s"}
              </span>
            </div>

            <p className="active-workout-finish-sheet-text">
              This will remove the active session and all current progress.
            </p>

            <p className="active-workout-discard-note">
              This action can’t be undone.
            </p>

            <div className="active-workout-finish-sheet-actions">
              <button
                type="button"
                className="active-workout-discard-confirm-btn"
                onClick={() => {
                  cancelActiveWorkoutSession();
                  navigate("/routines");
                }}
              >
                Discard workout
              </button>

              <button
                type="button"
                className="button-secondary active-workout-finish-cancel-btn"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep training
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
