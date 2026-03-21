import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import "../styles/routines-page.css";

const ROUTINES_SCROLL_KEY = "routines-page-scroll-y";

export default function RoutinesPage() {
  const routines = useAppStore((state) => state.routines);
  const moveRoutine = useAppStore((state) => state.moveRoutine);
  const navigate = useNavigate();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(ROUTINES_SCROLL_KEY);

    if (!savedScroll) {
      return;
    }

    const parsed = Number(savedScroll);

    if (!Number.isNaN(parsed)) {
      window.scrollTo(0, parsed);
    }
  }, []);

  function saveCurrentScroll() {
    sessionStorage.setItem(ROUTINES_SCROLL_KEY, String(window.scrollY));
  }

  function handleOpenRoutine(routineId: string) {
    saveCurrentScroll();

    navigate(`/routines/${routineId}`, {
      state: {
        fromRoutinesList: true,
      },
    });
  }

  function handleMoveUp(
    event: React.MouseEvent<HTMLButtonElement>,
    index: number,
  ) {
    event.stopPropagation();

    if (index <= 0) {
      return;
    }

    moveRoutine(index, index - 1);
  }

  function handleMoveDown(
    event: React.MouseEvent<HTMLButtonElement>,
    index: number,
  ) {
    event.stopPropagation();

    if (index >= routines.length - 1) {
      return;
    }

    moveRoutine(index, index + 1);
  }

  return (
    <div className="routines-page">
      <div className="routines-page-container">
        <header className="routines-page-header">
          <div className="routines-page-header-top">
            <h1 className="routines-page-title">Routines</h1>

            <Link to="/routines/new" className="routines-page-create-btn">
              + New routine
            </Link>
          </div>

          <p className="routines-page-subtitle">
            Organize your training split and jump into each session fast.
          </p>
        </header>

        {routines.length === 0 ? (
          <section className="routines-page-empty-state" aria-live="polite">
            <p className="routines-page-empty-title">No routines yet</p>
            <p className="routines-page-empty-text">
              Create your first routine to start tracking workouts and progress.
            </p>
            <Link to="/routines/new" className="routines-page-empty-cta">
              Create routine
            </Link>
          </section>
        ) : (
          <div className="routines-page-list">
            {routines.map((routine, index) => (
              <div
                key={routine.id}
                className="routines-page-card routines-page-card-clickable"
                onClick={() => handleOpenRoutine(routine.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenRoutine(routine.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open routine ${routine.name}`}
              >
                <div className="routines-page-card-top">
                  <div className="routines-page-card-title-wrap">
                    <h2 className="routines-page-card-title">{routine.name}</h2>

                    {routine.dayType && (
                      <p className="routines-page-card-day">{routine.dayType}</p>
                    )}
                  </div>

                  <div className="routines-page-card-actions">
                    <button
                      type="button"
                      className="routines-page-card-icon-btn"
                      onClick={(event) => handleMoveUp(event, index)}
                      title="Move up"
                      aria-label={`Move routine ${routine.name} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      className="routines-page-card-icon-btn"
                      onClick={(event) => handleMoveDown(event, index)}
                      title="Move down"
                      aria-label={`Move routine ${routine.name} down`}
                    >
                      ↓
                    </button>

                    <Link
                      to={`/routines/${routine.id}/edit`}
                      className="routines-page-card-edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveCurrentScroll();
                      }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                {routine.description && (
                  <div className="routines-page-card-content">
                    <p className="routines-page-card-description">
                      {routine.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}