import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import "../styles/routines-page.css";

export default function RoutinesPage() {
  const routines = useAppStore((state) => state.routines);
  const moveRoutine = useAppStore((state) => state.moveRoutine);
  const navigate = useNavigate();

  function handleMoveUp(
    event: React.MouseEvent<HTMLButtonElement>,
    index: number,
  ) {
    event.stopPropagation();
    moveRoutine(index, index - 1);
  }

  function handleMoveDown(
    event: React.MouseEvent<HTMLButtonElement>,
    index: number,
  ) {
    event.stopPropagation();
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
        </header>

        {routines.length === 0 ? (
          <p className="routines-page-empty">No routines found.</p>
        ) : (
          <div className="routines-page-list">
            {routines.map((routine, index) => (
              <div
                key={routine.id}
                className="routines-page-card routines-page-card-clickable"
                onClick={() => navigate(`/routines/${routine.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/routines/${routine.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open routine ${routine.name}`}
              >
                <div className="routines-page-card-top">
                  <div className="routines-page-card-title-wrap">
                    <h2 className="routines-page-card-title">{routine.name}</h2>
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
                      onClick={(event) => event.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                <div className="routines-page-card-content">
                  {routine.dayType && (
                    <p className="routines-page-card-day">{routine.dayType}</p>
                  )}

                  {routine.description && (
                    <p className="routines-page-card-description">
                      {routine.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}