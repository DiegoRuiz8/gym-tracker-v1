import { Routes, Route, Link } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RoutinesPage from "../pages/RoutinesPage";
import RoutineDetailPage from "../pages/RoutineDetailPage";
import ExercisesPage from "../pages/ExercisesPage";
import HistoryPage from "../pages/HistoryPage";
import NewWorkoutLogPage from "../pages/NewWorkoutLogPage";
import VariantHistoryPage from "../pages/VariantHistoryPage";
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
          <Route path="/routines/:routineId" element={<RoutineDetailPage />} />
          <Route
            path="/routines/:routineId/log/:variantId"
            element={<NewWorkoutLogPage />}
          />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/variant/:variantId" element={<VariantHistoryPage />} />
          
        </Routes>
      </main>
    </div>
  );
}
