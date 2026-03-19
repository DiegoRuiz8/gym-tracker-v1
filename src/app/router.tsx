import { Routes, Route, NavLink } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RoutinesPage from "../pages/RoutinesPage";
import RoutineDetailPage from "../pages/RoutineDetailPage";
import ExercisesPage from "../pages/ExercisesPage";
import HistoryPage from "../pages/HistoryPage";
import NewWorkoutLogPage from "../pages/NewWorkoutLogPage";
import VariantHistoryPage from "../pages/VariantHistoryPage";
import EditWorkoutLogPage from "../pages/EditWorkoutLogPage";
import NewRoutinePage from "../pages/NewRoutinePage";
import EditRoutinePage from "../pages/EditRoutinePage";
import NewExercisePage from "../pages/NewExercisePage";
import NewVariantPage from "../pages/NewVariantPage";
import EditVariantPage from "../pages/EditVariantPage";
import EditExercisePage from "../pages/EditExercisePage";
import "../styles/app-shell.css";

function getNavLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "app-shell-nav-link active" : "app-shell-nav-link";
}

export function AppRouter() {
  return (
    <div className="app-shell">
      <main className="app-shell-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/routines/new" element={<NewRoutinePage />} />
          <Route path="/routines/:routineId" element={<RoutineDetailPage />} />
          <Route
            path="/routines/:routineId/edit"
            element={<EditRoutinePage />}
          />
          <Route
            path="/routines/:routineId/log/:variantId"
            element={<NewWorkoutLogPage />}
          />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/new" element={<NewExercisePage />} />
          <Route
            path="/exercises/:exerciseId/variants/new"
            element={<NewVariantPage />}
          />
          <Route
            path="/variants/:variantId/edit"
            element={<EditVariantPage />}
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/history/variant/:variantId"
            element={<VariantHistoryPage />}
          />
          <Route
            path="/history/log/:logId/edit"
            element={<EditWorkoutLogPage />}
          />
          <Route
            path="/exercises/:exerciseId/edit"
            element={<EditExercisePage />}
          />
        </Routes>
      </main>

      <nav className="app-shell-nav" aria-label="Primary">
        <div className="app-shell-nav-inner">
          <NavLink className={getNavLinkClassName} to="/" end>
            Home
          </NavLink>

          <NavLink className={getNavLinkClassName} to="/routines">
            Routines
          </NavLink>

          <NavLink className={getNavLinkClassName} to="/exercises">
            Exercises
          </NavLink>

          <NavLink className={getNavLinkClassName} to="/history">
            History
          </NavLink>
        </div>
      </nav>
    </div>
  );
}