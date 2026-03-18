import { Routes, Route, Link } from "react-router-dom";
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

export function AppRouter() {
  return (
    <div>
      <nav className="app-shell-nav">
        <div className="app-shell-nav-inner">
          <Link className="app-shell-nav-link" to="/">
            Home
          </Link>
          <Link className="app-shell-nav-link" to="/routines">
            Routines
          </Link>
          <Link className="app-shell-nav-link" to="/exercises">
            Exercises
          </Link>
          <Link className="app-shell-nav-link" to="/history">
            History
          </Link>
        </div>
      </nav>

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
          <Route path="/variants/:variantId/edit" element={<EditVariantPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/history/variant/:variantId"
            element={<VariantHistoryPage />}
          />
          <Route
            path="/history/log/:logId/edit"
            element={<EditWorkoutLogPage />}
          />
          <Route path="/exercises/:exerciseId/edit" element={<EditExercisePage />} />
        </Routes>
      </main>
    </div>
  );
}