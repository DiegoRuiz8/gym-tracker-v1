import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import "../styles/routine-page.css";

export default function RoutinesPage() {
  const routines = useAppStore((state) => state.routines);

  return (
    <div className="routines-page">
      <div className="routines-page-container">
        <header className="routines-page-header">
          <h1 className="routines-page-title">Routines</h1>
        </header>

        {routines.length === 0 ? (
          <p className="routines-page-empty">No routines found.</p>
        ) : (
          <div className="routines-page-list">
            {routines.map((routine) => (
              <Link
                key={routine.id}
                to={`/routines/${routine.id}`}
                className="routines-page-card"
              >
                <h2 className="routines-page-card-title">{routine.name}</h2>

                {routine.dayType && (
                  <p className="routines-page-card-day">{routine.dayType}</p>
                )}

                {routine.description && (
                  <p className="routines-page-card-description">
                    {routine.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}