import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import "../styles/simple-page.css";

export default function HomePage() {
  const routines = useAppStore((state) => state.routines);
  const navigate = useNavigate();

  const recentRoutines = routines.slice(0, 4);

  return (
    <div className="simple-page">
      <div className="simple-page-container">
        <header className="simple-page-header">
          <h1 className="simple-page-title">Gym Tracker</h1>
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
              Start from a routine, log your sets, and keep your history clean by
              variant.
            </p>
          </div>
        </section>

        <section
          className="simple-page-card"
          aria-labelledby="home-routines-title"
        >
          <div className="simple-page-card-body">
            <div className="simple-page-section-top">
              <div>
                <h2 id="home-routines-title" className="simple-page-card-title">
                  Your routines
                </h2>
                <p className="simple-page-card-text">
                  Quick access to start your next workout.
                </p>
              </div>

              <Link
                to="/routines"
                className="simple-page-btn simple-page-btn-secondary"
              >
                View all
              </Link>
            </div>

            {recentRoutines.length === 0 ? (
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
            ) : (
              <div className="simple-page-home-routines">
                {recentRoutines.map((routine) => (
                  <article
                    key={routine.id}
                    className="simple-page-home-routine-item"
                  >
                    <div className="simple-page-home-routine-top">
                      <div className="simple-page-home-routine-main">
                        <div className="simple-page-home-routine-header-row">
                          <h3 className="simple-page-home-routine-title">
                            {routine.name}
                          </h3>

                          <div className="simple-page-home-routine-actions">
                            <button
                              type="button"
                              className="simple-page-btn simple-page-btn-primary simple-page-home-routine-start-btn"
                              onClick={() =>
                                navigate(`/routines/${routine.id}`)
                              }
                            >
                              Start workout
                            </button>
                          </div>
                        </div>

                        {routine.description && (
                          <p className="simple-page-home-routine-description">
                            {routine.description}
                          </p>
                        )}
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
          aria-labelledby="home-data-title"
        >
          <div className="simple-page-card-body">
            <div className="simple-page-section-top simple-page-section-top-stack-mobile">
              <div>
                <h2 id="home-data-title" className="simple-page-card-title">
                  Data
                </h2>
                <p className="simple-page-card-text">
                  Import or export your routines, exercises, and workout history.
                </p>
              </div>

              <Link
                to="/data"
                className="simple-page-btn simple-page-btn-secondary"
              >
                Import / Export data
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}