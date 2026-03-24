import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import "../styles/simple-page.css";

type RoutineFilter = "All" | "Push" | "Pull" | "Legs" | "Upper" | "Lower";

const ROUTINE_FILTERS: RoutineFilter[] = [
  "All",
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
];

export default function HomePage() {
  const routines = useAppStore((state) => state.routines);
  const preferredWeightUnit = useAppStore((state) => state.preferredWeightUnit);
  const setPreferredWeightUnit = useAppStore(
    (state) => state.setPreferredWeightUnit,
  );
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<RoutineFilter>("All");

  const visibleRoutines = useMemo(() => {
    if (activeFilter === "All") {
      return routines.slice(0, 5);
    }

    return routines.filter((routine) => {
      const dayType = (routine.dayType ?? "").toLowerCase();
      const name = routine.name.toLowerCase();
      const filter = activeFilter.toLowerCase();

      return dayType.includes(filter) || name.includes(filter);
    });
  }, [routines, activeFilter]);

  const activeWorkoutSession = useAppStore(
    (state) => state.activeWorkoutSession,
  );

  const startWorkoutSessionFromRoutine = useAppStore(
    (state) => state.startWorkoutSessionFromRoutine,
  );

  function handleRoutineWorkoutAction(routineId: string) {
    const isSameRoutineActive = activeWorkoutSession?.routineId === routineId;
    const hasOtherRoutineActive =
      activeWorkoutSession !== null &&
      activeWorkoutSession?.routineId !== routineId;

    if (isSameRoutineActive) {
      navigate("/active-workout");
      return;
    }

    if (hasOtherRoutineActive) {
      navigate("/active-workout");
      return;
    }

    startWorkoutSessionFromRoutine(routineId);
    navigate("/active-workout");
  }

  const activeRoutine = activeWorkoutSession
    ? routines.find((routine) => routine.id === activeWorkoutSession.routineId)
    : null;

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header">
          <h1 className="simple-page-title">Lift Log</h1>
          <p className="simple-page-description">
            Track routines, sets, reps, and progress in one place.
          </p>
        </header>

        <section
          className="simple-page-card simple-page-card-compact"
          aria-labelledby="home-overview-title"
        >
          <div className="simple-page-card-body simple-page-card-body-compact">
            <h2 id="home-overview-title" className="simple-page-card-title">
              Welcome back
            </h2>
            <p className="simple-page-card-text">
              Start from a routine, log your sets, and track your progress over
              time.
            </p>
          </div>
        </section>

        {activeWorkoutSession && activeRoutine ? (
          <section
            className="simple-page-card simple-page-card-compact simple-page-active-workout-card"
            aria-labelledby="home-active-workout-title"
          >
            <div className="simple-page-card-body simple-page-card-body-compact">
              <div className="simple-page-active-workout-top">
                <div>
                  <p className="simple-page-active-workout-kicker">
                    Workout in progress
                  </p>
                  <h2
                    id="home-active-workout-title"
                    className="simple-page-card-title"
                  >
                    {activeRoutine.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="home-routine-action-btn home-routine-action-btn-primary"
                  onClick={() => navigate("/active-workout")}
                >
                  Resume workout
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section
          className="simple-page-card"
          aria-labelledby="home-routines-title"
        >
          <div className="simple-page-card-body">
            <div className="simple-page-routines-top">
              <h2
                id="home-routines-title"
                className="simple-page-card-title simple-page-routines-title"
              >
                Your routines
              </h2>

              <Link
                to="/routines"
                className="simple-page-btn simple-page-btn-secondary simple-page-routines-view-all-btn"
              >
                View all
              </Link>

              <p className="simple-page-card-text simple-page-routines-subtext">
                Quick access to start your next workout.
              </p>
            </div>

            {routines.length > 0 && (
              <div
                className="simple-page-routine-filters"
                role="tablist"
                aria-label="Routine filters"
              >
                {ROUTINE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`simple-page-routine-filter-chip ${
                      activeFilter === filter
                        ? "simple-page-routine-filter-chip-active"
                        : ""
                    }`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}

            {routines.length === 0 ? (
              <div className="simple-page-empty-block">
                <p className="simple-page-card-text">
                  You don’t have any routines yet.
                </p>

                <Link
                  to="/routines/new"
                  className="simple-page-btn simple-page-btn-primary"
                >
                  Create routine
                </Link>
              </div>
            ) : visibleRoutines.length === 0 ? (
              <div className="simple-page-empty-block">
                <p className="simple-page-card-text">
                  No routines match the selected filter.
                </p>
              </div>
            ) : (
              <div className="simple-page-home-routines">
                {visibleRoutines.map((routine) => (
                  <article
                    key={routine.id}
                    className="simple-page-home-routine-item"
                  >
                    <div className="simple-page-home-routine-header-row">
                      <div className="simple-page-home-routine-main">
                        <h3 className="simple-page-home-routine-title">
                          {routine.name}
                        </h3>
                      </div>

                      <div className="simple-page-home-routine-actions">
                        <button
                          type="button"
                          className={`home-routine-action-btn ${
                            activeWorkoutSession?.routineId === routine.id
                              ? "home-routine-action-btn-primary"
                              : activeWorkoutSession
                                ? "home-routine-action-btn-neutral"
                                : "home-routine-action-btn-secondary"
                          }`}
                          onClick={() => {
                            if (
                              activeWorkoutSession &&
                              activeWorkoutSession.routineId !== routine.id
                            ) {
                              navigate(`/routines/${routine.id}`);
                              return;
                            }

                            handleRoutineWorkoutAction(routine.id);
                          }}
                        >
                          {activeWorkoutSession?.routineId === routine.id
                            ? "Resume workout"
                            : activeWorkoutSession
                              ? "Open routine"
                              : "Start workout"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className="simple-page-card"
          aria-labelledby="home-settings-title"
        >
          <div className="simple-page-card-body">
            <div className="simple-page-section-top simple-page-section-top-stack-mobile">
              <div>
                <h2 id="home-settings-title" className="simple-page-card-title">
                  Settings
                </h2>
                <p className="simple-page-card-text">
                  Manage weight units and your local backup data.
                </p>
              </div>
            </div>

            <div className="simple-page-settings-grid">
              <div className="simple-page-settings-item">
                <div className="simple-page-settings-item-text">
                  <h3 className="simple-page-settings-item-title">
                    Weight unit
                  </h3>
                  <p className="simple-page-settings-item-description">
                    Choose how weights are shown across the app.
                  </p>
                </div>

                <div
                  className="simple-page-unit-toggle"
                  role="group"
                  aria-label="Weight unit"
                >
                  <button
                    type="button"
                    className={`simple-page-unit-toggle-btn ${
                      preferredWeightUnit === "kg"
                        ? "simple-page-unit-toggle-btn-active"
                        : ""
                    }`}
                    onClick={() => setPreferredWeightUnit("kg")}
                  >
                    Kg
                  </button>

                  <button
                    type="button"
                    className={`simple-page-unit-toggle-btn ${
                      preferredWeightUnit === "lb"
                        ? "simple-page-unit-toggle-btn-active"
                        : ""
                    }`}
                    onClick={() => setPreferredWeightUnit("lb")}
                  >
                    Lb
                  </button>
                </div>
              </div>

              <div className="simple-page-settings-item">
                <div className="simple-page-settings-item-text">
                  <h3 className="simple-page-settings-item-title">Data</h3>
                  <p className="simple-page-settings-item-description">
                    Import or export your routines, exercises, and workout
                    history.
                  </p>
                </div>

                <Link
                  to="/data"
                  className="simple-page-btn simple-page-btn-secondary"
                >
                  Open data settings
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
